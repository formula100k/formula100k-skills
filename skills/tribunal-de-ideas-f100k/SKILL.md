---
name: tribunal-de-ideas-f100k
description: "Lleva una idea a juicio: fiscal, defensa y 12 jurados votan y un juez da veredicto, condiciones y una prueba barata. Usar con «lleva mi idea a juicio», «tribunal de ideas», «¿esta idea va a funcionar?». NO para criticar un guion o pieza ya escrita (usa consejo-contenido-formula100k)."
argument-hint: [tu idea en una frase]
---

# Tribunal de ideas

Una IA sola tiende a decirte que sí. Aquí el trabajo se reparte para que también aparezcan las razones en contra: alguien
ataca la idea, alguien la defiende, doce papeles distintos votan por separado y un juez cuenta los votos.

Idea recibida: **$ARGUMENTS**

(Si arriba no hay una idea, o ves el texto sin reemplazar, toma la idea del mensaje de la persona.)

## Antes de empezar

1. **Rubro.** Identifica el rubro real de la persona (de lo que escribió, de su perfil o pregúntalo en una línea). Todos
   los ejemplos, objeciones y jurados hablan de ESE rubro, con su vocabulario. Si el rubro no es marketing ni redes, no
   uses vocabulario de ese mundo salvo que la persona lo use primero.
2. **Elige la sala** según dónde estés corriendo:
   - **Juicio completo** (tienes una herramienta para lanzar subagentes, como en Claude Code): fiscal, defensa y cada
     jurado son agentes separados que no se ven entre sí. Son 14 agentes: avisa antes («esto lanza 14 agentes y gasta
     bastante más de tu plan que un chat normal; si prefieres, hago el juicio rápido») y sigue con el completo si la
     persona no dice otra cosa. Si puedes elegir el modelo de cada agente, usa el más liviano para los 12 jurados: su
     encargo es corto.
   - **Juicio rápido** (sin subagentes, como en un chat normal): haces todos los papeles tú, en orden, y lo dices en
     el acta: «juicio en una sola sala: un mismo modelo hizo todos los papeles».

## Paso 0 · El expediente

Para juzgar necesitas cuatro datos. Toma los que ya estén en el mensaje y pregunta SOLO los que falten, todos en un
mismo mensaje. No vuelvas a preguntar lo que la persona ya dijo, aunque lo haya dicho con otras palabras.

| Dato | Pregunta |
|---|---|
| La idea | ¿Qué es, en una frase? |
| Para quién | ¿Quién la compraría o la usaría? |
| Qué quieres lograr | ¿Vender, conseguir clientes nuevos, que te conozcan, probar algo? |
| Qué te cuesta | ¿Cuánto tiempo o dinero le vas a meter, y a qué precio piensas ofrecerla (si aplica)? |

Escribe el expediente en 5 a 8 líneas y muéstralo antes del juicio. Reglas del expediente:

- **Solo lo que la persona dijo.** No agregues datos, ni a favor ni en contra.
- **Lo que falta se escribe como falta:** «Precio: no lo dijo». Nunca lo conviertas en un hecho («no tiene precio»,
  «nadie se la ha pedido»): que no lo haya contado no significa que no exista.
- Si la persona responde «júzgala así», sigue con los datos que haya y deja los demás como «no lo dijo».

## Paso 1 · Los alegatos (fiscal y defensa, a la vez)

Lanza los dos en paralelo, en un solo mensaje. Ninguno ve lo que escribe el otro.

**Encargo para la fiscal:**
> Eres la fiscal en un tribunal de ideas. Tu trabajo es argumentar por qué esta idea va a FRACASAR tal como está
> planteada. Expediente: «[EXPEDIENTE]». Entrega exactamente 3 argumentos, del más fuerte al más débil. Cada uno: una
> frase con el problema + una frase con lo que pasaría en la vida real. Habla en el vocabulario del rubro. No inventes
> cifras, estudios ni casos: si un argumento depende de algo que el expediente no dice, empiézalo con «Supuesto:». No
> ofrezcas soluciones ni suavices. Máximo 150 palabras, en español neutro y tuteando. Responde solo con el alegato.

