# Análisis del gancho de @devinjatho · 21-oct-2026

Fuente: Apify `apify/instagram-reel-scraper`, 37 reels (27-abr a 21-oct-2026), cuadro de 0,4 s de cada uno,
tiras de 0 a 3 s de 15 y Whisper de los primeros 8 s de 13. Más 5 capturas de cuentas en español con el mismo patrón.

## 1 · Cuidado con los números de arriba

Los 3 reels con más vistas (1.516.370 · 773.962 · 192.980, «FREE 100k/mo Organic Roadmap») traen en su archivo
de video la etiqueta `INSTAGRAM.AD`: son **anuncios pagados**. El mismo video del primero, subido orgánico
(DeNWzo2SWog), tiene 6.766 vistas. No se usan como prueba de gancho.

Lo orgánico que más rindió:

| Vistas | Gancho en pantalla | Lo que dice (Whisper) |
|---|---|---|
| 235.332 | SAME VIDEO BUT / **125X VIEWS** (+ contadores 44,5 K y 5,6 M) | «This is the exact same video, but the second time I posted it, it got 125 times more views» |
| 64.417 | I DONT GIVE / **2 SH\*TS** → «what niche you're in» | (sin audio extraíble) |
| 38.194 | igual al de 235 K | igual |
| 14.377 | igual al de 235 K | igual |
| 8.754 | getting clients is / **NOT HARD** | «Please do not tell me that getting clients on Instagram is hard when…» |
| 8.385 | **STEAL VIRAL** / background songs | «These backgrounds… go viral time and time again» |
| 7.267 | **INSTAGRAM** / CHEATCODE | «Instagram just gave you the biggest f*cking cheat code and you didn't even notice» |
| 6.205 | (You Will Never Go Viral If…) | «You will never go viral if you don't learn how to speak on camera» |
| 4.445 | IF I TAKE OFF / **MY CLOTHES** | «If I take off all my clothes, if I remove this luxurious background…» |
| 2.659 | you finally / **DID IT!** | «You finally get your first viral video. Congratulations. But don't f*ck it up» |

## 2 · El patrón

- **Palabras en pantalla:** 2 a 5. Nunca una tercera línea.
- **Jerarquía:** una línea chica en blanco (el contexto) y una ENORME en color (el golpe). Devin usa brillo; aquí va SIN brillo ni degradado y en letra de diseño (edición sin olor a IA).
  Rojo = negativo o amenaza, verde = logro, degradado = truco/secreto.
- **Está en el cuadro 0** y dura de 2 a 3 s; después el mismo estilo sigue como subtítulo de la frase siguiente.
- **Primera frase hablada:** negación, amenaza o insolencia en la primera palabra o casi
  («Please do NOT tell me…», «You will NEVER go viral if…», «don't get too excited», «don't f*ck it up»).
- **Consciencia baja:** habla de vistas, clientes, perfil, historias, canciones. Nunca de la herramienta.
- **Una prueba al lado** cuando la hay: contadores de vistas reales, un celular con la captura, una tarjeta de UI.
- **Repetición:** sube cada video de 3 a 7 veces. El mismo video con el mismo gancho va de 1.728 a 235.332.

Referencias en español, mismo patrón: «**ELIMINA** tus destacadas», «**NO** PAUTES SIN ANTES HACER ESTO»,
«**PUBLICAS CONTENIDO** tu Instagram no crece», «**IDEAS DE REELS** en historias». La quinta
(«Desaparece 15 días, estudia estos temas y al volver, nadie te reconocerá», 13 palabras) es la excepción larga.

## 3 · Errores típicos al empezar

Al pasar ganchos «normales» por la tarjeta de 5 puntos (corto · sin tercera línea · consciencia baja · de ti · golpe),
lo habitual es sacar menos de 2 de 5:
- Van de 7 a 15 palabras, casi nunca 5 o menos.
- Llevan tercera línea («sub»).
- Piden saber qué es la herramienta (Claude, la IA, una app).
- No traen ningún golpe negativo: son una etiqueta o una promesa plana.
- Cuando tienen golpe, está escondido en la línea 2 o 3 y diluido en 10 a 15 palabras.

Lo que suele estar bien y se queda: el gancho en el cuadro 0, en el color de la marca, sin tapar la cara, y una
primera frase hablada que ya es negativa («Borra los hashtags…», «Deja de anunciar tu oferta…»). Muchas veces el
problema es el texto en pantalla, no lo que la persona dice.

## 4 · Lo que no sabemos todavía

- Si en tu cuenta el rojo rinde igual que el color de tu marca: por eso A/B/C mezclan colores.
- Cuánto de los 235 K de Devin es gancho y cuánto es repetición: por eso la regla de 3 subidas antes de descartar.
- Cada variante es una hipótesis hasta tener sus números a 48 h.
