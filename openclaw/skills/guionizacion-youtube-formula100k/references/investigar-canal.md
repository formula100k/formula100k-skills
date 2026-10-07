# Cómo investigar un canal de YouTube

Esta es la metodología usada con SPRINGFIELD HUB. Síguela para cada canal nuevo así las fichas se pueden comparar entre sí.

## 1. Datos del canal

```bash
python3 scripts/canal_videos.py @handle --json canal.json
```

Mira:
- **La mediana de vistas**: es lo que el canal saca normalmente. Los suscriptores engañan: SPRINGFIELD HUB tiene 391K suscriptores y una mediana de 1.350 vistas.
- **Los outliers (★ 5x o más, ★★ 50x o más)**: son los únicos videos que vale la pena estudiar en detalle.
- **Qué hizo el canal después de un outlier**: si copió el tema, ¿le funcionó? Esto dice si el hit fue por el tema o por otra cosa.
- **La fecha de publicación**: si todo dice "hace 1 año", el canal puede estar inactivo y sus patrones pueden haber quedado viejos.

La página /videos muestra solo los ~30 más recientes. Si el canal es grande, pide al usuario que te diga cuáles son sus videos más vistos, o busca el canal en Social Blade o vidIQ.

## 2. Transcripciones

```bash
python3 scripts/transcripcion.py https://www.youtube.com/watch?v=ID t_ID.txt
```

Baja los 2 o 3 outliers principales y, si se puede, 1 video normal del mismo canal para comparar. Desde servidores en la nube YouTube suele bloquear la descarga (RequestBlocked). En ese caso, usa la skill `transcripcion-youtube-formula100k` o el MCP de transcripción, o pide al usuario que pegue la transcripción (en YouTube: "Mostrar transcripción").

## 3. Ritmo

```bash
python3 scripts/densidad_giros.py t_ID.txt
```

Anota los segundos por giro, las palabras por minuto y los tramos sin giro más largos. Compara el outlier contra el video normal.

## 4. Mapa minuto a minuto

Lee la transcripción completa y marca:
- **Setup**: quién es el protagonista, qué quiere o qué teme.
- **Giro**: algo que cambia la situación.
- **Reloj**: un plazo, una fecha o una amenaza con fecha.
- **Pregunta**: se abre algo que el espectador quiere saber. Anota cuándo se cierra.
- **Falsa pista**: el guion hace creer algo que después desmiente.
- **Caída**: todo sale mal.
- **Clímax** y **Cierre**.

Anota el minuto y una cita textual corta de cada marca. Las citas reales son lo que hace creíble la guía.

## 5. Títulos

Copia los títulos de los outliers y de 5 videos normales. Busca la fórmula: qué promete el outlier que el normal no promete.

## 6. Guardar lo aprendido

1. Crea `references/canales/<nombre-canal>.md` con `_plantilla-canal.md`.
2. Si un patrón aparece en 2 canales o más del mismo formato, súmalo a `references/formatos/<formato>.md` con la cantidad de canales que lo confirman.
3. Si el formato no existe, crea `references/formatos/<formato>.md` copiando la estructura de `resumen-pelicula.md`.
4. Si un dato contradice lo que dice un formato, corrige el formato y anota el cambio. Los números de esta skill tienen que salir de canales reales.

## Qué no hacer

- No saques conclusiones de un solo video. Compara siempre outlier contra normal.
- No inventes vistas ni minutos. Si no pudiste medir algo, dilo.
- No copies textos de otro canal en un guion nuevo. Se copia la estructura, no las frases.