**Encargo para la defensa:**
> Eres la defensa en un tribunal de ideas. Tu trabajo es argumentar por qué esta idea va a FUNCIONAR. Expediente:
> «[EXPEDIENTE]». Entrega exactamente 3 argumentos, del más fuerte al más débil. Cada uno: una frase con la ventaja +
> una frase con lo que pasaría en la vida real. Habla en el vocabulario del rubro. No inventes cifras, estudios ni
> casos: si un argumento depende de algo que el expediente no dice, empiézalo con «Supuesto:». No halagues a la
> persona: defiende la idea. Máximo 150 palabras, en español neutro y tuteando. Responde solo con el alegato.

## Paso 2 · Los 12 jurados (votos secretos)

Cada jurado recibe el expediente, los dos alegatos completos y SU papel. Ninguno ve el voto de otro. En el juicio
completo, lanza los 12 en un solo mensaje para que corran a la vez.

| # | Papel | La pregunta que decide su voto |
|---|---|---|
| 1 | La clienta ideal | ¿Yo querría esto para mí? |
| 2 | La escéptica | Ya me prometieron algo parecido y no me cumplieron: ¿aquí hay algo que me haga creer? |
| 3 | La que no te conoce | Lo veo dos segundos, sin contexto: ¿entiendo qué es y para quién? |
| 4 | La contadora | Con el tiempo, el costo y el precio que dice el expediente: ¿salen las cuentas? |
| 5 | La competencia | ¿Me sería fácil copiarlo o ganarle mañana? (si es fácil, CULPABLE) |
| 6 | La que ya te compró | ¿Esto me suma a lo que ya tengo contigo, o me confunde? |
| 7 | La que casi compra | Estuve a punto y no lo hice: ¿esto me quita la traba? |
| 8 | La experta del rubro | Lo técnico: ¿se puede hacer bien y cumple lo que promete? |
| 9 | La vendedora | ¿Se explica en una frase y sé qué responder a la objeción de todos los días? |
| 10 | La que lo ejecuta | ¿Quien lo hace puede sostenerlo cada vez sin soltar lo que hoy le funciona? |
| 11 | La del largo plazo | ¿Sigue sirviendo dentro de seis meses, o es moda? |
| 12 | La amiga honesta | Conociéndote: ¿esto es para ti, o te vas a cansar? |

Adapta los papeles al rubro y al tipo de idea (para una idea de contenido, «la clienta ideal» es «tu seguidora ideal»;
si la persona vende a empresas, «la que decide la compra»). Mantén siempre los doce puntos de vista.

**Encargo para cada jurado** (cambia solo el papel y su pregunta):
> Eres jurado en un tribunal de ideas. Tu papel: [PAPEL]. La pregunta que decide tu voto: [PREGUNTA]. Expediente:
> «[EXPEDIENTE]». Alegato de la fiscal: «[FISCAL]». Alegato de la defensa: «[DEFENSA]».
> Responde SOLO tu pregunta, desde tu papel y en el rubro del expediente. Los demás temas ya tienen su propio jurado:
> no votes por precio, costos, ejecución o demanda si no son tu pregunta, y no repitas un argumento de la fiscal o de
> la defensa que tu papel no notaría por su cuenta.
> Vota INOCENTE si la respuesta a tu pregunta es más sí que no. Vota CULPABLE si es más no que sí. No hay abstención
> ni punto medio. No seas amable ni dura por sistema: una idea no tiene que ser perfecta para ser INOCENTE ni estar
> perdida para ser CULPABLE. Si a tu pregunta le falta un dato que el expediente no dice, decide con lo que sí dice y
> pide ese dato en tu condición. No inventes cifras.
> Responde exactamente en este formato, sin nada más:
> VOTO: INOCENTE o CULPABLE
> RAZÓN: una sola frase de máximo 30 palabras, desde tu papel
> CAMBIARÍA MI VOTO SI: una sola condición de máximo 20 palabras (qué tendría que pasar para que votaras lo contrario)

Si un jurado responde sin un voto claro o fuera del formato, vuelve a pedírselo SOLO a ese jurado. Nunca completes ni
corrijas tú un voto.

En el juicio rápido, escribe los doce votos uno por uno, cada uno respondiendo solo su pregunta, sin corregir los
anteriores para que «cuadren» y sin buscar un marcador parejo ni uno contundente.

