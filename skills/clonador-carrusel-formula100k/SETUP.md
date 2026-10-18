# Skill ESPEJO — Cómo se usa

Esta skill clona el estilo de cualquier carrusel a partir de una **captura de pantalla** (o de un enlace),
lo mejora con la metodología FÓRMULA 100K y te renderiza las slides en PNG listas para subir, con tus colores,
tu letra y tu @.

## 1. Instalación

La skill viene en el plugin de FÓRMULA 100K: al instalar el plugin en Claude Code ya la tienes.

La primera vez que exporte, la skill corre `npm install` dentro de su propia carpeta (instala `puppeteer-core`;
no descarga ningún navegador: usa tu Google Chrome). Si prefieres hacerlo tú, abre una terminal en la carpeta
de la skill y corre una sola vez:

```bash
npm install
```

Necesitas **Node.js** y **Google Chrome** (sirven también Edge, Brave o Chromium).

## 2. Tu marca (una sola vez)

La skill busca tu identidad en este orden: `~/Documents/mi-contenido/mi-marca.md` (colores, letras, estilo
visual, @, tono) y, si no está, tu manual de identidad visual `mi-marca/marca.md` (el que armas en
formula100k.app/identidad-visual). Tu negocio sale de `~/Documents/mi-contenido/mi-negocio.md` (rubro, avatar,
oferta). Si no hay nada, te pregunta tu color principal, tu letra y tu @ en un solo mensaje.

## 3. Úsala

En Claude Code, pásale una captura (o el enlace) de un carrusel que te guste y di:

> "Clona este carrusel para mi tema: [tu idea]. Aquí va mi foto."

La skill:
1. Lee la referencia y extrae el ADN de estilo.
2. Te muestra qué copia y qué mejora.
3. Escribe el guion mejorado slide por slide.
4. Construye el HTML y exporta los PNG finales en `~/Documents/mi-contenido/carruseles/`.

Si le pasas un enlace y no tienes el conector de Apify, te pedirá capturas: es normal.
