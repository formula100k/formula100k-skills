# Tribunal de ideas · skill para Claude

## Qué es

Lleva una idea a juicio antes de invertirle tiempo o dinero. Una fiscal argumenta por qué va a fracasar, una defensa
argumenta por qué va a funcionar, 12 jurados con papeles distintos (la clienta ideal, la escéptica, la contadora, la
competencia…) votan CULPABLE o INOCENTE sin ver el voto de los demás, y un juez cuenta los votos y lee el veredicto.
Te entrega un acta con las condiciones para mejorar la idea y una prueba barata para hacer con gente real en 7 días.

Es una simulación: ordena los argumentos a favor y en contra. No es una validación de mercado ni reemplaza probar la
idea con personas reales.

## Cómo se instala

**En claude.ai (sirve la cuenta gratis)**

1. Entra a Configuración → Capacidades y enciende «Ejecución de código y creación de archivos».
2. Ve a Personalizar → Skills, pulsa «+», luego «Crear skill» y «Subir una skill».
3. Elige el ZIP tal como lo descargaste, sin descomprimirlo, y revisa que su interruptor quede encendido.

Aquí un mismo modelo hace todos los papeles (juicio en una sola sala) y el acta lo dice.

**En Claude Code (los 12 jurados como agentes separados)**

1. Descomprime el ZIP.
2. Copia la carpeta `tribunal-de-ideas-f100k` dentro de `~/.claude/skills/` (en Windows,
   `%USERPROFILE%\.claude\skills\`). Debe quedar `~/.claude/skills/tribunal-de-ideas-f100k/SKILL.md`.
3. Cierra Claude Code con `/exit` y ábrelo otra vez.

El juicio completo lanza 14 agentes y gasta bastante más de tu plan que un chat normal. La skill te avisa antes y te
ofrece el juicio rápido.

## Cómo se usa

Escribe en un chat nuevo:

> lleva mi idea a juicio: [tu idea en una frase]

Te pregunta solo los datos que le falten (para quién es, qué quieres lograr, qué te cuesta) y te entrega el acta. Si
después cambias la idea o traes un dato que faltaba, escribe «apelo» y repite el juicio.
