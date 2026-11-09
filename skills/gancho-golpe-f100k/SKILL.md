---
name: gancho-golpe-f100k
description: "Escribe y monta el GANCHO GOLPE (patrón de @devinjatho medido el 21-oct-2026): de 2 a 5 palabras en pantalla, una sola línea enorme en letra de diseño según el tema, sin brillo ni degradado y con corte seco (rojo si es negativo, verde si es lo que ganas, el color de tu marca para lo neutro) y otra chica en blanco, negativo o polémico, que entiende alguien que nunca abrió Claude. Da 3 variantes A/B/C por video o guion con su primera frase hablada, las puntúa con la tarjeta de 8 puntos y, si el video se editó con una skill que acepta variantes de gancho, renderiza las 3 versiones (mismo video, solo cambia el gancho) para subirlas como trial reels. Activar con 'gancho golpe', 'gancho a lo Devin', 'gancho más corto y polémico', 'hazle 3 ganchos cortos', 'cámbiale el gancho a este video', 'variantes de gancho de este reel editado', 'el gancho está muy largo'. NO escribe el guion entero ni edita el video desde cero."
argument-hint: "[guion, tema o carpeta del video editado]"
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Gancho golpe

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

El gancho en pantalla tiene que ser corto, entendible y jugoso: polémico y negativo en los primeros segundos, y de
consciencia baja (lo entiende alguien que no sabe nada del tema ni de la herramienta).

Evidencia completa y tablas en `references/ANALISIS-DEVIN-JATHO.md`. Léela si vas a defender o cambiar una regla.

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows. Para escribir ganchos no necesita ningún programa.

- **Tu negocio y tu palabra del CTA.** Salen de `~/Documents/mi-contenido/mi-negocio.md` (qué vendes, a quién, qué regalas
  a quien comenta). Si no existe, pregunta en un solo mensaje el tema del video y qué palabra pide comentar. Nunca inventes
  un regalo, una cifra ni un testimonio.
- **Tu marca.** El color «de la casa» (el neutro de los ganchos) y la letra salen de `~/Documents/mi-contenido/mi-marca.md`
  o de su manual `mi-marca/marca.md`. Si no hay, usa amarillo `#FFD630` y pregúntale si quiere otro.
- **Tu voz.** Si existe `~/Documents/mi-contenido/mi-voz.md`, la primera frase hablada suena como ella.
- **Renderizar las variantes** (flujo B) usa el motor de la skill con la que se editó el video (Node, ffmpeg y Chrome, que
  ya instaló el módulo). Los videos van a `~/Documents/mis-videos-editados/<proyecto>/` (en Windows, la carpeta
  Documentos de su usuario).
- **Otras skills.** Las que nombra esta skill vienen en el mismo módulo o en otros de FÓRMULA 100K. Si alguna no está
  instalada, sigue sin ella y avisa en una línea.

## La regla en 7 líneas

1. **De 2 a 5 palabras en pantalla** (las refs en español llegan a 6; 5 es el tope). Sin tercera línea, sin «sub». Si no cabe en 5, la idea es otra.
2. **Una línea manda:** enorme, en mayúsculas, en el color de su sentido. La otra, chica y blanca, la completa.
3. **Golpe negativo o polémico:** una orden que quita («BORRA», «ELIMINA», «NO PAUTES»), un diagnóstico que duele
   («HUELE A IA», «NO VENDE»), algo prohibido («PARA ESPIAR», «ROBA») o una insolencia («ME DA IGUAL»).
   La otra salida válida es la **prueba desnuda** con cifra real («MISMO VIDEO / 125X VISTAS»).
4. **Consciencia baja:** sin Claude, prompt, skill, tokens, IA-herramienta ni nombres de apps en el gancho.
   Habla de lo que ya le duele a quien mira: vistas, ventas, clientas, perfil, historias, hashtags, flyer, web.
   Si alguien que nunca abrió Claude no lo entiende en 1 segundo, se reescribe.
5. **Habla de TÚ, no de mí.** «Claude hizo 45 contenidos por mí» es de mí; «BORRA tus hashtags» es de ti.
6. **Lo que se lee = lo que se dice.** La primera frase hablada dice lo mismo en 12 palabras o menos y arranca
   con la negación, la orden o la cifra (nada de «Hola», «Ok», «Hoy te voy a…», ni preguntas retóricas).
   Después del gancho, nada de frase puente («pero antes…», «una cosa…»): suena robótica. Se entra directo a la historia.
