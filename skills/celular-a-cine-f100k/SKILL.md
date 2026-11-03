---
name: celular-a-cine-f100k
description: Convierte un clip grabado con el celular en una escena de película con IA en Higgsfield, con la MISMA persona - mismos movimientos, misma cara y cámara de cine en cada plano (contrapicado, detalle de manos, foco que pasa, perfil, primer plano). Primero arma la hoja de personaje (cara, perfil 90°, espalda, cuerpo sin rostro) con la ropa del clip; después escribe la lista de tomas por segundo, compara Seedance 2.5 y Wan 3.0 en borrador y te entrega el lado a lado para que elijas. Activar con "convierte mi video en película", "hazlo cine", "mi video del celular como escena de cine", "video a video cinematográfico", "plantilla Tu video hecho película", "compara Seedance y Wan con mi video". NO usar para editar un video donde hablas a cámara (auto-edicion) ni para copiar solo el movimiento a otro personaje (motion control).
argument-hint: [ruta del clip] [foto con la misma ropa]
---

# Tu video hecho película

Entra un clip del celular y sale la misma escena filmada como película. La IA **no inventa la acción**:
la copia de tu clip. Lo único que cambia es la cámara, la luz y el acabado.

> 🔴 **Regla que no se rompe:** nunca se genera un video con una persona real sin su **hoja de personaje**.
> Con una foto suelta de calle, el modelo le cambia la cara. La hoja va primero, aunque sea «solo una prueba».

Necesitas el conector de **Higgsfield** en Claude y créditos. Antes de gastar uno, se calcula el costo con
`get_cost: true` y se le dice a la persona.

## Qué pedir (una sola vez, en una línea)
1. **El clip**: de 6 a 15 s, una sola toma, con el celular apoyado (cámara quieta). Que pase *algo*:
   llegas, escribes, se te cae algo, celebras. Si solo caminas, la película queda aburrida.
2. **Una foto tuya de cuerpo entero con la MISMA ropa** del clip, de frente y con luz de día.
3. Si tiene una selfie de frente con luz pareja, mejor: es la base de su cara.

Si en el clip salen caras de otras personas, logos o marcas, avísale: el filtro bloquea marcas y la cara
de otra persona no se publica sin su permiso.

## Paso 1 — La hoja de personaje
> Se hace con la skill **`hoja-de-personaje-f100k`** (camino A · persona real). Resumen:
- Crea la carpeta `~/Documents/mi-contenido/cine/<fecha>_<tema>/` y guarda ahí todo.
- Modelo `gpt_image_2`, `resolution: 2k`, `quality: high`, `aspect_ratio: 16:9`. Las fotos entran con
  rol **`image`**: imagen 1 = su cara de frente (selfie), imagen 2 = la foto con la ropa del clip.
- Prompt en positivo: 4 fotos lado a lado separadas por una línea blanca fina → 1 FACE de frente del
  pecho arriba · 2 PROFILE perfil exacto a 90° · 3 BACK cuerpo entero de espalda · 4 BODY cuerpo entero
  de frente. Un bloque IDENTITY que copia la imagen 1 (ojos, cejas, lunares, pelo) y un bloque OUTFIT que
  copia la imagen 2 prenda por prenda, idéntico en las 4 vistas y solo lo listado, y un bloque BODY con
  altura y complexión (cara y cuerpo 1:1). Luz: *soft frontal north-window light, even and low-contrast,
  seamless light-grey studio backdrop #F7F7F7, full-frame camera at 85 mm equivalent, f/8, ISO 100,
  photorealistic, natural skin texture, every view sharp and fully inside the frame with clean margins.*
- **Parte la hoja en 4 imágenes** con `scripts/partir_hoja.py` de `hoja-de-personaje-f100k` (busca la
  línea blanca de cada división). Al cuerpo **le quita la cabeza**: la única cara que manda es la del FACE.
