# tutorial-viral-f100k

Pipeline de 5 fases para producir tutoriales virales **faceless** (sin cara) de FÓRMULA 100K. De una idea a un `BORRADOR_AUTO.mp4` con captions cinéticos automáticos y cards pop-in. Un solo checkpoint humano: El usuario graba su voz y las pantallas; el sistema hace el resto.

## Quickstart

```bash
# 1. Primera vez: instalar dependencias (reutiliza el motor de editor-video)
bash ~/.claude/skills/editor-video-formula100k/scripts/bootstrap.sh

# 2. Arrancar el pipeline desde una idea
# En Claude Code escribe: /tutorial cómo usar Claude Code

# 3. El usuario graba voz + pantallas y los pega en $DEST/USER/

# 4. Re-render si ya tienes la carpeta lista
python3 ~/.claude/skills/tutorial-viral-f100k/scripts/render_tutorial.py \
  "~/Documents/FORMULA100K/TUTORIALES/2026-06-18_mi-tutorial" \
  "~/Documents/FORMULA100K/TUTORIALES/2026-06-18_mi-tutorial/USER/voz.m4a"

# 5. Output
open "~/Documents/FORMULA100K/TUTORIALES/2026-06-18_mi-tutorial/BORRADOR_AUTO.mp4"
```

## Smoke test (Task 9)

Ver el comando completo de verificación en `PLAN.md` → Task 9. Resumen: crea un DEST de prueba con un audio corto de 5s y verifica que el render produce `BORRADOR_AUTO.mp4` sin errores.

## Documentación completa

Ver `SKILL.md` en esta misma carpeta.
