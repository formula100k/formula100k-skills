# El prompt de la hoja de personaje

Base = un prompt probado en producción (`gpt_image_2`, 2k, high, 16:9 → 2688×1520), con las capas
que sostienen al personaje entre tomas:
**cuerpo 1:1 con medidas**, vestuario idéntico en todas las vistas, nada agregado que no esté
en la referencia, cuerpo entero dentro del cuadro y piel con microdetalle.

Todo va **en positivo** (lo que sí se ve). Nada de «sin…», «no…» dentro de la escena: el
modelo lee la palabra y la dibuja.

---

## Plantilla A · Persona real (tú o una clienta)

Imagen 1 = su cara de frente (la FACE de su hoja base o su mejor selfie con luz pareja).
Imagen 2 = la foto de cuerpo entero con la ropa del día. Las dos con rol **`image`**.

```
Character reference sheet of the person in image 1, wearing the outfit from image 2.
Four photographs side by side in one wide 16:9 image, separated by thin pure-white gaps,
in this order from left to right:
1. FACE: front close-up portrait from the chest up, looking straight into the lens,
   neutral relaxed expression.
2. PROFILE: exact 90-degree side profile, head and shoulders, facing left.
3. BACK: full body seen from behind, standing straight.
4. BODY: full body from the front, standing straight, arms relaxed, from the top of the
   head to the shoes, the whole outfit visible.

IDENTITY (copy image 1 exactly, face and body 1:1 in all four views): same face shape,
same <color/forma> eyes, same eyebrows, same nose, same lips, <lunares, pecas, cicatrices
con su lugar exacto>, <pelo: largo, forma, color, raya>.
BODY: <altura> tall, <complexión: delgada / atlética / curvilínea / robusta>,
<proporciones visibles: piernas largas, hombros anchos…>, the same body in every view.

OUTFIT (copy image 2 exactly, identical in all four views): <prenda por prenda, de arriba
abajo: lentes, pelo/accesorio de pelo, parte de arriba, abajo, joyas con su muñeca/lado,
bolso con su hombro, calzado>. Only the items listed here.

Soft frontal north-window light, even and low-contrast, seamless light-grey studio
backdrop #F7F7F7, full-frame camera at 85 mm equivalent, f/8, ISO 100, photorealistic,
natural skin texture with visible pores, fine micro-detail and soft natural vellus hair,
every view sharp and fully inside the frame with clean margins.
```

## Plantilla B · Avatar de IA nuevo (marca, UGC, personaje de corto)

Igual que la A, pero la identidad sale de la **ficha de casting** (`casting-y-referencias.md`)
y de 1 o 2 referencias de cara + 1 de ropa. Fórmula de una línea que funciona:
*«la cara de la referencia 1 con la ropa de la referencia 2»* — **parecida, no idéntica**: un
avatar de marca nunca copia la cara de una persona real de Pinterest.

```
Character reference sheet of an original <edad>-year-old <origen> <mujer/hombre>,
inspired by the general look of image 1 (an original person, a new face), wearing
the outfit from image 2. Four photographs side by side ... (mismos 4 paneles)

IDENTITY: <ficha en el orden del casting: edad y origen → pelo → piel → cejas → ojos →
nariz → labios → rasgo distintivo>. SIGNATURE: <su signo distintivo, siempre visible>.
BODY: <altura>, <peso aproximado>, <complexión>, <proporciones>, the same body in every view.
OUTFIT: ... Only the items listed here.
(misma luz y cámara)
```

### Variante «marca / UGC»: panel 2 = plano medio

Un avatar de anuncio casi nunca se filma de espalda y sí mucho en plano medio. Orden:
`FACE · MEDIUM (de la cintura arriba, de frente) · PROFILE · BODY`. Se parte con
`--orden FACE,MEDIUM,PROFILE,BODY`. El MEDIUM lleva cara: entra al Element **solo si** la
cara es la misma que la del FACE; si no, se descarta.

---

## Hoja de cara (extra, 8 expresiones)

Para avatares con primeros planos o que hablan a cámara. Una sola imagen 16:9, 2 filas × 4,
fondo #F7F7F7, misma luz, misma ropa (del pecho arriba):

```
Face expression sheet of the same person as image 1, eight head-and-shoulders portraits in
a 4×2 grid separated by thin pure-white gaps: front neutral · front soft smile · front big
laugh · three-quarter left · three-quarter right · looking down thoughtful · surprised ·
serious and intense. Same face, same hair, same outfit and same accessories in all eight,
<signo distintivo> in every portrait. (misma luz y cámara)
```

Se parte con `--filas 2 --orden NEUTRA,SONRISA,RISA,TRES-CUARTOS-IZQ,TRES-CUARTOS-DER,PENSATIVA,SORPRESA,INTENSA`
(probado 3-nov). **No entra entera al Element:** se eligen 1 o 2
expresiones (3/4) que sumen ángulo, nunca las 8 (son 8 caras y el modelo promedia).

---

## Ajustes medidos

| Modelo | Uso | Costo medido |
|---|---|---|
| `gpt_image_2` · 2k · high · 16:9 | hoja de persona real y de avatar (default) | ≈6,5 cr (nov-2026) |
| `nano_banana_pro` · 2K · 16:9 | alternativa (la de la masterclass) | correr `get_cost` antes |

Siempre `get_cost: true` antes de lanzar, y decir el número.

## Revisión antes de mostrarla (en voz alta, punto por punto)
1. ¿La cara es la misma en FACE y PROFILE (lunares, cejas, nariz)?
2. ¿El cuerpo es el mismo en BACK y BODY (altura, complexión)?
3. ¿La ropa es idéntica en las 4 vistas y no apareció nada que no esté en la referencia?
4. ¿Cabeza, manos y zapatos están completos dentro del cuadro?
5. ¿Los separadores son blancos y rectos (para que el script corte bien)?
6. Si es avatar: ¿se ve el signo distintivo?

Si algo falla, se regenera **esa** hoja con el arreglo dicho en positivo; no se pasa al Element.
