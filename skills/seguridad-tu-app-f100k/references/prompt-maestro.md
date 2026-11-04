# Prompt maestro: «no quiero que hackeen mi app»

Para pegar en Claude Code, dentro de la carpeta de tu app, si no tienes instalada la skill
`seguridad-tu-app-f100k`. Cambia lo que está entre corchetes. Funciona con cualquier app: un solo
HTML, Next.js, Supabase, Stripe…

---

```
No quiero que hackeen mi app. Construí esta app con Claude Code, no sé programar, y antes de
publicarla (o de abrirla a más gente) quiero que la revises y la blindes. Es MI app: la carpeta es
esta y su dirección es [https://mi-app.vercel.app, o "todavía no está publicada"].

Háblame simple, sin palabras técnicas. Si tienes que usar una, explícamela en una frase.

PASO 0 — Antes de revisar, dime qué tipo de app es (un solo archivo HTML, Next.js, si usa base de
datos, login, cobros, subida de archivos o una IA) y, de esta lista de 27 puntos, cuáles aplican a
mi app y cuáles no, con el porqué en una frase. No me asustes con cosas que no aplican y no me
propongas cambiar toda la app "para que sea más segura" si no hace falta.

LOS 27 PUNTOS:
Acceso
 1. Que el login esté bien hecho y que el servidor compruebe quién entra (no solo esconder botones).
 2. Que las contraseñas se guarden revueltas (argon2 o bcrypt), nunca legibles.
 3. Que el panel de administradora solo abra para la administradora, comprobado en el servidor.
 4. Que los enlaces de "olvidé mi contraseña" sirvan una vez y caduquen pronto.
Secretos
 5. Que ninguna llave secreta (de IA, de cobros, de la base de datos) llegue al navegador.
 6. Que se distinga lo público de lo secreto en la caja fuerte de la app (variables de entorno; ojo
    con NEXT_PUBLIC_) y que ningún archivo .env se suba a GitHub.
 7. Que no haya llaves olvidadas en el historial de git.
 8. Si alguna llave estuvo expuesta: dime cómo cambiarla (rotarla) y dónde está el botón.
Datos
 9. Que cada persona vea y cambie solo sus propios datos (el candado de la base de datos).
10. Que lo que alguien escribe nunca se meta dentro de una orden a la base de datos.
11. Que el precio lo decida el servidor y que el acceso se dé solo con el aviso de pago firmado.
Red
12. Que siempre abra con candado (HTTPS).
13. Un portero que frene a quien hace cientos de peticiones seguidas (que responda 429).
14. Que solo mi web pueda pedirle datos a mi servidor.
15. Que no se puedan descargar archivos que no deberían verse (.env, .git, copias, mapas del código).
Navegador
16. Las cabeceras de seguridad (CSP, HSTS, X-Frame-Options y compañía).
17. Que si alguien escribe código en un formulario (o la IA lo devuelve), se vea como texto.
Sesión
18. Que las cookies de sesión sean seguras (Secure, HttpOnly, SameSite).
19. Que otra web no pueda hacer clics en mi app a nombre de mis usuarias.
Entradas
20. Que el servidor revise todo lo que le llega de los formularios.
21. Que los archivos subidos tengan tipo y tamaño limitados.
Dependencias
22. Actualizar las piezas con fallas conocidas (npm audit), sin romper la app.
23. Quitar los paquetes que no se usan.
Vigilancia
24. Que se registre la actividad sospechosa, sin guardar contraseñas ni llaves.
25. Que el modo de depuración esté apagado: errores amables, sin detalles técnicos.
26. Una revisión a fondo de lo que esta lista no nombra.
27. Al final, probar todas las protecciones juntas.

CÓMO QUIERO QUE TRABAJES:
- Primero solo revisa, sin cambiar nada. Muéstrame lo que encontraste ordenado así:
  🔴 urgente / 🟡 importante / 🔵 buena práctica, con qué encontraste (archivo y línea), por qué
  importa con un ejemplo de la vida real y qué propones.
- Espera mi OK antes de arreglar.
- Arregla de a uno, con un commit chico por cada arreglo, y comprueba que la app sigue abriendo.
- Prueba cada protección y muéstrame la prueba (por ejemplo: pedir /.env da 404; 31 peticiones
  seguidas dan un 429; la cabecera aparece con curl -I; con otra cuenta no puedo leer un pedido
  ajeno; si escribo <script> en un campo se ve como texto). Si algo no se pudo probar, dímelo.
- Los comandos tienen que funcionar en mi computadora ([Mac / Windows]); en Windows usa curl.exe.

LO QUE NUNCA PUEDES HACER:
- Borrar datos, tablas, archivos subidos ni usuarias.
- Reescribir el historial de git sin que yo te diga textualmente que sí. Si una llave se filtró, lo
  primero es cambiarla (rotarla), no limpiar el historial.
- Publicar o desplegar cambios sin mi OK.
- Mostrarme una llave completa en el chat.
- Usar npm audit fix --force ni subir versiones grandes sin avisarme.
- Probar o atacar apps o webs que no son mías.

AL FINAL, dame un informe en un archivo INFORME-SEGURIDAD.md con: un resumen en 3 líneas, cuántos
puntos cumplo de los que aplican, una tabla con hallazgo → arreglo → prueba → estado, la lista de
lo que tengo que hacer yo a mano (con dónde está cada botón), los puntos que no aplican y por qué,
y lo que no se pudo comprobar.
```
