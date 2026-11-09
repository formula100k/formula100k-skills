---
name: telenovela-explicada-f100k
description: Arma un reel vertical en formato TELENOVELA para explicar una herramienta, tu producto o una historia real, en dos modos. (A) COLLAGE DOCUMENTAL en stop motion con voz en off: gancho sobre una foto real de los protagonistas con una zona lisa para el texto, documentos históricos con marcador amarillo y círculo rojo a mano (paper, anuncio, post original), rótulos por nombre, fecha y cifra, y datos con fuente. (B) TELENOVELA DE FRUTAS con personajes 3D que dialogan (Kling): cuando un personaje dice su nombre entra un TUTORIAL ANIMADO de la app a pantalla completa (cursor que hace clic, texto que se escribe, archivos que entran, interruptores que se encienden), nunca capturas quietas encima de la escena. Trae el montador que corta en el punto más silencioso (no se come palabras), la plantilla HyperFrames de 6 tutoriales de Claude en español y letras con licencia libre. Usar cuando digan «hazlo en telenovela», «telenovela de frutas», «frutinovela», «el nacimiento de X en collage», «historia real en collage stop motion», «explícalo con personajes que hablan», «tutorial animado de la app», «motion graphics de cómo se usa», o pidan las plantillas «Telenovela de frutas» o «Collage documental». NO usar para un collage corto sin historia (animacion-collage-stopmotion-f100k), para editar un video tuyo a cámara, ni para cortometrajes de cine.
argument-hint: [tema o herramienta] [modo: collage | frutas]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Telenovela explicada (collage documental · telenovela de frutas)

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Dos formatos para explicar algo complejo sin salir a cámara. Los dos terminan en un reel 1080x1920 con gancho golpe, subtítulos de UNA palabra en serif (las palabras clave en amarillo), sonidos graves y CTA con una palabra para comentar.

## Reglas que hacen que funcione

| Lo que NO funciona | Lo que sí |
|---|---|
| Gancho sobre una foto llena de cosas (una calle, un edificio sin contexto): nadie entiende qué mira | UNA foto real de los protagonistas con una zona LISA (fondo de estudio, cielo, pared). El texto va ahí y se lee al instante |
| Siluetas o lugares para decir «trabajaban ahí» | El documento ORIGINAL que lo prueba (paper firmado, anuncio, post), con marcador amarillo en el nombre y círculo rojo en la empresa |
| Capturas quietas de la app pegadas encima de la escena: tapan a los personajes | Tutorial ANIMADO a pantalla completa que entra después de que el personaje dice su nombre («Yo soy Chat…») |
| Cortar en la marca de tiempo de la palabra o quitar «¡Oh!»/«¡Ah!»: se cortan palabras y los cortes se sienten bruscos | Cortar en el punto más silencioso, entre 0,12 y 0,55 s después de la última palabra; dejar las exclamaciones |
| Franja borrosa arriba del clip (Kling la agrega para llenar el 9:16): se ve como un bloque negro | Recortarla (`recorte_arriba`) y, si el texto no se lee, poner un degradado real (`degradado`) |

Además:
- **Cifras, fechas y citas solo con fuente.** Arma `DATOS.md` con la frase corta y su enlace. Lo que no se confirma no entra al guion.
- **Fotos:** las de Wikimedia con licencia CC llevan crédito en el caption. Una foto de prensa (revista, diario) lleva el crédito en pantalla y en el caption, y no es de licencia libre: úsala sabiendo eso.
- **Gancho golpe:** de 2 a 5 palabras, una línea ENORME y otra chica que se leen como una sola frase. Va negativo o polémico, o con una cifra real. La voz arranca diciendo lo mismo.
- **Sonido:** nada agudo (ni campanas, ni timbres, ni clics). Solo pops y golpes graves.

## Preparación (una vez)

```bash
python3 -m venv ~/.venv-telenovela && ~/.venv-telenovela/bin/pip install pillow numpy
# ffmpeg y HyperFrames (npm i -g hyperframes) instalados
```
Usa `~/.venv-telenovela/bin/python` para los scripts. `K` = carpeta de esta skill.

## Modo A · Collage documental (stop motion)

1. **Datos y material** en `material/`: la foto de los protagonistas, el documento histórico (PDF → `pdftoppm -r 200 -png doc.pdf doc-p1`) y las capturas de anuncios con fecha visible. **Ojo con las coordenadas:** si mides sobre una vista escalada de la imagen, conviértelas al tamaño original antes de recortar o marcar.
2. **Voz** en una sola toma, sin silencios, con frases de 15 palabras o menos. Usa tu voz grabada o clonada. Una cita real del protagonista funciona muy bien.
3. **Escenas** con la plantilla de `animacion-collage-stopmotion-f100k` (salto cada 4 cuadros): una escena cada 1,5–3 s, cortada en la palabra.
4. **Los primeros segundos con imágenes históricas:** copia el ejemplo del docstring de `K/scripts/intro_documental.py` a un `intro.json`, con tu foto, tu documento y tus recortes, y córrelo. Después empalma el resultado delante de tu collage:
   ```bash
   python K/scripts/intro_documental.py intro.json                     # → intro.mp4
   ffmpeg -ss <fin_intro> -i collage.mp4 -an -c:v libx264 -r 30 resto.mp4
   ffmpeg -i intro.mp4 -i resto.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,fps=30[v]" -map "[v]" base.mp4
   ```
