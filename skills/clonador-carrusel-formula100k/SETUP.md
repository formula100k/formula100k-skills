# Skill ESPEJO — Instalación (regalo exclusivo · Clase de Carruseles 11 jun 2026)

Esta skill clona el estilo de cualquier carrusel a partir de una **captura de pantalla**, lo mejora con la metodología FÓRMULA 100K y te renderiza las slides en PNG listas para subir.

## 1. Instala la skill en Claude Code

1. Descomprime esta carpeta `clonador-carrusel-formula100k`.
2. Cópiala dentro de tu carpeta de skills de Claude Code:
   - **Mac:** `~/.claude/skills/`
   - **Windows:** `C:\Users\TU_USUARIO\.claude\skills\`
3. Reinicia Claude Code. Listo: ya reconoce la skill.

## 2. Requisitos para renderizar (una sola vez)

El render usa el **Chrome** que ya tienes instalado + una librería ligera.

```bash
cd clonador-carrusel-formula100k
npm install
```

(Instala `puppeteer-core`. No descarga ningún navegador: usa tu Chrome del sistema.)

Necesitas tener instalado **Google Chrome** (o Brave / Edge / Chromium).

## 3. Úsala

En Claude Code, pásale una captura de un carrusel que te guste y di:

> "Clona este carrusel para mi tema: [tu idea]. Mi marca es @____. Aquí va mi foto."

La skill:
1. Lee la captura y extrae el ADN de estilo.
2. Te muestra qué copia y qué mejora.
3. Escribe el guion mejorado slide por slide.
4. Construye el HTML y exporta los PNG finales.

---

Esta skill es parte del arsenal de FÓRMULA 100K. El flujo completo (investigación viral + render en tu estilo + variantes infinitas) vive dentro de la comunidad → https://www.skool.com/formula-100k