- Muéstrale la hoja y **espera su OK** antes de seguir.

## Paso 2 — La lista de tomas (sin costo)
Mira el clip (1 cuadro por segundo) y escribe de 4 a 5 tomas que **siguen la acción del clip en el mismo
segundo**. Molde (clip de 11 s):
```
00:00-02:00 Plano general en contrapicado desde abajo, dolly lento hacia la persona, chica y descentrada.
02:00-04:00 Primer plano de las manos haciendo la acción, algo del lugar desenfocado delante.
04:00-06:00 Cambio de foco: de un objeto del primer plano a su cara.
06:00-08:30 Perfil en plano medio (igual a la pieza PROFILE), el viento le mueve el pelo.
08:30-final Acercamiento lento a su cara (igual a la pieza FACE) y su reacción final.
```
La duración del video es la del clip + 1 s (redondeada), máximo 30 s.

## Paso 3 — El prompt
Orden de los bloques, todo en positivo:
1. `Cinematic remake of video1 as a scene from a feature film, 9:16 vertical, N seconds.`
2. **CHARACTER** (manda en la cara): «the person is the character sheet in image1 (front face, the
   authority for the face), image2 (profile), image3 (back), image4 (outfit)» + 4 o 5 rasgos y la ropa.
3. **ACTION LOCK**: hace exactamente lo de video1, en los mismos momentos y al mismo ritmo. Solo cambia la cámara.
4. **LOCATION**: el mismo lugar de video1, en una línea.
5. **LOOK for every shot including the first one**: la luz con dirección y hora, cámara y lentes, grano de
   35 mm, halación suave y poca profundidad de campo. Sin «including the first one», el primer plano sale
   casi igual al original.
6. **SHOTS**: la lista del paso 2.

## Paso 4 — Dos motores en borrador
- Seedance 2.5 y Wan 3.0 **no leen Elements**: pasa las 4 piezas de la hoja como `image_references` (en
  orden FACE, PROFILE, BACK, BODY) y el clip como `video_references`.
- `seedance_2_5` con `mode: omni_reference` y `draft: true` (borrador en 480p) · `wan3_0` en `480p`.
  Los dos con `generate_audio: false`. Antes, `get_cost: true` a cada uno y dile el total.
- Si Higgsfield responde con un preset sugerido, vuelve a mandar la misma llamada con `declined_preset_id`.
- Cada uno tarda de 3 a 5 minutos.

## Paso 5 — Comparar y entregar
1. Baja los dos y míralos de verdad (1 cuadro por segundo).
2. Arma con ffmpeg el lado a lado `original | Seedance | Wan` y una tira de caras (FACE de la hoja + el
   último primer plano de cada motor). Guárdalos en la carpeta del paso 1 y ábrelos.
3. Tabla corta: costo · look de cine · fidelidad de la cara · detalles (lentes, joyas) · fallas. Recomienda uno.

Lo que suele pasar: **Seedance 2.5** respeta más la cara; **Wan 3.0** da mejor luz de cine y cuesta
bastante menos, pero cambia detalles (el color de los lentes, logos en los objetos). Si su cara es su
marca, recomienda Seedance.

## Paso 6 — Con su OK
- Pasa a 1080p **solo la versión que eligió** (en Seedance, con el `draft_job_id` del borrador y la misma
  duración). Costo antes.
- Si tiene más clips de la misma escena, repite los pasos 2 a 5 con **la misma hoja**.
- Para el reel: el gancho es su original frente a la versión de cine; el CTA, con una palabra ligada al tema.

## No hacer
- No generes sin hoja de personaje, ni siquiera para probar.
- No pases a 1080p las dos versiones: solo la elegida.
- No uses grabaciones de cámaras de seguridad ni clips con caras de otras personas para publicar.
- No prometas «cualquier video»: con la cámara quieta y una acción clara sale bien; con la cámara en mano
  y mucha gente, no.