5. **Montaje:** `python K/scripts/montar3.py spec.json` (parte de `K/plantillas/spec-collage-documental.json`): gancho, `rotulos` con nombre, fecha y cifra (letra `cartel`, en amarillo, rojo o verde), subtítulos, pops y CTA final.

## Modo B · Telenovela de frutas (Kling + tutoriales animados)

1. **Reparto:** la protagonista que «no es ingeniera», el que se burla y un personaje por cada parte de la herramienta (por ejemplo, tres hermanas naranja = Chat, Cowork y Code; dos primos = los conectores). Cada uno dice su nombre y para qué sirve en una frase.
2. **Clips** en Kling 3.0 con diálogo en español, uno por escena. Saca los tiempos de cada palabra a un JSON (`{"s01.wav": {"palabras": [{"w","t0","t1"}]}}`). Si la música confunde a Whisper, pídeselos a Gemini.
3. **Tutoriales:** copia `K/plantillas/tutoriales-ui/` a tu proyecto y edita `index.html`. Trae 6 escenas de 5 s (Chat, Cowork, Code, Proyectos, Habilidades y Conectores) con la app en español, los logos oficiales y un caso de ejemplo (una pastelería). Cambia el caso por tu negocio o tu rubro. Reglas de la plantilla:
   - La ventana va con `zoom:1.3` para que la letra se lea en el celular. El contenido vive entre y=260 y y=1340, porque abajo van los subtítulos.
   - El cursor va al elemento real: `mueve("#cursor", t, "#boton", 0, dur)` calcula su centro solo. Al terminar, se esconde fuera del cuadro.
   - El texto se escribe letra por letra con `escribe()`. Los interruptores se mueven con `x`, nunca con `left`.
   - Movimiento suave, sin rebote ni temblor. Lo importante pasa en los primeros 2,3 s, porque la escena puede durar solo eso.
   - Para hacer el render y partirlo en 6:
     ```bash
     hyperframes render --quality high --output tutoriales.mp4
     for i in 0 1 2 3 4 5; do ffmpeg -ss $((i*5)) -t 5 -i tutoriales.mp4 -c:v libx264 -r 30 tut/t$i.mp4; done
     ```
   - Si prefieres tu pantalla real, graba tu Claude haciendo lo mismo y usa esos clips.
4. **Montaje:** `python K/scripts/montar3.py spec.json` (parte de `K/plantillas/spec-frutinovela.json`). Por clip:
   - `"tutorial": {"archivo": "tut/t0.mp4", "palabra": "converso"}`: el tutorial entra a pantalla completa en esa palabra (la que sigue al nombre) y dura hasta el final del clip.
   - `"recorte_arriba": 280`: quita la franja borrosa de Kling, medida en píxeles del clip original. `python K/scripts/valles.py` te ayuda a ver el audio; para la franja, mira dónde la imagen se vuelve nítida.
   - `"acercar_en": 1.3`: golpe de acercamiento durante el gancho.
   - En el gancho, `"degradado": 0.75, "degradado_alto": 820` si el fondo no deja leer, y `"y"` para subirlo si tapa caras.
   - En `voces`, tu voz para el gancho y el CTA. En `finales`, la palabra del CTA.

## Revisión antes de publicar

1. Saca fotogramas del gancho, de cada tutorial a la mitad y al final, y de la franja de arriba de cada clip.
2. Escucha cada corte con audífonos: ninguna palabra puede quedar cortada.
3. Pon los créditos de las fotos en el caption.

## Archivos

- `scripts/montar3.py`: el montador (gancho, rótulos, subtítulos, pops, CTA, cortes en el punto más silencioso, tutoriales, `recorte_arriba` y `degradado`).
- `scripts/valles.py`: dibuja el volumen del audio y encuentra el punto más silencioso.
- `scripts/intro_documental.py`: inicio con foto real y documento marcado, configurado con un JSON.
- `plantillas/tutoriales-ui/`: proyecto HyperFrames con 6 tutoriales de Claude en español.
- `plantillas/spec-*.json`: specs de ejemplo de los dos modos.
- `fuentes/`: Sello Vivo, Anton e Instrument Serif, todas con licencia SIL OFL 1.1.
