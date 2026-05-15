# 🔌 MCPs — Las "súper-conexiones" de tus skills

> **¿Qué es un MCP en cristiano?**
> Es una **conexión** que le da a Claude poderes extra: leer Tavily, generar imágenes con Higgsfield, sacar transcripciones, abrir Instagram logueada, etc.
>
> Sin MCPs, las skills funcionan, pero a medias. Es como tener Netflix sin internet — la app está, pero no puedes ver nada.

---

## 📊 Resumen rápido

| Nivel | Cuántos | ¿Qué se rompe sin esto? |
|---|---|---|
| 🔥 **ESENCIALES** (4) | Necesitas estos sí o sí | El 70% de las skills no funciona |
| ⭐ **RECOMENDADOS** (2) | Súbete cuando puedas | Algunas skills tienen menos features |
| 💎 **OPCIONALES** (5) | Solo si usas esa skill puntual | Skills muy específicas |

**Costo total mínimo (esenciales):** ~$0-30/mes
**Costo total máximo (todo activado):** ~$200/mes

---

## 🔥 ESENCIALES (sin estos no arrancas)

### 1. Playwright
**¿Para qué?** Le permite a Claude **abrir un navegador como una persona** — entra a Instagram, TikTok, YouTube logueado contigo y extrae datos reales (captions, ganchos, vistas, comentarios).

**Skills que dependen de esto:**
- investigacion-contenido-formula100k
- analizador-perfiles-formula100k
- creador-estrategia-contenido-formula100k
- benchmark-producto-formula100k

**Costo:** **Gratis** ✨
**Cómo instalarlo:** Ya viene incluido en el repo (`.mcp.json`). Se instala solo cuando corres `/plugin install formula100k@formula100k`. No requiere nada más.

---

### 2. Nanobanana (Google Gemini)
**¿Para qué?** Genera **imágenes con IA**. Es el motor de los carruseles, miniaturas, historias y portadas.

**Skills que dependen de esto:**
- carrusel-viral-formula100k
- carrusel-render-formula100k
- miniatura-youtube-formula100k
- historias-a-imagenes-nanobanana
- recursos-de-video-formula100k

**Costo:** **Gratis hasta cierto límite** (Google da $200 de crédito al mes en el tier gratis, más que suficiente)

**Cómo activarlo (5 minutos):**
1. Ve a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click en **"Get API key"** → crea una nueva
3. Copia el código que empieza con `AIza...`
4. Abre tu terminal y corre:
   ```bash
   echo 'export GOOGLE_AI_API_KEY="TU_KEY_AQUI"' >> ~/.zshrc
   source ~/.zshrc
   ```
5. Reinicia Claude Code. ¡Listo!

---

### 3. Filesystem
**¿Para qué?** Le permite a Claude **leer y escribir archivos** en tu computadora (guardar guiones, calendarios Excel, imágenes generadas, etc.)

**Skills que dependen:** **Todas** (las 33 escriben outputs)

**Costo:** **Gratis** ✨
**Cómo activarlo:** Ya viene built-in en Claude Code. No tienes que hacer nada.

---

### 4. Higgsfield
**¿Para qué?** Genera **imágenes 4K + videos con IA** (infografías reels, gráficos de video, animaciones).

**Skills que dependen:**
- infografia-reel-formula100k
- graficos-de-video-formula100k
- recursos-de-video-formula100k
- historias-a-imagenes-nanobanana

**Costo:** **$19-49/mes** (plan inicial = $19, plan Pro = $49)