7. **Miedo o rabia.** Lo que más frena el dedo es lo que asusta o indigna: peligro, pérdida, engaño o injusticia.
   En **curiosidades e historias de negocio animadas** es obligatorio: busca en la historia el momento en que algo casi
   sale muy mal y ponlo arriba, aunque la lección venga después. Ej.: Red Bull Stratos → «**CASI MUERE** / por una
   campaña de Red Bull», no «LO MANDARON AL ESPACIO / y 8 millones lo vieron» (logro + cifra = no frena el dedo).
   El cuerpo paga el gancho con un hecho con fuente.

## Edición sin olor a IA
- **Letra de diseño según el tema**, no la palo seco plana de TikTok: condensada de póster (`"letra": "condensada"`),
  serif itálica elegante (`"serif"`) o la que pida el tema (o la de su marca); se elige por reel y se anota en cada variante.
- **Sin brillo ni degradado 3D**: color plano (rojo, verde o el de su marca) con una sombra seca solo para que se lea.
- **Corte seco**: el gancho está entero y quieto desde el cuadro 0, sin rebote, pop, fade ni tecleo. El único golpe permitido
  es el de 0–2 s (un zoom seco de cámara con whoosh).
- Tamaños distintos dentro de la frase: la palabra clave enorme, el conector chico (eso ya es el molde chica / GRANDE).

## Los 7 moldes (con su prueba)

| # | Molde | Plantilla (chica / GRANDE) | Ejemplo medido | Color |
|---|---|---|---|---|
| 1 | Orden que quita | GRANDE / chica | «ELIMINA / tus destacadas» · «NO PAUTES / sin antes hacer esto» (cuentas en español) | rojo o el de tu marca |
| 2 | Diagnóstico que duele | chica / GRANDE | «publicas contenido / TU INSTAGRAM NO CRECE» (cuenta en español) | rojo |
| 3 | Lo prohibido / la trampa | chica / GRANDE | «INSTAGRAM / CHEATCODE» (Devin, 7,3 K) · «STEAL VIRAL / background songs» (8,4 K) | rojo |
| 4 | Prueba desnuda | chica / GRANDE + contadores | «SAME VIDEO BUT / 125X VIEWS» con 44,5 K vs 5,6 M en pantalla (Devin, 235 K orgánico) | rojo |
| 5 | Insolencia | chica / GRANDE | «I DONT GIVE / 2 SH*TS» (sobre tu nicho; Devin, 64 K) | rojo |
| 6 | Creencia al revés | chica / GRANDE | «getting clients is / NOT HARD» (Devin, 8,7 K) | rojo |
| 7 | Felicitación con amenaza | chica / GRANDE | «you finally / DID IT!» → «no lo arruines» (Devin) | verde |

En español neutro y tuteando: «BORRA / tus hashtags», «tu web / HUELE A IA», «una cuenta / PARA ESPIAR»,
«NADIE / lee tu flyer», «ME DA IGUAL / tu nicho», «conseguir clientas / NO ES DIFÍCIL», «POR FIN / tu primer viral».

Grosería: Devin usa «SH*T». Si la persona no dice groserías, su equivalente es la insolencia limpia («me da igual», «ni a tu mamá»).

## Tarjeta de 8 puntos (cada variante; se entrega con ≥ 7; Coherente es obligatorio y, en curiosidades e historias, también Miedo o rabia)

| Punto | Pasa si… |
|---|---|
| Corto | 2 a 5 palabras en total, sin tercera línea |
| Miedo o rabia | asusta o indigna: peligro, pérdida, engaño o injusticia (no un logro ni una cifra de éxito) |
| Golpe | trae negación, orden que quita, diagnóstico, algo prohibido, insolencia o cifra real |
| Consciencia baja | no nombra Claude, prompt, skill, tokens ni apps |
| De ti | no dice «yo / mi / me» |
| Hablado igual | la primera frase hablada dice lo mismo en ≤ 12 palabras |
| Palabra clave | lleva al menos 1 palabra del tema del video (la del CTA o la cifra real) |
| Coherente | leído en voz alta, chica + GRANDE es UNA frase con sentido, la línea chica completa a la grande (no es otra idea pegada) y promete lo que el video entrega |

**Autoevaluación de coherencia antes de entregar.**
Por cada variante, escribe en una línea cómo se lee entera y qué entendería alguien que no vio el video. Si las dos
líneas son dos ideas sueltas, si no queda claro de quién o de qué hablan, o si la que pusiste como principal es más
débil que otra, se reescribe o se cambia el orden. Ejemplo: «AGENCIA GRATIS / nunca más sola» (dos ideas pegadas,
«sola» no se sabe de qué) pierde contra «NO CONTRATES / una agencia» (una sola frase, polémica y con la palabra clave).

**El CTA.** La palabra que se pide comentar va ligada al tema del video (ej. «GUION», «PRECIO»). Evita «YO»: está
gastada y no dice de qué se trata.

