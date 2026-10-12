# Empaque de YouTube · skill para Claude

## Qué es

Decide el título y la miniatura de un video largo de YouTube antes de grabarlo. Le cuentas de qué trata el video y te
entrega 3 títulos distintos y, para cada uno, el concepto de miniatura que lo completa: composición, texto de 1 a 4
palabras, objeto y gesto. Cada propuesta sale de un catálogo de estructuras que se repiten en videos reales, con el
ejemplo que la respalda, su nivel de evidencia y cómo probar las 3 variantes en YouTube Studio.

Tiene tres modos: educativo (video a cámara, tutorial, curso), roleplay (educación + roleplay estilo ASMR, con
personaje y escena) y auditoría (revisa un título o una miniatura que ya tienes).

No genera la imagen ni escribe el guion: te deja el brief listo para hacerlos.

Es una guía basada en vistas públicas, no una garantía. «Ganador» quiere decir un video con 5 veces o más las vistas
habituales de su canal; nadie fuera del canal conoce su CTR ni su retención. Los ejemplos se eligieron a mano en
octubre de 2026 y están cargados hacia videos de Claude e IA, y el roleplay que enseña marketing no tiene precedente
en español. La skill te lo avisa cuando aplica.

## Cómo se instala

**En claude.ai (sirve la cuenta gratis)**

1. Entra a Configuración → Capacidades y enciende «Ejecución de código y creación de archivos».
2. Ve a Personalizar → Skills, pulsa «+», luego «Crear skill» y «Subir una skill».
3. Elige el ZIP tal como lo descargaste, sin descomprimirlo, y revisa que su interruptor quede encendido.

**En Claude Code**

1. Descomprime el ZIP.
2. Copia la carpeta `empaque-youtube-f100k` dentro de `~/.claude/skills/` (en Windows,
   `%USERPROFILE%\.claude\skills\`). Debe quedar `~/.claude/skills/empaque-youtube-f100k/SKILL.md`, con la carpeta
   `references/` al lado.
3. Cierra Claude Code con `/exit` y ábrelo otra vez.

## Cómo se usa

Escribe en un chat nuevo:

> arma el empaque de mi video de YouTube: [de qué trata, en una frase]

Si es un roleplay, dilo y cuenta quién es el personaje («roleplay, la jefa te enseña a escribir ganchos»). Para
revisar algo que ya tienes, escribe «audita este título: …» o adjunta la miniatura.

Te pregunta solo lo que le falte (qué se lleva quien ve el video, qué prueba real tienes, para quién es). Si tienes tu
Manual de Negocio o tu documento de marca, adjúntalo: de ahí toma tu voz y tus números. Las cifras de dinero o de
resultados solo entran si son tuyas y reales; si no, te deja el hueco para que lo llenes.

Después sube las 3 variantes a la prueba A/B de YouTube Studio (desde la computadora). Gana la que logra más tiempo de
visualización, no la de más clics, y puede tardar hasta dos semanas.
