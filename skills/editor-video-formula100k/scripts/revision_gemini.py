"""Revisión del guion con Gemini: segunda lectura del corte, obligatoria en el protocolo.

Después del pase semántico de Claude (o en su lugar, si no hay llave de
Anthropic), Gemini lee el transcript que QUEDÓ, palabra por palabra con su
índice, y marca lo que todavía sobra: muletillas («este», «o sea», «bueno»,
«¿no?», «tipo»), repeticiones, arranques en falso, frases dichas dos veces y
re-enunciados que no suman. Devuelve el mismo JSON que el pase de Claude
({"drop": [{"start", "end", "reason"}]}), así que el motor lo aplica con la
misma guarda contra borrar de más.

Solo usa la biblioteca estándar (urllib): no hay que instalar el SDK de Google.

La llave se busca en este orden:
  1. variable GEMINI_API_KEY (o GOOGLE_API_KEY)
  2. archivo ~/.editor-video/llave-gemini.txt  (la llave empieza con «AIza»)
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ARCHIVO_LLAVE_GEMINI = Path.home() / '.editor-video' / 'llave-gemini.txt'
DEFAULT_GEMINI_MODEL = os.environ.get('EDITOR_MODELO_GEMINI') or 'gemini-2.5-flash'
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent'
# La revisión de Gemini es una segunda pasada sobre un corte ya limpio:
# nunca debería borrar más de una cuarta parte de lo que queda.
DEFAULT_GEMINI_MAX_DROP = 0.25

SISTEMA_REVISION_GEMINI = (
    "Eres la revisora final de guiones de reels hablados en español. Recibes el "
    "transcript de un video YA cortado, palabra por palabra, cada una con su índice "
    "[n]. Tu trabajo es encontrar lo que TODAVÍA sobra para que el video no tenga "
    "ni un segundo de relleno.\n\n"
    "BORRA (marca sus índices):\n"
    "1. Muletillas: 'este', 'o sea', 'bueno', 'pues', 'tipo', 'como que', "
    "'digamos', 'la verdad', 'básicamente', '¿no?', '¿sí?', '¿vale?', 'eh', 'mmm', "
    "cuando no cargan sentido.\n"
    "2. Repeticiones: la misma palabra o frase dicha dos veces seguidas o casi "
    "seguidas (deja la ÚLTIMA versión completa).\n"
    "3. Arranques en falso y auto-correcciones: frases que empiezan y se abandonan, "
    "'no, perdón', 'a ver', 'espérate', 'lo digo otra vez'.\n"
    "4. Re-enunciados: la misma idea dicha otra vez con otras palabras sin sumar "
    "información (deja la versión más clara).\n\n"
    "PROTEGE SIEMPRE: la primera frase (gancho), los pasos, datos, nombres, "
    "ejemplos que cargan el mensaje y el llamado a la acción final completo. "
    "No reordenes ni reescribas; el texto que queda tiene que leerse corrido y "
    "con sentido. Ante la duda, CONSERVA.\n\n"
    "Responde EXCLUSIVAMENTE un objeto JSON con esta forma:\n"
    '  {"drop": [{"start": <idx>, "end": <idx>, "reason": "<motivo corto>"}]}\n'
    "donde start..end es un rango INCLUSIVO de índices a borrar. Si no sobra nada, "
    'responde {"drop": []}.'
)


def leer_llave_gemini(entorno: dict | None = None,
                      archivo: Path = ARCHIVO_LLAVE_GEMINI) -> tuple[str | None, str | None]:
    """Devuelve (llave, origen) o (None, None)."""
    entorno = os.environ if entorno is None else entorno
    for var in ('GEMINI_API_KEY', 'GOOGLE_API_KEY'):
        v = (entorno.get(var) or '').strip()
        if v:
            return v, f'la variable {var}'
    try:
        texto = Path(archivo).read_text(encoding='utf-8')
    except OSError:
        return None, None
    m = re.search(r'AIza[0-9A-Za-z_-]{20,}', texto)
    if m:
        return m.group(0), str(archivo)
    return None, None


def _ssl_context():
    import ssl
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def call_gemini(prompt: str, api_key: str, model: str = DEFAULT_GEMINI_MODEL,
                system: str = SISTEMA_REVISION_GEMINI, timeout: float = 120.0) -> str | None:
    """POST a generateContent de Gemini. Devuelve el texto o None si falla (y dice por qué)."""
    body = json.dumps({
        'systemInstruction': {'parts': [{'text': system}]},
        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'},
    }).encode('utf-8')
    req = urllib.request.Request(
        GEMINI_API_URL.format(modelo=model), data=body, method='POST',
        headers={'x-goog-api-key': api_key, 'content-type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
            payload = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as ex:
        try:
            detalle = json.loads(ex.read().decode('utf-8')).get('error', {}).get('message', '')
        except Exception:
            detalle = ''
        print(f'      ⚠ revisión Gemini: la API respondió {ex.code}. {detalle}'.rstrip(),
              file=sys.stderr)
        return None
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as ex:
        print(f'      ⚠ revisión Gemini: no hubo conexión con la API ({ex}).', file=sys.stderr)
        return None
    try:
        partes = payload['candidates'][0]['content']['parts']
        return ''.join(p.get('text', '') for p in partes)
    except (KeyError, IndexError, TypeError):
        print('      ⚠ revisión Gemini: respuesta vacía o bloqueada.', file=sys.stderr)
        return None