## Flujo

### A · Un guion sin grabar
1. Lee el guion y su palabra del CTA (lo que regala sale de `mi-negocio.md` o se pregunta).
2. Escribe 3 variantes con moldes DISTINTOS (A, B y C), cada una con su **Pantalla** y su **primera frase**.
3. Puntúalas. La que saque menos de 4 se reescribe.
4. Reescribe solo la apertura del guion (primera frase y pantalla). El cuerpo, los pasos y el CTA no se tocan.
   En el archivo del guion, la línea `**Pantalla:**` lleva la A y abajo van `**Pantalla B:**` y `**Pantalla C:**`.

### B · Un video ya editado con una skill que acepta variantes de gancho
Sirve con `reel-infografia-con-clon-f100k` (este módulo) y con `edicion-notitas-f100k` si la tienes instalada.
1. Lee las primeras 25 palabras de `captions.json` de la carpeta del video: el gancho tiene que comprimir lo que la
   persona DICE ahí, no otra idea.
2. Agrega al plan del video (`plan.json` o `PLAN.json`) un arreglo `ganchos` con 3 variantes (si había un `gancho`
   original, queda como referencia). Forma en notitas:
   ```json
   "ganchos": [
     {"estilo": "golpe", "lineas": ["BORRA", "tus hashtags"], "grande": 0, "color": "rojo", "y": 250, "hasta": 3.4},
     {"estilo": "golpe", "lineas": ["tus hashtags", "NO SIRVEN"], "grande": 1, "color": "rojo", "y": 250, "hasta": 3.4},
     {"estilo": "golpe", "lineas": ["3 LÍNEAS", "y cero hashtags"], "grande": 0, "color": "amarillo", "y": 250, "hasta": 3.4}
   ]
   ```
   `grande` = índice de la línea enorme · `color` rojo | verde | amarillo | hex · `letra` condensada (default) | serif | palo ·
   `chica: "sans"` pone la línea chica en palo seco mayúscula · `tamano` tope de la grande (170).
   En `reel-infografia-con-clon-f100k` la forma es `{"l1", "l2", "grande", "color", "hasta"}` (ver su SKILL.md).
3. Renderiza las 3 con el comando de esa skill (cada una explica cómo elegir la variante: `--gancho 0/1/2`).
   - Notitas: `./node_modules/.bin/tsx scripts/render.ts "$DEST" --gancho $v` dentro de su carpeta `render/` (en Windows,
     `node_modules\.bin\tsx.cmd`).
   - Infografía con clon: `armar.py . --gancho $v` y después `final.py . --nombre <nombre>-A/B/C`.
4. Revisa una tira de los cuadros 0, 8, 45 y 90 de cada una: la palabra grande entera dentro del cuadro, sin tapar ojos.
5. Guárdalas como `<tema>-golpe-A.mp4` (B, C) en `~/Documents/mis-videos-editados/<proyecto>/` y dile cuál es la
   principal y por qué.

### C · Un video con otra edición (motion, animados, otro editor)
Escribe las 3 variantes igual y pásalas al motor de esa skill como texto del gancho. Si el motor no tiene estilo golpe,
entrega las 3 como texto listo para poner en su editor (CapCut u otro): línea enorme, línea chica, color y letra.

## Publicación: el gancho no se juzga con una sola subida

Devin sube **el mismo video, con el mismo gancho, de 3 a 7 veces** como trial reel. El mismo «SAME VIDEO BUT 125X
VIEWS» dio 235 K, 38 K, 14 K, 7 K, 5 K, 4 K y 1,7 K. Conclusión: el gancho corto sube el piso, pero el techo lo
encuentra la repetición.
- Sube A, B y C como trial reels el mismo día.
- A las 48 h, la ganadora va al grid y la que quedó cerca se resube en 7 días.
- Un gancho se descarta después de 3 subidas flojas, no de una.

## Errores típicos (no repetir)

| Error | Ejemplo | Golpe |
|---|---|---|
| 10 a 15 palabras en 3 líneas | «Tu caption en 3 líneas / posiciona tus reels / sin un solo hashtag» | «BORRA / tus hashtags» |
| Nombrar a Claude en el gancho | «Claude ya no se me acaba / ni a mitad de semana» | «tu plan / NO ES EL PROBLEMA» |
| Hablar de mí | «Claude hizo 45 contenidos por mí» | «45 CONTENIDOS / y tú con uno» |
| Positivo y plano | «Vende tu oferta en 5 días de historias» | «NADIE / lee tu flyer» |
| Etiqueta | «15 estilos de animación» | «DEJA DE / editar igual que todas» |
