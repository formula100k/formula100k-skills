# Trampas — pizarra explicativa

Todas verificadas en producción. Cada una costó al menos una ronda de fotogramas.

---

## 1. Los paths SVG nacen visibles aunque no estén dibujados

**Síntoma:** motas de tinta sueltas en la hoja desde el segundo 0, en sitios donde todavía no hay nada.

**Por qué:** el patrón de draw-on es `strokeDasharray = length; strokeDashoffset = length`. Con `stroke-linecap: round`, el navegador pinta igualmente un **punto redondo** del color del trazo en el arranque del path. Si el trazo aparece en el segundo 94, ese punto lleva ahí 94 segundos.

**Cómo evitarlo:** todo path de anotación lleva `opacity: 0` en CSS y se enciende con un `tl.set(p, {opacity: 1}, t)` en el frame exacto en que empieza a dibujarse. En la plantilla ya lo hacen `hwCalloutOn`, `hwBoxOn`, `hwMarkOn`, `hwArrowOn` y `ytCircleOn`.

Ojo con los que llevan opacidad propia (`.hw-co-scribble` va a 0.42): hay que restaurar **su** valor, no 1.

---

## 2. `gsap.from({opacity: 0})` sobre un elemento que ya es `opacity: 0`

**Síntoma:** el elemento no aparece nunca. Sin error en consola.

**Por qué:** `gsap.from()` registra el valor DESTINO en el momento en que se **construye** la línea de tiempo. Si el CSS del elemento es `opacity: 0`, el destino registrado es 0 → anima 0 → 0. Un `tl.to(el, {opacity:1, duration:.01})` justo antes no lo salva: el `.from` posterior lo sobreescribe.

**Cómo evitarlo:** para la opacidad usa solo `.to`. Si necesitas entrada con transformación, `fromTo` con inicio y fin explícitos.

Como el render va por salto de fotograma, el fallo es **silencioso**: sale un PNG casi vacío. Un fotograma de menos de 5 KB es un fotograma muerto.

---

## 3. El zoom tiene techo y por encima corta

**Síntoma:** cajas y títulos rebanados por el borde del cuadro. Se lee como error de montaje, no como encuadre.

**La cuenta:** con el lienzo a escala base `S` (0.432 en la plantilla) y un cuadro de ancho `FW`, a zoom `Z` se ve una franja de lienzo de `FW / (S × Z)` px de ancho.

Para que un grupo de `N` px quepa entero:

```
Z_max = FW / (S × N)
```

Una rejilla de 952 px de lienzo → `Z_max = 1080 / (0.432 × 952) = 2.63`. A 3.0 se come las cajas de los extremos.

**Cómo evitarlo:** calcula el techo **antes** de elegir el zoom. Y comprueba también el borde superior: si el beat anterior termina en `y = 1284`, el encuadre siguiente debe empezar por debajo de ahí o entrará su resto cortado.

---

## 4. El foco ensucia el papel

**Síntoma:** el fotograma entero se ve gris sucio, como una viñeta mal hecha, en vez de un foco.

**Por qué:** `yt-feather-highlight` trae `--yt-hl-dim: 0.34`, pensado para vídeo oscuro. Sobre papel crema baja el blanco de 246 a 215 en toda la hoja.

**Cómo evitarlo:** sobre superficie clara, `--yt-hl-dim: 0.10`, y el agujero lo bastante grande para cubrir el grupo activo, no solo una palabra. Mídelo, no lo estimes:

```bash
python3 -c "from PIL import Image; im=Image.open('f.png').convert('RGB'); print(im.getpixel((60,60)))"
```

---

## 5. La elipse cruza el texto en vez de envolverlo

**Síntoma:** «el que se sale de la media» se lee «eKque se sale de la media».

**Por qué:** `hwCalloutBuild` construye la elipse con `rx = ancho_contenedor × 0.42`. Si haces el contenedor del tamaño del texto, la elipse sale bastante más pequeña que el texto y lo atraviesa.

**Cómo evitarlo:** el contenedor va **más ancho que el texto y centrado sobre él**: `ancho ≥ ancho_texto / 0.84`. Y sobre una línea de texto, `scribble: false` — el rayado se come la legibilidad. El rayado solo para una palabra corta y grande (un número, un «×10»).

---

## 6. Restos del beat anterior entrando por el borde

**Síntoma:** muñones de trazo rojo o fragmentos de caja asomando por un lado del cuadro.

