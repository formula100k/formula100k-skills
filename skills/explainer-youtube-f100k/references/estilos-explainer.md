# Catálogo de 8 estilos de Explainer · FÓRMULA 100K

Cada estilo se construye sobre el mismo motor HTML/SVG/GSAP (`templates/explainer-base.html`) cambiando paleta, textura, tipografía, tipo de recursos y movimiento de cámara.

| # | ID | Nombre | Cuándo usarlo | Paleta base | Tipografía | Recursos |
|---|---|---|---|---|---|---|
| 1 | `papel-narrado` | **Papel y dibujo narrado** | Enseñar una idea paso a paso, conceptos, frameworks | Fondo `#FAF6EE` (papel crema), tinta `#1C1917`, acento `#E11D48` / `#0D9488` | Bricolage Grotesque + Caveat (anotaciones) | Trazos SVG animados (`stroke-dashoffset`) + flechas a mano |
| 2 | `periodismo-vox` | **Periodismo visual (Vox)** | Casos de estudio, noticias, análisis de mercado | Fondo `#0E0E12` con grano fino, texto `#F8FAFC`, resaltador `#FACC15`, alerta `#EF4444` | Barlow Condensed (títulos) + IBM Plex Mono (fuentes/datos) | Fotos y capturas reales recortadas + etiquetas de fuente + subrayado amarillo |
| 3 | `vector-kurzgesagt` | **Vector flat colorido** | Explicar sistemas, comparaciones, historias educativas | Fondo `#0B132B` o `#1E1B4B`, formas geométricas en `#38BDF8`, `#FB7185`, `#FBBF24`, `#34D399` | Plus Jakarta Sans Bold + Inter | Ilustraciones vectoriales limpias con sombras planas y movimiento fluido |
| 4 | `pizarra-estudio` | **Pizarra con tiza / Estudio** | Clases, fórmulas, paso a paso tipo tutoría | Pizarra `#14211D` con tiza `#F4F4F0` + amarillo `#FDE047`, o Estudio `#F8FAFC` con `#0F172A` | Space Grotesk + Caveat | Diagramas que se dibujan en vivo, círculos de énfasis y numeración clara |
| 5 | `datos-finanzas` | **Datos y finanzas (3Blue1Brown)** | Cifras, métricas, crecimiento, comparativas numéricas | Fondo `#090D16`, grilla tenue `rgba(255,255,255,0.06)`, curvas `#38BDF8` y `#34D399`, alerta `#F43F5E` | Outfit / Space Grotesk + JetBrains Mono (números tabulares) | Gráficas animadas SVG, contadores numéricos y líneas de tendencia |
| 6 | `catalogo-producto` | **Catálogo blanco de producto** | Demos de app, lanzamientos, presentar una oferta | Fondo `#FFFFFF` con grilla de puntos `#E2E8F0`, texto `#0F172A`, acento de marca | Plus Jakarta Sans + Inter | Capturas reales de pantalla en marcos limpios + llamadas con flechas |
| 7 | `boceto-vintage` | **Boceto vintage / Historia** | Biografías, origen de marcas, evolución histórica | Papel sepia `#F2E8D5`, tinta `#2B2118`, acento óxido `#B45309` | Playfair Display + Crimson Pro | Ilustraciones estilo grabado/tinta + líneas de tiempo + sellos editoriales |
| 8 | `flujo-continuo` | **Flujo continuo (vector)** | Procesos, recorridos, «antes vs. después», velocidad | Fondo degradado limpio según tema, sujeto anclado al centro | Syne / Space Grotesk + IBM Plex Mono | Pista horizontal en parallax con hitos y métricas integradas al escenario |

## Dos gramáticas de cámara (anti-PowerPoint)
1. **Lienzo con cámara viva** (estilos 1, 2, 3, 4, 5, 6 y 7):
   - Coloca las escenas en un escenario más grande que el cuadro (`world`), y mueve la cámara con `transform: translate(...) scale(...)` usando `gsap.timeline()`.
   - Secuencia base: plano detalle del elemento A → paneo al elemento B → alejamiento a vista completa (`home`) → empuje directo (`push-through`) a la siguiente zona.
2. **Flujo continuo** (estilo 8):
   - El protagonista o ícono principal permanece estable en el tercio izquierdo/centro mientras el fondo y los hitos desfilan en capas de parallax (fondo lento, plano medio normal, primer plano rápido).

## Reglas de legibilidad en 1920×1080 (YouTube 16:9)
- **Título principal:** 72–96 px, máximo 6 palabras por golpe.
- **Subtítulos / anotaciones:** mínimo 30–36 px (para que se lean sin esfuerzo en celular).
- **Zona segura:** deja 80 px libres en los bordes y 140 px abajo si el video lleva subtítulos quemados.
- **Un dato a la vez:** nunca llenes la pantalla con párrafos; máximo 1 frase corta + 1 número o diagrama por golpe.