**Cómo activarlo:**
1. Ve a [higgsfield.ai](https://higgsfield.ai) y crea cuenta
2. Suscríbete al plan que prefieras
3. En Claude.ai (la web) → tu foto → **Settings → Integrations**
4. Busca **"Higgsfield"** → click **Connect** → autoriza con tu cuenta
5. Reinicia Claude Code

---

## ⭐ RECOMENDADOS (mejoran mucho las skills)

### 5. Tavily
**¿Para qué?** Búsquedas web inteligentes con IA — investiga tendencias, valida ideas, busca competencia.

**Skills que dependen:**
- investigacion-contenido-formula100k
- creador-estrategia-contenido-formula100k
- benchmark-producto-formula100k
- infografia-reel-formula100k
- recursos-de-video-formula100k

**Costo:** **Gratis (1000 búsquedas/mes)** o **$30/mes** para uso intensivo

**Cómo activarlo:**
1. Ve a [tavily.com](https://tavily.com) → crea cuenta gratis
2. En Claude.ai → **Settings → Integrations** → busca **"Tavily"** → Connect
3. Reinicia Claude Code

---

### 6. Supadata
**¿Para qué?** Saca transcripciones de YouTube/TikTok, extrae contenido de landings, lee páginas web.

**Skills que dependen:**
- transcripcion-youtube-formula100k
- benchmark-producto-formula100k
- analizador-perfiles-formula100k
- recursos-de-video-formula100k
- infografia-reel-formula100k

**Costo:** **Gratis (100 transcripciones/mes)** o **$29/mes**

**Cómo activarlo:**
1. Ve a [supadata.ai](https://supadata.ai) → crea cuenta gratis
2. En Claude.ai → **Settings → Integrations** → busca **"Supadata"** → Connect
3. Reinicia Claude Code

---

## 💎 OPCIONALES (solo si usas esa skill específica)

### 7. Apify
**¿Para qué?** Scraping profundo de comunidades Skool, ads de Facebook, reviews de productos.
**Necesario para:** `benchmark-producto-formula100k` (modo profundo)
**Costo:** **Pay-as-you-go (~$5-49/mes según uso)**
**Activación:** [apify.com](https://apify.com) → Claude.ai integrations

### 8. vidIQ
**¿Para qué?** Cazar outliers de YouTube, keyword research, comentarios virales.
**Necesario para:** `investigacion-contenido-formula100k` (modo YouTube)
**Costo:** **$7-79/mes**
**Activación:** [vidiq.com](https://vidiq.com) → Claude.ai integrations

### 9. Zapier
**¿Para qué?** Publicar directamente a Instagram desde Claude Code.
**Necesario para:** `publicar-ig`
**Costo:** **$20+/mes**
**Activación:** [zapier.com](https://zapier.com) → Claude.ai integrations

### 10. HeyGen
**¿Para qué?** Generar videos con avatares clonados.
**Necesario para:** skills futuras de video con avatar (no implementado aún)
**Costo:** **$24-89/mes**
**Activación:** [heygen.com](https://heygen.com) → Claude.ai integrations

### 11. Canva
**¿Para qué?** Construir carruseles directamente en tu Canva.
**Necesario para:** `carrusel-viral-formula100k` (modo Canva)
**Costo:** **$13/mes (Canva Pro)**
**Activación:** [canva.com](https://canva.com) → Claude.ai integrations

---

## 🎯 Plan recomendado por etapa

### 👶 ETAPA 1 — Recién empiezas ($0/mes)
- Playwright (gratis)
- Nanobanana (gratis)
- Filesystem (gratis)
- Tavily tier free (gratis)
- Supadata tier free (gratis)

**Skills que funcionan:** ~80% de las 33

### 🚀 ETAPA 2 — Ya estás creando contenido ($19-49/mes)
Suma:
- Higgsfield ($19-49)

**Skills que funcionan:** ~95% de las 33

### 💎 ETAPA 3 — Producción profesional ($100-200/mes)
Suma según necesites:
- Apify ($5-49) para benchmark profundo
- vidIQ ($7-79) si haces mucho YouTube
- Zapier ($20) para publicación automática
- Canva Pro ($13)

**Skills que funcionan:** 100% de las 33

---

## ❓ Preguntas frecuentes

### "¿Tengo que activar todos los MCPs antes de usar las skills?"
**No.** Activa los esenciales y arranca. Suma MCPs cuando llegues a una skill que los necesite.

### "¿Las skills me avisan si me falta un MCP?"
**Sí.** Cada skill detecta qué MCPs tiene disponibles y te avisa si uno está faltando, explicándote cómo activarlo.

### "¿Puedo compartir las API keys con otra alumna?"
**No.** Cada cuenta es personal. Compartir keys puede hacer que el servicio te suspenda y, sobre todo, te quita límites a ti.

### "¿Andrea puede ver mis API keys?"
**No.** Las keys viven solo en tu computadora (`~/.zshrc` o config de Claude.ai). Andrea nunca las ve.

### "Activé un MCP pero Claude dice que no lo ve."
1. Cierra Claude Code completamente
2. Vuélvelo a abrir
3. Si sigue, corre `/mcp` en Claude Code para ver el estado de tus MCPs

---

## 🆘 Si algo no funciona

1. **Revisa Claude.ai → Settings → Integrations** — ¿está conectado y verde?
2. **Reinicia Claude Code** completamente (no solo cerrar la ventana)
3. **Corre `/mcp`** en Claude Code para ver qué tiene activo
4. **Postea en Skool** en el tab de soporte — la comunidad te ayuda

---

**FÓRMULA 100K © 2026**
