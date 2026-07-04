# Diseño: `reel-faceless-f100k` + Clip Director (motor compartido)

- **Fecha:** 2026-07-04
- **Autora:** Andrea Vega (FÓRMULA 100K)
- **Estado:** Aprobado (diseño) → pendiente plan de implementación

## Problema

El "Higgsfield Explainer" del marketplace demuestra un principio útil: **tema → video
faceless donde la IA genera todo (visuales + voz), sin cámara ni presentadora**. Pero es
genérico: no conoce la marca de Andrea, sus criterios de viralidad ni su español neutro.

En el ecosistema F100K hay piezas sueltas del principio pero **ninguna skill lo hace completo**:

| Skill existente | Faceless | Visuales 100% IA | Diferencia |
|---|---|---|---|
| `tutorial-viral-f100k` | Sí | No | Depende de screen-recording + UI real |
| `broll-vsl-formula100k` | Sí | Sí | Es un componente (solo B-roll), no el video con voz |
| `clona-trend-video-f100k` | Sí | Sí | Replica un viral específico, no "cualquier tema" |
| `videos-avatar-formula100k` | No | — | Lo contrario: con la cara de Andrea |

**Hueco real:** una skill que tome un tema y devuelva un explainer faceless 9:16 con ADN
F100K, donde Andrea graba la voz pero nunca sale en cámara.

## Objetivo

Escalar el contenido de Andrea sin depender de su cara (estrategia 2026), reutilizando
los motores ya probados del ecosistema en vez de reconstruirlos.

## Requisitos (definidos en brainstorming)

1. **Propósito:** contenido faceless propio de @andreaestratega.
2. **Estilo visual:** mixto por gancho — la skill decide B-roll cinemático / card kinética /
   pixel-meme según el tema y el gancho de cada segmento.
3. **Voz:** Andrea **graba** la voz en off (solo audio, sin cámara). La skill monta los
   visuales sincronizados sobre su audio real (no IA de voz).
4. **Formato:** Reel 9:16 corto (30–90 s).
5. **Extensión:** la generación de clips es un **motor compartido** que también alimenta el
   editor de YouTube 16:9 con clips de apoyo (B-roll) a medida del guion.
6. **Selección de clips en YouTube:** auto — la skill lee el transcript, propone momentos que
   piden apoyo visual, y Andrea aprueba.

## Arquitectura — 3 piezas

```
        ┌─────────────────────────────────────┐
        │  CLIP DIRECTOR (motor compartido)    │
        │  transcript segmentado + formato +   │
        │  modo → plan por segmento + clips     │
        │  generados + colocación               │
        └─────────────────────────────────────┘
             ▲                          ▲
     modo=full│                   modo=support│
   ┌─────────┴────────┐      ┌──────────┴──────────┐
   │ reel-faceless-   │      │ editor-video (modo  │
   │ f100k  9:16      │      │ YouTube 16:9)       │
   │ (voz → video)    │      │ (talking-head +     │
   │                  │      │  clips de apoyo)    │
   └──────────────────┘      └─────────────────────┘
```

### Pieza 1 — `reel-faceless-f100k` (skill nueva, cara al usuario)

Skill *orquestadora delgada*. Su valor no es generar (eso ya se domina) sino **dirigir**.

Pipeline:

1. **Tema → guion.** Reutiliza el ADN de `guionizacion-formula100k` (33 estructuras, sistema
   de hooks, español neutro, cierre que vende F100K). Formato 9:16 corto. Produce también el
   texto teleprompter.
2. **Andrea graba la voz** leyendo el teleprompter (solo audio).
3. **Transcripción word-level** con Whisper local (motor de `editor-video` / `motion-reels`).
4. **Clip Director** (ver Pieza 2) en `modo=full`, formato `9:16`.
5. **Composición** con ffmpeg: visuales fullscreen 9:16 + texto kinético de énfasis + voz de
   Andrea + música/SFX → `BORRADOR_AUTO_FACELESS.mp4`.

