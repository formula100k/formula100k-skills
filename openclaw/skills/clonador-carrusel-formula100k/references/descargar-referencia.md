# Bajar la referencia desde un ENLACE (Instagram / TikTok)

> Objetivo: cuando la persona pasa un **link** de un carrusel (en vez de una captura), bajar todas las slides
> como imágenes, guardarlas en orden y leerlas con visión.
> Camino A: el conector de Apify, si la persona lo tiene. Camino B: pedirle capturas. Los dos sirven igual.

---

## 0. Detectar el tipo de entrada

- ¿El argumento es una **ruta/adjunto de imagen** (`.png`, `.jpg`, `.jpeg`, `.webp`)? → NO es link, ir directo a Read (PASO 1 del SKILL).
- ¿Empieza con `http` y contiene `instagram.com` / `tiktok.com`? → es ENLACE, seguir abajo.

Carpeta de trabajo: una subcarpeta `referencia/` dentro de la carpeta de salida del carrusel
(`entregables/`). Crearla antes de descargar.

---

## 1. ¿Hay conector de Apify?

Busca con ToolSearch herramientas cuyo nombre contenga `apify` (por ejemplo `mcp__apify__call-actor` o
`mcp__claude_ai_Apify__call-actor`). Si no aparece ninguna, ve directo a la **sección 4 (capturas)**.

## 2. Instagram con Apify

Llamar al actor **`apify~instagram-scraper`** (revisa su esquema con la herramienta de detalles del actor si dudas):

Input mínimo:
```json
{
  "directUrls": ["<EL_LINK_DEL_POST>"],
  "resultsType": "details",
  "resultsLimit": 1,
  "addParentData": false
}
```

De la salida (dataset items), extraer las URLs de imagen del carrusel, en orden:
- Post carrusel → campo **`images`** (array de URLs) **o** **`childPosts[].displayUrl`** (una por slide).
- Post de imagen única → **`displayUrl`**.
- Si solo devuelve `videoUrl` (es un reel de video, no un carrusel) → avisar:
  "Este post es un video, no un carrusel de imágenes. El clonador trabaja con slides."

Si el actor no devuelve nada (post privado, sin red, sin saldo) → sección 4.

### Descargar cada imagen en orden

`curl` viene instalado en Mac y en Windows 10/11:

```bash
curl -L -s -o "<carpeta>/referencia/slide-01.jpg" "<URL_1>"
curl -L -s -o "<carpeta>/referencia/slide-02.jpg" "<URL_2>"
# … una por slide
```

Verificar que se bajaron N archivos y que pesan más de 0 bytes.

---

## 3. TikTok con Apify (slideshow / fotos)

TikTok tiene "photo mode" (carrusel de imágenes). Buscar en Apify Store un actor de **TikTok scraper**
que devuelva las imágenes del slideshow (búsqueda de actores con "tiktok"), y usar `directUrls`/`postURLs`
según su esquema. Extraer las URLs de las imágenes y descargarlas igual que arriba.

Si el link de TikTok es un video normal (no photo mode) → avisar que el clonador es para carruseles de imágenes.

---

## 4. Sin Apify (o si falló): pedir capturas

No es un error, es el otro camino. (Si la persona tiene instalada la skill `agent-browser` con su sesión
de Instagram abierta, puedes intentar abrir el post y capturar cada slide con ella antes de pedirle nada.)
Decirlo en una línea y seguir:

> "No puedo abrir ese enlace desde aquí. Abre el post en tu teléfono o compu, hazle captura a la portada,
> a 1 slide del medio y al cierre, y pégamelas aquí en el chat."

- En el teléfono: captura normal de pantalla, y luego pásalas a la compu (AirDrop, correo, WhatsApp Web…).
- En Mac: `Cmd + Shift + 4` y seleccionas la slide.
- En Windows: `Windows + Shift + S` y seleccionas la slide.

---

## 5. Entregar al flujo normal

Cuando ya existan las imágenes (bajadas o pegadas):
- Confirmar: *"Tengo N slides de la referencia, ya las estoy leyendo."*
- Leer cada una con **Read** (visión).
- Continuar en el **PASO 1** del SKILL (extraer ADN de estilo).
