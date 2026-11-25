---
name: estilos-artisticos-f100k
description: "Crea ilustraciones pintadas con código (PNG o GIF del proceso) y clips animados de historia del arte en 20 estilos artísticos curados de FÓRMULA 100K, sin créditos de IA ni generadores de imágenes. Usar con «hazme un estilo artístico», «ilustración artística con código», «clip en acuarela / tinta china / vitral / bauhaus / ukiyo-e / collage»."
argument-hint: "[tema o escena] [estilo del catálogo top 20] [opcional: PNG, GIF o MP4 9:16 / 16:9]"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Glob, Grep
---

# Estilos artísticos · FÓRMULA 100K

Genera piezas con estética artística hecha **100% con código en tu compu** (sin tarjeta de video ni créditos de generación de imágenes):
- **Modo Ilustración (PNG o GIF haciéndose):** Python (`numpy` + `Pillow`), determinista (la misma semilla da siempre la misma obra).
- **Modo Arte en movimiento (MP4 9:16 o 16:9):** HTML/Canvas/SVG + HyperFrames + FFmpeg (primero apruebas 1 cuadro, después lo animamos).

## Tu brandkit (antes de producir)
Si tienes brandkit (`mi-marca/brandkit.md`, `MI-MARCA/marca.md` o `~/Documents/mi-contenido/mi-marca/`), adapta el color de acento o el tono del texto sin romper la textura ni la identidad del estilo artístico elegido.

## Reglas que no se rompen
1. **Todo en español neutro y tuteo.** Cualquier rótulo, título o etiqueta dentro de la obra va en español neutro.
2. **Un cuadro primero en video.** En Modo Arte en movimiento, genera y revisa primero 1 fotograma clave antes de renderizar los 8–12 s de video.
3. **Sin marcas registradas ni personajes con derechos.** Describe los estilos por su técnica plástica (pincelada, paleta, grano, tinta, papel), nunca copiando personajes registrados.
4. **Cero tembladera ni pitidos.** En clips animados, usa movimientos de cámara orgánicos (paneo suave, paralaje por capas, pinceladas que nacen) y solo sonidos graves opcionales.
5. **Revisión visual obligatoria.** Abre y revisa la imagen final (o la hoja de fotogramas del clip) antes de entregar para asegurar encuadre limpio y texto legible.

## Paso 0 · Elegir modo y estilo
Consulta `references/top-20-estilos.md` para ver los **20 estilos curados**:
- **10 estilos de ilustración (PNG / GIF):** `acuarela`, `tinta-china`, `collage-papel`, `risografia`, `ukiyo-e`, `lapiz-color`, `oleo-empastado`, `cianotipia`, `plastilina-stopmotion`, `plano-tecnico`.
- **10 estilos de arte en movimiento (MP4 9:16 o 16:9):** `impresionismo`, `art-nouveau`, `bauhaus`, `pop-art`, `vitral`, `teatro-sombras`, `anime-pintado`, `caricatura-anos-30`, `collage-editorial`, `vaporwave-retro`.

Si el usuario pide un estilo que no está en el top 20 (de la lista ampliada de 170), usa el kit descargable de **Estilos artísticos** instalado en `~/.claude/skills/`.

## Flujo de producción

### A) Modo Ilustración (Python `numpy` + `Pillow`)
1. Verifica que Python tenga `numpy` y `Pillow` (`python3 -c "import numpy, PIL"`). Si falta alguno, pide confirmación antes de instalarlo.
2. Lee la ficha del estilo elegido en `references/top-20-estilos.md` (paleta, textura de papel/lienzo, tipo de trazo y composición).
3. Escribe un script limpio `pintar.py` en la carpeta del proyecto (`~/Documents/mis-animaciones/arte-<slug>/`) con semilla fija (`SEED = 42`) que genere:
   - `obra.png` (1080×1920 vertical, 1080×1350 carrusel o 1920×1080 horizontal según lo que pidió el usuario).
   - `proceso.gif` (opcional, capturando 20–30 etapas del pintado si el usuario quiere mostrar el dibujo haciéndose).
4. Revisa `obra.png` con `Read` y ajusta composición, contraste o texto antes de entregar.

### B) Modo Arte en movimiento (HTML/Canvas/SVG + HyperFrames + FFmpeg)
1. Lee la ficha del estilo elegido en `references/top-20-estilos.md`.
2. Construye `escena.html` en capas separadas (fondo texturizado, plano medio, sujeto principal, primer plano y partículas/trazos) con un timeline determinista compatible con HyperFrames (`window.__SEEK__(t)`).
3. Captura y revisa el **Cuadro 0** (portada) y el **Cuadro medio** antes de renderizar.
4. Renderiza a MP4 (8 a 12 s por defecto, 30 fps):
   ```bash
   npx hyperframes render escena.html --output clip-artistico.mp4 --fps 30 --width 1080 --height 1920
   ```
   *(Para YouTube 16:9: `--width 1920 --height 1080`.)*

## Entrega
Entrega la ruta exacta de los archivos generados (`obra.png`, `proceso.gif` o `clip-artistico.mp4` + el código editable) y en una línea indica qué estilo y formato se usaron.
