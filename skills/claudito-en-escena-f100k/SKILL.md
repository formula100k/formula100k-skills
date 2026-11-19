---
name: claudito-en-escena-f100k
description: "Reel sin cara hecho con código que enseña una cosa de Claude: tarjetas planas y Claudito pixel ACTUANDO cada frase (se frustra, salta sobre enviar, lupa, chef), algo nuevo cada medio segundo. Usar con «Claudito en escena», «Claude explicado en tarjetas»."
argument-hint: [qué cosa de Claude quieres enseñar + tu palabra de CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si la voz es tu grabación, antes de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` (preparar la toma, cortes con pase semántico,
> transcripción leída entera y el sello del protocolo en NOTAS). Una voz clonada o generada frase por frase no lo necesita.

# Claudito en escena (Claude explicado en tarjetas)

Reel vertical de 20 a 35 s, sin cara, dibujado cuadro por cuadro con código (canvas): sin generadores de video y sin créditos.
Enseña UNA cosa concreta que hace Claude. **Claudito, la mascota pixel naranja, actúa cada frase**: no adorna una esquina, es el actor.
Se ve así: `ejemplo/cuadros.jpg` («Claude copia cualquier video»: Claudito copia a mano, se frustra y golpea la laptop; Claude lo clona ×12; lo ve con lupa; de chef saca la receta; una cuadrilla con casco arma el video).

## Lo que necesitas (una sola vez)
Node 18+, ffmpeg y Google Chrome. Corre `bash scripts/preparar.sh` desde la carpeta de la skill para revisar todo e instalar lo que falta.
Opcional: `whisper-cli` con un modelo (`~/.cache/whisper-cpp/ggml-small.bin`) para sacar el segundo exacto de cada palabra. Sin él, el tiempo se reparte por el largo de cada palabra.

## Tu brandkit (antes de producir)
Si tienes brandkit, búscalo y aplícalo como dice `references/tu-brandkit.md`.
- Tu color de acento reemplaza el naranja: palabra clave, chips, Claudito si quieres, subtítulo.
- Tus letras reemplazan a Inter Tight e Instrument Serif.
- El fondo claro, las tarjetas planas y el marcador rojo se quedan.
- Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **La cosa concreta de Claude que vas a enseñar.** Una sola, y que puedas mostrar con capturas reales. Si nombras una función o una cifra, verifícala en la fuente oficial.
2. **El guion:** 5 a 8 frases de 15 palabras o menos, tuteando y sin jerga.
   - La frase 1 es el gancho: negativo o polémico, y dice lo mismo que el texto grande de pantalla.
   - La última frase es el CTA: «Comenta PALABRA…».
   - Marca la palabra clave de cada frase con `*asteriscos*`.
3. **Tu palabra de CTA**, ligada al tema y a tu regalo (no uses «YO»).
4. **La voz** (elige una):
   - tu grabación, un audio por frase (`01.m4a`, `02.m4a`…);
   - una voz del conector de Higgsfield (`generate_audio`, un pedido por frase; avísale el costo antes);
   - una voz de prueba gratis, solo para medir: `say -v Paulina -r 175 -o voz/01.aiff "frase"`.
5. **Capturas reales** (opcional, pero suma mucho): pantallazos de Claude, del resultado o de la referencia, en `fuente/fotos/` con los nombres que carga la pieza (`NOMBRES`). Si falta alguna, sale una caja gris y el render avisa `ERR_FILE_NOT_FOUND`: es normal.

## El camino
1. **Carpeta del video:** copia `plantilla/pieza.src.html` a `<carpeta>/fuente/` y `plantilla/fotos/` a `<carpeta>/fuente/fotos/`. Los audios van en `<carpeta>/voz/`, numerados en orden.
2. **Texto:** en la pieza cambia `LINEAS` (una frase por línea, `gancho: true` en la primera) y el texto grande del gancho.
3. **Tiempos:** `node scripts/tiempos.mjs <carpeta>/fuente/pieza.src.html <carpeta>/voz`. Pega el `SUBS` que imprime y revisa los grupos de 1 a 3 palabras.
4. **Escenas:** escribe una función por frase en `ESC`, siguiendo la tabla de abajo.
   - Los tiempos van en segundos de la palabra: `if (u >= 1.26)` = cuando se dice «estilo».
   - Algo nuevo tiene que pasar cada 0,3 a 0,6 s.
   - La última frase usa `cartelCTA(u, 'PALABRA')`.
   - Ajusta la cámara de cada frase en `CAM`.
5. **Revisa sin voz:** `node scripts/armar.mjs <carpeta>/fuente/pieza.src.html && node scripts/renderizar.mjs <carpeta>/fuente/pieza.html <carpeta>/hoja.jpg --hoja 0.25`. Abre la hoja y mira, además, cuadros grandes de los momentos clave.
6. **Voz, música y sonidos:** `bash scripts/mezcla.sh <carpeta>`.
   - Si existen, usa `musica.mp3` (baja sola cuando hablas) y `sonidos.txt` + `sfx/`.
   - Sale `video.mp4` a −14 LUFS.
   - Si tienes whisper, transcribe el video y compáralo con el guion: si aparecen palabras que no dijiste, la música está tapando la voz. Bájala.
7. **Entrega:** `video.mp4` + `LEEME.md` (guion, qué hace Claudito en cada frase, de dónde sale cada cifra). Ábrele el video.

## Claudito actor (viene en la plantilla)
`claudito(x, y, p, {ojos, bi, bd, rojo, gorro, paso, espejo, color})` dibuja un pixel de 10×6. `p` es el tamaño del cuadrito: 12–20 si es protagonista, 6–8 si es multitud.
- **Ojos:** `normal`, `der`, `izq`, `enojo` (con cejas), `feliz`, `sorpresa`, `cerrado`, `corazon`.
- **Brazos** (`bi` izquierdo, `bd` derecho): `abajo`, `lado`, `arriba`, `adelante`, `alto`, `golpe`, `escribe`, `nada`. `mano(x, y, p, brazo, izq)` da el punto de la mano, para pegarle un lápiz, una cuchara o una lupa.
- **Rabia:** `rojo` va de 0 a 1 y se acompaña con `vapor(x, y, u)`.
- **Gorros:** `gorro: 'chef' | 'casco'`.
- **Multitud:** `COLORES[k % 8]` + `paso(k)` para que camine.
- **Utilería:**
  - `laptop(x, yBase, w, h, abierta, fn)`;
  - `impacto(x, y, t)`;
  - `corazon()`, `exclama()`;
  - `marcador(pts, p)` con `ovalo()` / `raya()`: rojo a mano, para encerrar, subrayar o tachar;
  - `tecleo()`, `tarjeta()`, `chip()`, `etiqueta()`, `foto()`;
  - `cursor()` + `ruta()`;
  - `cartelCTA()`.

| La frase dice… | Claudito hace… |
|---|---|
| hacerlo a mano / perder tiempo | escribe con lápiz, le sale torcido, se pone rojo con vapor, tacha y golpea la laptop («¡PUM!») |
| la solución / Claude | sorpresa → feliz, «!» encima, la laptop se abre con Claude |
| muchos / multiplicar | se multiplica en una grilla de Clauditos de colores con contador ×N |
| me encantó / lo guardé | ojos de corazón, corazones que suben |
| le pasé / le pedí | teclea con las patas encima de la caja del chat y salta sobre «enviar» |
| revisó / analizó | lupa gigante sobre las capturas, con contador |
| la receta / el plan | gorro de chef: de la olla sale la receta, después presenta cada parte |
| armó / construyó | cuadrilla con casco que carga cada pieza hasta su lugar |
| sin X / ya no pagas | camina sobre X mientras lo tacha · abraza su pila de monedas |
| comenta PALABRA | `cartelCTA`: sostiene el cartel y saluda |

## Reglas del estilo
- **Paleta:**
  - fondo #F1ECE3 con una mancha durazno abajo;
  - tarjetas #FBF8F2;
  - acento #D9653B;
  - pantallas #26221F;
  - marcador #D63C31.
  - Tu brandkit manda sobre el acento y las letras.
- **Gancho:** bloque de 2 líneas enormes + una serif chica, fijo desde el cuadro 0. Debajo va la escena actuada en grande (×1,45), pegada al texto; el aire sobrante queda arriba. Sin subtítulo mientras está el gancho.
- **Subtítulo:** píldora oscura en mono mayúscula a y=1420, palabra por palabra con la clave en el acento. Lo que la cámara empuja hacia abajo se funde con el fondo, para que nada quede encimado.
- **Movimiento:** nada tiembla ni rebota. Se mueve lo que cuenta algo: caminar, teclear, tachar, contar, la cámara que entra al detalle. El único golpe es el «¡PUM!».
- **Capturas:** reales antes que íconos o emojis. Las de otras cuentas, desenfocadas (`foto(im, x, y, w, h, r, 3)`).
- **Sonidos:** graves (pop, golpe sordo, papel), nada agudo. La música va debajo de la voz.
- **Cifras:** solo las que puedas citar. Sin fuente, no va.
