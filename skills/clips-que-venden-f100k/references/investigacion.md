# Investigación especializada de clips

La regla de oro: **una referencia se valida mirando el video, no leyendo el caption.** Y las vistas se sacan del scraper, no de un CSV ni de lo que diga alguien.

## Entrada A · te pasan links
1. `scripts/investigar.sh <carpeta> <url1> <url2> …` baja video + info, arma la hoja de 24 cuadros, detecta los cortes de plano y transcribe lo que se oye. Deja `fichas.md`.
2. Vistas reales con Apify (MCP): `apify/instagram-scraper` con `{"directUrls":[…], "resultsType":"posts", "resultsLimit":1}` → `get-dataset-items` con `fields=shortCode,ownerUsername,videoPlayCount,likesCount,commentsCount,videoDuration,timestamp`. `videoPlayCount` = las vistas que muestra Instagram. Para TikTok, `clockworks/tiktok-scraper` con `postURLs`.
3. Abre CADA `sheet_<id>.jpg` con Read. Anota en la ficha **«qué es de verdad»**: cuántas tomas, dónde va el texto y cuándo cambia, si habla o no, qué se ve en pantalla, cómo cierra. Muchas veces el título que te dieron no coincide con el video (p. ej., una idea anotada como «qué tanto amas a X» era en realidad «How systematic are you? Me:» en un baño).
4. Clasifica cada una: molde (moldes.md) + esqueleto (metodo.md) + sabor (tranqui / humor de oficio / hablado). Si no encaja en ninguno, es un **molde nuevo**: descríbelo y agrégalo a moldes.md con su vista real.
5. Lee el conjunto: ¿qué se repite en lo que le gusta a la creadora? (sabor, duración, si habla o no, si es cuadro único). Eso define hacia dónde se mueve su carril B. Escríbelo en 3 o 4 frases con números.

## Entrada B · cazar referencias nuevas
Busca MECÁNICAS, no temas. Un formato vale cuando aparece en 2 o más nichos que no tienen nada que ver.
1. **Humor de oficio (cross-niche):** `apify/instagram-scraper` con `{"search":"<hashtag>","searchType":"hashtag","resultsType":"reels","resultsLimit":40}` sobre hashtags de oficios: `corporatehumor`, `worklife`, `officehumor`, `marketinghumor`, `developerhumor`, `nursehumor`, `teacherlife`, `creatorlife`, `smallbusinesshumor`, `relatable`. En español: `humorlaboral`, `emprendedora`, `vidadeoficina`.
2. **Filtro duro:** `videoPlayCount` ≥ 500 mil · `videoDuration` ≤ 20 s · publicado en los últimos 90 días. Ordena por vistas ÷ seguidores de la cuenta si lo tienes: un viral de cuenta chica pesa más.
3. De los que pasan, baja los 10 mejores con `investigar.sh` y **míralos** (paso A-3). Descarta los que solo funcionan por la cara o la fama de la persona.
5. **Presupuesto:** una caza = 1 o 2 corridas de Apify (≈ centavos). No lances más de 5 hashtags por corrida sin avisar.

## Cómo se pasa una referencia a la creadora (adaptar, no copiar)
- Se copia la **mecánica** (esqueleto + estructura del texto + tipo de toma), nunca el tema ni la frase literal.
- El oficio se cambia por el de la audiencia de la creadora. Usa el oficio y los dolores de tu perfil.md.
- El remate tiene que ser algo que su audiencia vive de verdad (DM de «info», la tía que comenta, el reel en borradores).
- El valor va en el copy y la palabra clave cierra.
- Cifras solo reales y con fuente. Si el molde pide un número que no tienes (tiempos, dinero, seguidores), déjalo como `[tu número real]` y pídelo.
