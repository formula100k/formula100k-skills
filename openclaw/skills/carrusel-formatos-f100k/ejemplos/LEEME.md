# Ejemplos que renderizan

Sirven para probar las plantillas. Los textos y las cifras son de relleno: no son para publicar.

- `papel.json`, `datos.json` y `libre.html` (HTML libre) no llevan fotos: corren tal cual.
- `split.json` y `garabato.json` llevan fotos: copia el ejemplo a una carpeta tuya, crea ahí una carpeta `fotos/`
  con tus fotos nombradas `foto-1.jpg`, `foto-2.jpg`… y corre el build. En `garabato.json`, las coordenadas de
  `cara`, `notas` y `circulos` son de ejemplo: muévelas según tu foto.
- Cambia `"@tuhandle"` por tu @ (o deja que la skill lo lea de tu marca: `entregables/` o tu manual `mi-marca/marca.md`).

```bash
node "<carpeta de esta skill>/build.js" <carpeta>/spec.json
```