### Pieza 2 — Clip Director (motor compartido)

Lo único genuinamente nuevo. Contrato claro para que sirva a ambos flujos.

- **Entrada:**
  - `transcript` segmentado (word-level con timecodes)
  - `formato`: `9:16` | `16:9`
  - `modo`: `full` (los clips SON el video) | `support` (clips de apoyo sobre otra toma)
- **Lógica (el "cerebro"):** por cada segmento clasifica el gancho/contenido y asigna tipo de
  visual:
  - dato / cifra / comparación → **card kinética** (HyperFrames, alfa)
  - concepto / narrativa / aspiracional → **B-roll cinemático IA** (`broll-vsl` / Higgsfield
    seedance)
  - remate / chiste / cultura pop → **pixel-meme** (`recursos-pixel` + `reel-memes`, chroma)
- **Salida:**
  - plan por segmento (tipo de visual + prompt)
  - clips generados (URLs / archivos)
  - colocación: timecodes (modo `full`) o anclas por keyword (modo `support`, formato MANIFEST)

### Pieza 3 — Enganche en `editor-video-formula100k` (modo YouTube 16:9)

Tras transcribir el talking-head, el editor llama al Clip Director en `modo=support`,
formato `16:9`. El Director **auto-propone** clips para conceptos/datos/ejemplos; Andrea
aprueba; los aprobados se inyectan como entradas B-roll en el MANIFEST (keyword-based, igual
que hoy). Los clips son *apoyo* sobre la toma, no reemplazan la cara.

Esto cubre algo que hoy está a medias: el editor de YouTube saca B-roll de `recursos-de-video`
(que *caza* recursos sueltos) pero no **genera clips a medida del guion**.

## Decisiones por defecto (aprobadas)

1. **Texto en pantalla:** kinético de énfasis (palabras clave), NO subtítulos completos —
   coherente con `editor-video` (va sin subtítulos).
2. **Degradación elegante:** si Higgsfield se queda sin créditos, el Director cae a
   cards/pixel o caza recursos con `recursos-de-video` en vez de fallar (patrón MAESTRO).
3. **Nombre de la skill:** `reel-faceless-f100k`.
4. **Salida:** `FORMULA100K/RECURSOS VIDEOS/YYYY-MM-DD_<tema>/` siguiendo convención existente.

## Manejo de errores / adaptación

- Sin créditos Higgsfield → degradación elegante (arriba).
- Audio no transcribible / muy ruidoso → avisar y pedir regrabar el tramo.
- Segmento sin clasificación clara → default a card kinética (opción más barata y siempre
  disponible).

## Testing

- Dry-run con un guion corto (~45 s) y un audio de prueba: verificar que el Director produce
  un plan mixto coherente y que ffmpeg compone el 9:16 sincronizado.
- Verificar `modo=support` sobre un transcript 16:9 de ejemplo: que las anclas por keyword
  entren bien al MANIFEST del editor.

## Fuera de alcance (YAGNI)

- Voz IA / clon de voz (Andrea graba).
- Formato 16:9 como salida de `reel-faceless-f100k` (solo 9:16; el 16:9 se sirve vía el
  enganche al editor existente).
- Subtítulos completos.
- Publicación automática (eso es otra skill: `publicar-ig`).

## Reutilización (nada de reconstruir motores)

| Necesidad | Motor reutilizado |
|---|---|
| Guion + hooks + español neutro | `guionizacion-formula100k` |
| Transcripción word-level | `editor-video` / `motion-reels` (Whisper local) |
| B-roll cinemático IA | `broll-vsl-formula100k` (Higgsfield seedance) |
| Cards kinéticas alfa | HyperFrames |
| Pixel / meme | `recursos-pixel` + `reel-memes` |
| Fallback de recursos | `recursos-de-video-formula100k` |
| Composición final | ffmpeg |
