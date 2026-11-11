---
name: explicacion-blanco-negro-f100k
description: Arma un reel vertical sin cara en estilo EXPLICACIÓN EN BLANCO Y NEGRO, hecho en Blender por código y sin créditos. Un solo plano secuencia de 10 s con línea técnica fina sobre fondo negro, un globo alámbrico en 3D real y una cámara que orbita y avanza sin parar. Una idea se arma pieza por pieza, de ella salen N arcos y en cada aterrizaje nace una pantalla mientras el contador sube, el equipo se pasa el trabajo y, al final, el globo se pela, la cámara entra y el fondo pasa a blanco sin corte para el CTA. Usar cuando digan «explicación en blanco y negro», «plantilla Explicación en blanco y negro», «el del globo de líneas», «reel de líneas blancas sobre negro», «explainer blanco y negro», «el que se invierte a blanco al final». NO usar para la pizarra a mano (pizarra-explicativa-f100k), para los objetos en pedestal con luz cálida (objetos-3d-minimal-f100k), para el avatar con tele (avatar-mini-tele-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema + 4 frases cortas + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Explicación en blanco y negro (reel sin cara en Blender)

Un plano secuencia de 10 s, sin cortes. Sobre fondo negro, todo es línea blanca fina: una esfera de triángulos (la idea), un globo de meridianos, arcos que se dibujan y pantallas verticales con su play y su barra de avance. Arriba, una cifra grande que cambia con lo que pasa abajo. Al final el globo se pela a parches, la cámara se mete adentro y el fondo pasa de negro a blanco dentro de la toma: ahí aparece el CTA en negro sobre blanco con los videos abriéndose en abanico. Todo se arma por código en Blender (EEVEE + Freestyle), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento va en `colores.acento` de `config.json` y pinta la cifra que sube, la palabra clave de la frase 3 y la palabra del CTA. Si su marca es oscura, `colores.oscuro` puede tomar su tono más oscuro (azul noche, café) y `colores.claro` su crema o blanco: la línea, el fondo y la inversión siguen siendo de **dos tonos**. No le metas más colores: el estilo vive del contraste. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y 4 frases cortas**, que caben en el molde de 10 s:
   - Frase 1: una cifra y una palabra («1 / idea»).
   - Frase 2: de dónde sale y qué se multiplica («1 idea → 8 videos»). La cantidad va de 3 a 10 y tiene que ser real (no inventes cifras).
   - Frase 3: un conector en itálica, una línea corta y una palabra clave enorme («tu equipo trabaja / MIENTRAS / DUERMES»).
   - Frase 4: el CTA, «comenta [PALABRA]».
2. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
3. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, las frases caen en los tiempos del molde.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json`, `plantilla/montar.sh` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `cta`: tu palabra del CTA (sale en mayúsculas).
   - `frase1.numero` y `frase1.palabra`.
   - `frase2.desde`, `frase2.cantidad` (de 3 a 10: son las pantallas que nacen y el número al que llega el contador), `frase2.singular` y `frase2.plural` (el contador dice «1 video» y desde el 2 «videos»).
   - `frase3.conector`, `frase3.linea` y `frase3.clave`.
   - `frase4.conector` («comenta»).
   - `colores.oscuro`, `colores.claro` y `colores.acento` (`null` = sin acento, todo en dos tonos).
   Las palabras largas se achican solas para no salirse; aun así, mientras más cortas, más fuerte.
3. **Si el tema lo pide, adapta los objetos** en `build.py`: la idea es la icosfera `idea`, las pantallas son `pantalla{i}` con su `play` y su `barra`, el globo es `globo` y el abanico final son los `video{i}`. Cambia la forma, no el sistema: todo sigue siendo geometría que Freestyle dibuja en línea fina. Los tiempos están en `SALE`, `LLEGA`, `F_TXT_C`, `F_PELA` y `F_NUCLEO`; la cámara, en `CLAVES` (cuadro, giro, altura, distancia y a qué altura mira).
4. **Prueba rápida:** `BN_SCALE=50 blender -b -P build.py` y luego `blender -b escena.blend -o //prueba/p_#### -f 13 -f 115 -f 217 -f 285`. Revisa esos 4 cuadros con la lista de abajo antes de renderizar todo.
5. **Render completo:** `blender -b -P build.py`, luego `blender -b escena.blend -a` (300 cuadros, unos 2 s por cuadro en una Mac M) y `./montar.sh`. Deja `muestra.mp4` (con resplandor fino, viñeta y grano), `poster.jpg` y `cuadros.jpg`, la hoja de 9 cuadros: **mírala entera** antes de entregar. `montar.sh` también mide el tiempo quieto: no tiene que salir ningún «freeze».
6. **Sonido:** pop, swish y golpe sordo graves en cada aterrizaje de pantalla y en la inversión a blanco. Nada agudo (nada por encima de ~3 kHz), sin timbres ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿La línea es fina y limpia, y las líneas lejanas se apagan (hay profundidad)?
2. ¿La cifra de arriba cambia justo cuando aterriza cada pantalla, y dice «1 video» en singular?
3. ¿Cada palabra entra con corte seco, sin rebote ni temblor?
4. ¿La palabra clave y el CTA no pisan la línea de arriba?
5. ¿El paso a blanco ocurre dentro de la toma (el globo se pela y la cámara entra), sin corte?
6. ¿El CTA es tu palabra y se lee completo en negro sobre blanco?
7. ¿Hay texto encima de y < 180 o debajo de y > 1650? (El abanico final puede bajar: si estorba a los subtítulos, súbelo o achícalo en `ABANICO`.)

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Un solo plano secuencia.** Nada de cortes: la toma se transforma. La cámara orbita y avanza todo el tiempo (0 % quieto).
- **Dos tonos y línea fina.** Fondo negro, línea blanca, una sola familia de grises; el acento de marca, si lo hay, solo en la cifra, la clave y el CTA.
- **Geometría 3D real.** La línea sale de Freestyle sobre objetos de verdad, así que hay paralaje entre la idea, el globo, las pantallas y el polvo del fondo. No es un dibujo plano con zoom.
- **El número está atado a la acción:** cada pantalla que aterriza sube el contador. Nunca un rótulo suelto.
- **La inversión es «la otra cara»:** el paso de negro a blanco pasa dentro de la toma y trae el CTA.
- **Letras con jerarquía:** Instrument Serif itálica chica para los conectores y Anton enorme para la clave, con palabras que entran una por una con corte seco.
- **Estímulo nuevo cada ≈1 s** en el tramo central: cada 9 cuadros llega un arco y nace una pantalla.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: idea, globo, arcos, pantallas, marcas, inversión a blanco, cámara, textos y Freestyle. |
| `plantilla/config.json` | Textos de las 4 frases, cantidad de pantallas, palabra del CTA y colores (ejemplo con «GUÍA»). |
| `plantilla/montar.sh` | Monta los cuadros en `muestra.mp4` con resplandor, viñeta y grano; saca `poster.jpg`, `cuadros.jpg` y mide el tiempo quieto. |
| `plantilla/fuentes/` | Anton e Instrument Serif Italic (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Avisos
- Freestyle escribe «strokes set empty» en la consola en cada cuadro: es ruido, no un fallo.
- Hay unos 4 cuadros casi blancos justo cuando la cámara entra al globo: se lee como un destello. Si molesta, adelanta `F_NUCLEO` o la aparición del abanico.
- Freestyle no desenfoca la línea: la profundidad sale de cómo se apagan las líneas lejanas, no del desenfoque de lente.

## Checklist final
- [ ] `config.json` con sus 4 frases, su cantidad real y su palabra de CTA (no «YO»).
- [ ] Prueba de 4 cuadros revisada con la lista.
- [ ] Render completo + `montar.sh` sin ningún «freeze».
- [ ] `cuadros.jpg` mirada entera: nada se sale, nada se pisa, el CTA se lee.
- [ ] En pantalla, ninguna palabra técnica (nada de «prompt», «skill», «token» ni código).
- [ ] Sonidos graves, sin nada agudo.
- [ ] Si hay voz: sello del protocolo de corte en NOTAS.
- [ ] Una línea con lo que aplicaste del brandkit.
