---
name: objetos-3d-minimal-f100k
description: "Reel sin cara en Blender, sin créditos: una toma continua por 4 mundos en miniatura sobre pedestales, con luz cálida y fondo oscuro. Usar con «plantilla Objetos 3D minimalistas», «reel de miniaturas 3D»."
argument-hint: [tema + 4 frases cortas + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Objetos 3D minimalistas (reel sin cara en Blender)

Cuatro mundos en miniatura, cada uno sobre su pedestal, en un set casi negro con luces de «oficina de noche» desenfocadas al fondo. La cámara viaja de uno a otro en una sola toma: postes oscuros en primer plano hacen de cortinilla natural. En cada mundo algo se construye frente a la cámara, y arriba entra una frase en letra de máquina de escribir, con el conector chico y la clave enorme en ámbar. Todo se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps.

| Mundo | Qué pasa | Frase del ejemplo |
|---|---|---|
| 1 · escritorio | se enciende la lámpara, luego la pantalla, y la línea de tiempo se arma sola | «tu equipo / TRABAJA / mientras duermes» |
| 2 · claqueta | la claqueta golpea y salen 8 videos en abanico | «1 idea / » 8 VIDEOS» |
| 3 · cinta | la cinta corre y la máquina convierte tarjetas grises en videos encendidos | «se hacen / SOLOS / sin que los toques» |
| 4 · caja | la caja con tu palabra se abre y los videos salen flotando | «comenta / [TU PALABRA]» |

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el ámbar de las palabras clave (`colores.acento`), su color claro va en `colores.texto` y sus colores pueden llenar las pantallas de los videos (`colores.pantallas`). **El mundo no se repinta:** el fondo casi negro, la madera, el cartón, el latón y la luz cálida se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y 4 frases cortas**, una por mundo (~3 s cada una). Cada frase tiene de 2 a 3 líneas cortas y una sola palabra clave. La última es el CTA: «comenta [PALABRA]». Si una frase lleva cifra, que sea real (no inventes cifras).
2. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO». Va en el titular y estampada en el frente de la caja.
3. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, las palabras entran en los tiempos del molde.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json`, `plantilla/montar.sh` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `cta`: tu palabra del CTA (sale en mayúsculas en el titular y en la caja).
   - `frases`: 4 frases, una por mundo; cada frase es una lista de líneas y cada línea, una lista de palabras. El prefijo marca el tamaño: `*` clave enorme en acento, `+` mediana en acento, `#` mediana, `~` chica tenue y sin prefijo, conector chico. `{cta}` se cambia por tu palabra. La letra no trae «→»: usa «»» (el build la cambia solo).
   - `colores`: `texto`, `acento`, `tenue` y `pantallas` (lista de 1 a 8 colores para los videos).
   Una línea demasiado larga se achica sola para caber; aun así, menos palabras pega más.
3. **Si el tema lo pide, adapta los objetos** en `build.py`: cada mundo está en su bloque (`MUNDO 1` a `MUNDO 4`) y cuelga de `TOPS[i]`. Cambia lo que hay sobre el pedestal por algo que **muestre lo que dice la frase**, con las mismas piezas (`box`, `cyl`, `sphere`, `mini_card`, `light`) y la misma regla: algo se enciende, golpea o se arma frente a la cámara. Los tiempos están en `LAMP_ON`, `SCR_ON`, `CLAP`, `OPEN` y en `T0` (cuándo entra el texto de cada mundo); la estancia de la cámara en cada mundo, en `D0` y `D1`.
4. **Prueba rápida:** `OM_SCALE=50 OM_SAMPLES=16 blender -b -P build.py` y luego `blender -b escena.blend -o //prueba/p_#### -f 59 -f 139 -f 219 -f 345`. Revisa esos 4 cuadros con la lista de abajo antes de renderizar todo.
5. **Render completo:** `blender -b -P build.py`, luego `blender -b escena.blend -a` (360 cuadros; con desenfoque de lente tarda más que un estilo plano, prueba primero) y `./montar.sh`. Deja `muestra.mp4` (con viñeta y grano fino), `poster.jpg` y `cuadros.jpg`, la hoja de 9 cuadros: **mírala entera** antes de entregar. `montar.sh` también mide el tiempo quieto: tiene que dar 0 congelados.
6. **Sonido:** golpe sordo en la claqueta, desliz de la cinta y pop grave al abrir la caja. Nada agudo (nada por encima de ~3 kHz), sin timbres ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿Cada mundo muestra lo que dice su frase en ese momento?
2. ¿La clave entra con corte seco, sin rebote ni temblor, y se lee completa antes del viaje?
3. ¿Ninguna letra pisa un objeto (la chimenea de la máquina, el abanico de la claqueta)?
4. ¿El fondo es bokeh desenfocado y el objeto está nítido (hay profundidad)?
5. ¿La palabra de la caja es la misma del CTA y se lee?
6. ¿Hay texto encima de y < 180 o debajo de y > 1650?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Una sola toma continua.** La cámara viaja de mundo en mundo; los postes desenfocados en primer plano tapan el paso. Nunca queda quieta: empuje y órbita lenta en cada mundo, se abre al viajar (0 % quieto).
- **Un objeto-mundo por frase,** simple y redondeado (biselado), sobre su pedestal. Lo que dice la frase se ve.
- **Todo lo que aparece se construye:** se enciende, golpea, corre o se abre frente a la cámara. Nada aparece porque sí.
- **Luz de tres puntos por mundo:** principal cálida de área, contraluz fría y relleno bajo, más luces que se encienden en escena (lámpara, pantalla, interior de la caja).
- **Paleta:** fondo casi negro y un solo acento cálido. Desenfoque de lente real con bokeh al fondo y polvo flotando en el plano de foco.
- **Letra de máquina de escribir** (Courier Prime Bold) con tamaños distintos en la misma frase: conector chico, clave enorme en acento. Plana, sin brillo, palabra por palabra con corte seco.
- **Durante los viajes (≈0,9 s) el texto sale de cuadro:** si hay voz, que no diga nada clave en esos tramos.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: set, pedestales, los 4 mundos con su animación, luces, textos, cámara con desenfoque y render. |
| `plantilla/config.json` | Las 4 frases, la palabra del CTA y los colores (ejemplo con «GUÍA»). |
| `plantilla/montar.sh` | Monta los cuadros en `muestra.mp4` con viñeta y grano; saca `poster.jpg`, `cuadros.jpg` y mide el tiempo quieto. |
| `plantilla/fuentes/` | Courier Prime Bold (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores que ya costaron una retoma (no repetir)
- **Los videos del abanico tapados por la claqueta:** el abanico va alto y el texto del mundo 2 arriba.
- **Una pieza de la máquina pisando la última línea:** la máquina no lleva chimenea y el texto del mundo 3 va más arriba y entra antes.
- **La palabra de la caja sobre la cinta de embalar:** la cinta es una franja horizontal arriba y la palabra va abajo.
- **La luz interior de la caja quemando el cartón:** se dejó baja.

## Checklist final
- [ ] `config.json` con sus 4 frases, cifras reales y su palabra de CTA (no «YO»).
- [ ] Objetos adaptados al tema, si hizo falta.
- [ ] Prueba de 4 cuadros revisada con la lista.
- [ ] Render completo + `montar.sh` con 0 congelados.
- [ ] `cuadros.jpg` mirada entera: nada se sale, nada se pisa, el CTA se lee en el titular y en la caja.
- [ ] En pantalla, ninguna palabra técnica (nada de «prompt», «skill», «token» ni código).
- [ ] Sonidos graves, sin nada agudo.
- [ ] Si hay voz: sello del protocolo de corte en NOTAS.
- [ ] Una línea con lo que aplicaste del brandkit.