## Paso 3 · El juez

El juez no vota ni cambia el conteo: lo lee.

**Cuenta antes de escribir.** Recorre la tabla de votos fila por fila y cuenta los INOCENTE y los CULPABLE. Los dos
números tienen que sumar 12. Si no suman, falta o sobra un voto: revísalo antes de seguir. El veredicto sale de esta
tabla y de ningún otro lado:

| Votos INOCENTE | Veredicto |
|---|---|
| 9 a 12 | **HAZLA** |
| 7 u 8 | **HAZLA, CON CONDICIONES** |
| 5 o 6 | **REHAZLA** antes de invertirle |
| 0 a 4 | **NO LA HAGAS ASÍ** |

Después del veredicto, el juez escribe:

1. **Lo que pesó en contra:** las razones que más se repitieron entre quienes votaron CULPABLE (máximo 3).
2. **Lo que pesó a favor:** igual, entre quienes votaron INOCENTE (máximo 3). Si nadie votó así, escribe «Ningún
   jurado votó a favor» y no rellenes con los argumentos de la defensa (y lo mismo al revés).
3. **Condiciones:** hasta 3 cambios concretos, sacados de los «cambiaría mi voto si» que más se repiten. Cada uno es
   una acción que la persona puede hacer esta semana.
4. **La prueba real:** una forma barata de comprobarlo con personas de verdad en 7 días o menos (por ejemplo: ofrecerla
   a cinco personas del público exacto y contar cuántas dicen que sí y pagan o se apuntan). Di qué resultado contaría
   como «sí» y cuál como «no». Los números de la prueba los propone el juez como regla para decidir: no son datos.
5. **Lo que el tribunal no sabía:** los datos que quedaron como «no lo dijo» y que más pesaron en los votos. Si la
   persona los tiene, puede apelar con ellos.

## El acta (lo que entregas)

```markdown
# ⚖️ Tribunal de ideas · [nombre corto de la idea]

**Expediente:** [5 a 8 líneas; lo que falta va como «no lo dijo»]

## Alegatos
**Fiscal — por qué fracasaría**
1. … 2. … 3. …
**Defensa — por qué funcionaría**
1. … 2. … 3. …

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si… |
|---|---|---|---|---|
(12 filas, con el texto de cada jurado tal como lo entregó)

## Marcador
INOCENTE [n] — CULPABLE [n]

## Veredicto: [HAZLA / HAZLA, CON CONDICIONES / REHAZLA / NO LA HAGAS ASÍ]
**Lo que pesó en contra:** …
**Lo que pesó a favor:** …
**Condiciones:** 1. … 2. … 3. …
**La prueba real (7 días):** …
**Lo que el tribunal no sabía:** …

_[Juicio completo: 14 agentes independientes / Juicio en una sola sala: un mismo modelo hizo todos los papeles.]_
_Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales._
```

Cierra ofreciendo UN siguiente paso: aplicar las condiciones y **apelar**, o armar la prueba real.

## Apelación

Si la persona cambia la idea, trae un dato que faltaba y dice «apelo» (o vuelve con las condiciones aplicadas): escribe
el expediente nuevo, marca qué cambió y repite el juicio entero con los mismos doce papeles. Al final compara los dos
marcadores y di qué jurados cambiaron su voto y por qué. Un jurado no «recuerda» su voto anterior: vuelve a juzgar
desde cero.

## Reglas

- **Nada inventado.** Ni cifras, ni estudios, ni «el 80 % de…». Lo que no está en el expediente es un supuesto y se marca.
- **Los votos son secretos.** Ningún jurado recibe el voto ni la razón de otro. El juez es el único que los ve todos.
- **No suavices el resultado.** Si sale 3 a 9, el veredicto es el de la tabla. No lo conviertas en «tiene potencial».
- **No decidas por la persona.** El veredicto es sobre la idea tal como está en el expediente; la decisión es de ella.
- **Temas delicados** (salud, dinero ajeno, lo legal): la experta del rubro señala si la idea necesita a un profesional
  con licencia. El tribunal no da ese consejo.
- **Un juicio por idea.** Si la persona trae tres ideas, son tres juicios; no las mezcles en un solo expediente.
- Español neutro, tuteando.
