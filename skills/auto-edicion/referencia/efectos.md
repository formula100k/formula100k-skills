# Efectos (capa que va encima de cualquier estilo)

Los 31 estilos editan el reel completo. Los efectos son **golpes de 1 a 4 segundos sobre UNA frase**: se ponen en la escena de esa frase, dentro de cualquier estilo. Úsalos con criterio: un efecto cuenta lo que se dice en ese momento (una cifra que sube → Curva que sube; «mi app» → Dentro del iPhone). Nunca de relleno, máximo uno cada 3–5 s y el mismo no más de 2 veces por reel.

Hay dos clases:
- **Efectos de video** (mueven o recortan tu video): van en `plano.json`, en la escena, como `"efecto": {"tipo": …}`. Los pre-renderiza `scripts/efectos.py` (lo corre `node scripts/video.mjs render` solo) y `componer.py` los pone en su capa.
- **Piezas de lienzo** (gráficos): funciones de `motor/efectos.js`, que `video.mjs` inyecta en toda pieza. Se llaman dentro de la función de la escena en `ESC`.

Varios necesitan el recorte de la persona (`node scripts/video.mjs mate`). Están marcados con «mate».

## Los 19 efectos

| # | Efecto | Cuándo usarlo | Cómo se pone |
|---|---|---|---|
| 1 | **Acercamiento seco** | La palabra que pega (la cifra, la orden). Ideal en el gancho. | `"efecto": {"tipo": "acercamiento", "en": s, "escala": 1.3}` · la pieza pinta `hueco(0,0,W,H)` |
| 2 | **Vidrio roto** | SOLO como golpe del segundo 0–3 (algo se rompe, «se acabó»). Debajo aparece lo que pinte la escena. | `"persona": "oculta", "efecto": {"tipo": "romper", "en": s, "dur": .6, "x": .5, "y": .45}` |
| 3 | **Foto que escapa** (mate) | Un recuerdo, «antes», una fecha. Tu video se vuelve foto y tu cabeza se sale del marco. | `"persona": "oculta", "efecto": {"tipo": "polaroid", "en": s}` + `fondoEfecto(t)`; el texto va arriba (y < 520) |
| 4 | **Lista que se marca** | Enumeras 2–4 cosas. | `checklistPop([[k,'Texto','✓'|'✗'], …], t, {x, y})` · persona `completa` |
| 5 | **Tormenta de titulares** (mate) | Una noticia, una polémica. Máx. 6 tiras con lo que DICES. | `tormentaTitulares([[k,'TITULAR'], …], t)` · persona `["completa","recorte"]` |
| 6 | **Zoom de cámara** | «Mira esto», un detalle, una decisión. | `"efecto": {"tipo": "zoom-digital", "pasos": [[s,1.6],[s,2.4]]}` + `camaraUI(t, pasos)` |
| 7 | **Portal** | Cambio de tema: un círculo con tu cara y la cámara vuela adentro. | `"efecto": {"tipo": "portal", "en": s, "dur": .55, "x", "y", "r"}` · la pieza pinta `hueco` |
| 8 | **Curva que sube** (mate) | Crecimiento con cifra real (de 1 a 10 ×). Sin cifra exacta, `texto: 'CIENTOS'`. | `curvaCrecimiento(t, {tA, tB, de, a, sufijo})` · persona `"recorte"` |
| 9 | **Dentro del iPhone** | Hablas de una app, tu perfil o algo del celular. | `iphone(t, {w: 560, y: 420})` · persona = caja `{x:260,y:420,w:560,h:1148}` (`iphoneCaja()`) |
| 10 | **Chat que edita** | Le pides algo a la IA y lo hace. | `ventanaChat(t, {pedido, kPedido, items:[[k,'Hecho'],…], app})` · persona = `CHAT_CAJA` `{x:560,y:560,w:400,h:690}` |
| 11 | **Portada de revista** (mate) | Una idea grande, un lanzamiento. El título va DETRÁS de tu cabeza. | `portadaRevista(t, {nombre, edicion, fecha, lados, sello})` · persona `"recorte"`, `FRENTE = true` (el sello va delante) |
| 12 | **Editor y línea de tiempo** | Hablas de editar, de tu proceso. | `editorLinea(t, {titulo, desde, dur})` · persona = `EDITOR_CAJA` `{x:390,y:400,w:300,h:534}` |
| 13 | **Órbita de fotos** (mate) | «Todo lo que…», varias cosas a la vez. Fotos REALES, nunca íconos. | `orbita([FOTOS.a, …], t, {desde, rx, ry, dy})` · persona `["completa","recorte"]`, `FRENTE = true` |
| 14 | **Zoom que atraviesa** | Antes de un giro («¿saben qué es lo mejor?»): entra hasta desenfocar y corta. | `"efecto": {"tipo": "zoom-atraves", "dur": .45}` al final de la escena |
| 15 | **Vértigo** (mate) | Una revelación, «por fin respiro». Tú quieta y el fondo se aleja. | `"efecto": {"tipo": "vertigo", "desde": 1.28, "hasta": 1.0}` |
| 16 | **Estudio que se enciende** (mate) | «Empecé», «ahora sí», un antes y después. | `"persona": "oculta", "efecto": {"tipo": "estudio", "en": s}` + `estudio(t, s)` |
| 17 | **Recorte de papel** (mate) | Tono juguetón, una lista de cosas tuyas. | `"persona": "oculta", "efecto": {"tipo": "papel", "borde": 16}` + `fondoPapel(t)` |
| 18 | **Pantalla verde** (mate) | Nombras un lugar o una cosa: el fondo cambia a la foto real. | `pantallaVerde(t, dicho(k), FOTOS.x)` · persona `"recorte"` |
| 19 | **Lista final** | Cierre: todo lo que viste, marcándose con contador. | `checklistFinal(['…'], t, {tA, dur, rotulo, unidad})` · persona `"oculta"` |

`fondoEfecto(t)` es el fondo oscuro que va debajo de «Foto que escapa» y «Vidrio roto».

## Capas
- `acercamiento`, `zoom-digital`, `zoom-atraves`, `portal` y `vertigo` van **debajo** de los gráficos, como tu video normal. La pieza pinta el hueco verde donde se ve.
- `polaroid`, `romper`, `papel` y `estudio` van **encima** de los gráficos, con su transparencia. La pieza pinta el fondo completo (opaco). Lo que tenga que ir delante va en `frente(…)`.
- Puedes forzarlo con `"capa": "debajo"` o `"encima"`.

## Reglas
- Todo lo que entra lo hace cuando se dice (`dicho(k)`), con corte seco. Los efectos de cámara frenan seco, sin rebote ni temblor.
- «Vidrio roto» solo en el golpe del segundo 0–3.
- Fotos y capturas reales. La órbita, la pantalla verde y la revista nunca llevan íconos ni stickers.
- No inventes cifras: la curva usa los números que dices o una palabra (`texto`).
- No hay «Liquid Glass» (lupa de vidrio con brillo) a propósito: choca con «sin brillos».

Demo de los 19: `plantilla/efectos-demo.src.html` + `plantilla/efectos-demo.plano.json`.
