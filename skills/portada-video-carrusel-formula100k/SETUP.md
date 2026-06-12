# Setup — portada-video-carrusel-formula100k

Esta skill anima la foto gancho de un carrusel y compone el título encima.

## Requisitos
- **Higgsfield MCP** conectado (genera la foto y el video). Gasta créditos.
- **ffmpeg** instalado: `brew install ffmpeg` (Mac).
- **Node + Google Chrome** (el render del título transparente usa Chrome del sistema).
- **puppeteer-core** (para `overlay_export.js`). Instálalo UNA vez dentro de la carpeta de la skill:

```bash
cd ~/.claude/skills/portada-video-carrusel-formula100k
npm install
```

> Si ya tienes instalada `carrusel-render-formula100k` o `clonador-carrusel-formula100k`,
> ya tienes Chrome + puppeteer-core resueltos; igual conviene correr `npm install` aquí
> para que la skill sea autónoma.

Listo: invoca la skill diciendo *"hazme la portada del carrusel en video"* o *"anima la foto gancho"*.