**Por qué:** el lienzo es continuo. Si dos bloques comparten franja de `x`, cualquier encuadre de uno pilla el borde del otro.

**Cómo evitarlo:** dos cosas a la vez. Separa en el lienzo los bloques que nunca deben coincidir en cuadro, y **atenúa por sub-grupo** (`settle`, 32 %) lo ya explicado, para que si algo asoma se lea como mapa de fondo y no como basura. Nunca por debajo de ~0.3: más abajo el trazo negro sobre crema desaparece.

---

## 7. `hyperframes check` da dos errores falsos y no ve los de verdad

**Falsos positivos, ignóralos:**
- `content_overlap` entre líneas de texto grandes en Caveat. Mide la caja de tinta del glifo, no la línea; Caveat tiene ascendentes muy altas.
- `escaped_container` / `container_overflow` sobre `#cam`. Es el zoom de la cámara: intencional.

**Lo que NO detecta y hay que ver a ojo:** encuadres que cortan, elipses descentradas, restos de beats anteriores, ritmo. **Mira siempre las hojas de contacto.**

---

## 8. Entrega: nunca el ProRes

ProRes 4444 es el único perfil de ProRes con alfa y no comprime entre fotogramas. Un clip de 2:19 a 1080×864 pesa **4,1 GB**.

**HEVC con alfa** pesa **100 MB** (41× menos), con diferencia de color de 1,86/255 de media contra el ProRes — invisible. Lo leen CapCut, Premiere y Final Cut en Mac.

```bash
ffmpeg -i master.mov -c:v hevc_videotoolbox -alpha_quality 0.85 -allow_sw 1 \
  -tag:v hvc1 -pix_fmt bgra -b:v 6M -an salida.mov
```

**No entregues WebM/VP9**: guarda el alfa (`alpha_mode=1`) pero Premiere no lo lee. Es un archivo trampa.

**Verifica el alfa decodificando un fotograma, no con ffprobe.** En HEVC el alfa va en una capa auxiliar y `ffprobe` reporta `pix_fmt=yuv420p` aunque esté ahí:

```bash
ffmpeg -v error -ss 29 -i salida.mov -frames:v 1 -pix_fmt rgba -y /tmp/f.png
python3 -c "from PIL import Image; im=Image.open('/tmp/f.png').convert('RGBA'); w,h=im.size; \
print('esquina',im.getpixel((3,3)),'centro',im.getpixel((w//2,h//2)),im.split()[3].getextrema())"
```

Correcto = esquina con alfa ≈ 0, centro con alfa 255.

---

## 9. Menudencias que cuestan tiempo

- **`hyperframes add` se traga la cola por stdin.** Un bucle `for b in ...; do hyperframes add "$b"; done` muere en silencio tras el primero. Pasa `</dev/null` a cada llamada.
- **`hyperframes check` exige una `d` estática en el HTML** para cualquier path al que le llames `getTotalLength()`. Aunque la reasignes por JS antes de medir, el lint no lo ve y falla. Deja una `d` de marcador en el marcado.
- **Caveat va empaquetada**, con ruta **relativa a la raíz** del proyecto (`assets/fonts/…`). Chrome headless bloquea `file://` absoluto y `../` es error de lint.
- **`hwBoil` es dueño de `x/y/rotation`** de sus objetivos. Entradas y salidas van en un envoltorio; si animas `x` sobre un elemento que tiembla, el temblor te lo pisa cada frame.
- **Una línea de tiempo, un `onUpdate`.** Registra cada render por frame con `hwOnUpdate`, nunca con `eventCallback` directo.
- **Las flechas de `hw-arrow`** siempre nacen abajo-izquierda y apuntan arriba-derecha. Para otras direcciones envuelve en un div con `scaleX(-1)` / `scaleY(-1)`; no rotes el elemento que tiembla.
- **Cierre a mapa completo con `Z 0.92`, no 1.0.** A escala 1 el lienzo mide exactamente el alto del cuadro, y la hoja tiene 14 px de margen: las últimas líneas quedan cortadas contra el borde.
- **macOS no trae `timeout`.** Para vigilar un render largo, lánzalo en segundo plano y sondea el archivo de salida.
- **Los huecos de más de 5 s sin dibujo nuevo** se sostienen con una deriva lenta de cámara (4-5 s, sin pulso de desenfoque), no inventando contenido que no dice.
