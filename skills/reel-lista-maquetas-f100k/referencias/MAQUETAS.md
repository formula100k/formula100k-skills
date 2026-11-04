# Maquetas: tipos y parámetros

Cada escena lleva `"maqueta": { "tipo": "...", ...parámetros }`. Todos los parámetros son opcionales: si faltan, se usa un ejemplo genérico. Los tiempos internos están pensados para una escena de 2,6 s y se estiran o se encogen solos con la duración de la voz.

En la tabla, **Acción que se ve** es el único movimiento de la escena. Lo demás aparece con corte seco.

| Tipo | Para qué ítem | Parámetros | Acción que se ve |
|---|---|---|---|
| `objetivo` | Gancho o intro: la app que atacan | `app`, `estado`, `tiles` [3], `ataques` [hasta 4 «POST /login»…], `mascota` (false para quitarla) | Las peticiones de ataque aparecen una a una (pop) |
| `formulario` | Login, registro, cualquier formulario que va al servidor | `url`, `campos` [{label, valor}], `boton`, `servidor`, `sub`, `titulo_checks`, `checks` [textos] | El botón se presiona, la línea viaja al servidor y las comprobaciones se marcan ✓ |
| `codigo` | Una clave o un dato peligroso en el código | `url`, `etiqueta`, `lineas` [{txt, marca: "mal"/"bien"}], `alerta` (o false), `clave`, `servidor`, `sub`, `secreto` (false = sin servidor), `tercero` {etiqueta, titulo} | La línea mala se pinta de rojo y la clave viaja al servidor |
| `basedatos` | Permisos o datos que solo ve su dueño | `sesion`, `etiqueta`, `regla`, `filas` [{txt, dueno, mio}] | Las filas ajenas se tapan con «oculto» |
| `candado` | HTTPS, cifrado o conexión segura | `url`, `dato`, `boton`, `cifrado`, `nota`, `servidor` | El punto viaja por el candado hasta el servidor |
| `registro` | Logs, vigilancia o alertas | `etiqueta`, `vivo`, `filas` [{h, txt, quien, mal}], `final` (o false) | Las filas entran una a una, las raras en rojo, y al final la alerta |
| `variables` | Variables de entorno, qué es público y qué es secreto | `etiqueta`, `estado`, `filas` [{nombre, valor, tipo: publico/secreto/expuesto}], `cliente`, `cliente_txt`, `servidor`, `servidor_txt` | La fila expuesta se marca y su nombre se muda a «Solo servidor» |
| `regla` | Validar en el servidor | `url`, `campo`, `boton`, `servidor`, `etiqueta`, `regla`, `pruebas` [{valor, ok, txt}] | La petición viaja y cada prueba sale ✓ Aceptado / ✕ Rechazado |
| `galleta` | Cookies de sesión y sus banderas | `nombre`, `valor`, `etiqueta`, `banderas` [{n, d}], `final` (o false) | Cada bandera se marca ✓ en la tabla de cookies del navegador |
| `reloj` | Algo que caduca o vence: enlaces, ofertas, turnos | `titulo`, `sub`, `boton`, `vigencia`, `desde` (segundos, 900 = 15:00), `final` | El reloj cuenta hacia atrás y el anillo se vacía; al final, «Enlace caducado» |
| `flujo` | Dos caminos: el bueno pasa y el falso se rechaza (CSRF, antes/después) | `a` y `b` {url, titulo, tag, ok}, `destino`, `nota` {txt, ok} | Cada petición viaja; la buena llega con ✓ y la falsa se corta a mitad con ✕ |
| `whatsapp` | Atención, ventas o respuestas automáticas | `contacto`, `estado`, `mensajes` [{de: "yo"/"ella", txt, hora}], `alto` | Los mensajes entran uno a uno |
| `calendario` | Agenda, horarios o una rutina semanal | `titulo`, `pill`, `dias` [], `horas` [], `bloques` [{dia, hora, txt, color: ok/no, largo}] | Los bloques se llenan uno a uno |
| `limite` | Límite de peticiones, cupos o topes | `titulo`, `ritmo`, `max`, `bloqueo`, `destino` | Los segmentos se llenan, el último en rojo, y aparece «429» |
| `lista` | Pasos de un tutorial o un checklist | `etiqueta`, `items` [textos] | Cada paso se marca ✓ |
| `cierre` | CTA final (lo usa el bloque `cierre` solo) | `palabra`, `bio`, `regalo`, `regalo_etiqueta` | «Seguir» pasa a «Siguiendo» y la palabra aparece en el comentario |
| `mascota` | Opcional, dentro de `objetivo` | `x`, `y`, `px`, `color` | Ninguna (quieta) |
| `libre` | Algo que ninguna maqueta cubre | `html`: HTML propio con `data-t`, `data-a`, `data-sfx` | La que definas |

## Atributos de tiempo (para `libre` o para crear un tipo nuevo en `motor/maquetas.js`)

- `data-t="0.8"`: aparece en el segundo 0,8 de la escena, con corte seco.
- `data-hasta="1.6"`: desaparece en ese segundo.
- `data-a="0.4,1.2"`: pone la variable CSS `--p` de 0 a 1 entre esos segundos, con curva suave. Úsala en `width`, `left` o `top` con `calc(... * var(--p))`. Es el único movimiento permitido: el que cuenta la acción.
- `data-cuenta="900,0"` (junto a `data-a`): escribe un reloj mm:ss que va de 900 a 0 segundos.
- `data-sfx="pop|swish|golpe|corte"`: un sonido grave en el momento en que el elemento aparece o empieza a moverse.

Clases útiles: `card`, `nav-top`, `url`, `body`, `lbl`, `mono`, `campo`, `boton`, `chip-srv`, `pill ok|no|az|gr`, `tag ok|no`, `sello ok|no`, `code`, `fila`. El centro mide 1080 × 980 px y empieza en y = 540.
