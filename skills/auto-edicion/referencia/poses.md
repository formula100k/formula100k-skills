# Las 20 poses del avatar

Cada pose es un PNG transparente, de la cintura para arriba, cortado por el borde de abajo: `p01.png … p20.png` en la carpeta del avatar
(`~/Documents/mi-contenido/auto-edicion/avatar/`).
Con las 12 primeras ya se puede hacer un reel (pon `N_POSES = 12` en la pieza y usa solo esas).

| n | pose | prompt («New pose: …») | sirve para |
|---|---|---|---|
| 01 | señala a cámara | pointing at the camera with the index finger | gancho, «tú», CTA |
| 02 | pulgar arriba | thumbs up, smiling | dato positivo, nombrar a alguien |
| 03 | mano abierta presentando | one open palm to the side, presenting something | presentar algo |
| 04 | dedo en los labios | index finger on the lips, shh | secreto, trampa |
| 05 | manos explicando | both hands in front, explaining | explicación |
| 06 | sostiene el celular | holding a smartphone, looking at it | CTA, «en tu celular» |
| 07 | manos en la cara | both hands on the cheeks, shocked | cifra fuerte |
| 08 | encoge los hombros | shrugging with open palms | «y aun así…» |
| 09 | mano en la frente | facepalm, hand on the forehead | error |
| 10 | pensando | hand on the chin, thinking | «imagina…», «piensa en…» |
| 11 | señala arriba | pointing straight up | apunta al subtítulo |
| 12 | tres dedos | showing three fingers | listas |
| 13 | manos en la cintura | hands on the hips, confident | afirmación segura |
| 14 | brazos cruzados | arms crossed, skeptical | «pero…» |
| 15 | mano en el pecho | hand on the chest, sincere | sinceridad |
| 16 | dedo «uno» | one finger up next to the face | «ojo», «una cosa» |
| 17 | señala en diagonal | pointing up diagonally to the side | apunta a la ilustración |
| 18 | palmas al frente | both palms facing forward, stop | «espera», «no» |
| 19 | tapa la boca | hand covering the mouth, surprised | sorp## Cómo se hacen

Hay tres caminos. El primero es el de siempre: gratis y con tu cara de verdad.

### A · Con tus fotos (gratis, en tu compu)
1. Ponte frente a una pared lisa, con buena luz de frente, y deja el celular fijo a la altura del pecho
   (temporizador o alguien que te ayude). Misma ropa y misma distancia en todas.
2. Saca una foto por pose de la tabla, de la cintura para arriba. Con las 12 primeras alcanza.
3. Pásalas a la compu en una carpeta y renómbralas `01.jpg`, `02.jpg`… en el orden de la tabla.
4. Corre `node scripts/poses.mjs "<carpeta de las fotos>"`: les quita el fondo (gratis, en tu compu) y las deja como
   `p01.png…` en la carpeta del avatar. Mira 2 o 3 antes de seguir: sin halo ni manos comidas.

### B · Sin avatar
Pon `N_POSES = 0` en la pieza: no se dibuja nada abajo y la ilustración del centro queda sola (puedes bajarla un poco
o agrandarla). Sirve para empezar hoy y sumar el avatar después.

### C · Caricatura con IA (opcional, cuesta créditos de Higgsfield: ~2,75 por pose)
Solo si tiene el conector de Higgsfield y quiere un personaje dibujado. Antes de generar, dile el total
(12 poses ≈ 33 créditos, 20 poses ≈ 55 créditos) y espera su sí.
1. **Base desde 1 foto:** sube la foto (`media_upload`) y genera con `generate_image`, modelo `gpt_image_2_5`, quality high, 2k, 3:4, background transparent, la foto como `image_references`:
   «Turn the person in the reference photo into a semi-realistic cartoon character, clean digital illustration, same face, hair and outfit. Waist-up framing cut at the bottom edge, facing the camera, neutral friendly expression, arms relaxed. Transparent background, no text.»
   Guarda la que más se parezca como `base.png` y anota su `job_id`.
2. **Cada pose:** mismo modelo y ajustes, con el `job_id` de la base como `image_references`:
   «The exact same cartoon character from the reference image (same face, hair, outfit, same illustration style, same scale and waist-up framing cut at the bottom edge). New pose: <prompt de la tabla>. Transparent background, no text.»
   De a 6–8 por tanda (más da error 429: reintenta las que fallen).
3. Revisa que todas tengan la misma escala y el mismo corte abajo; la que salga distinta se rehace.
