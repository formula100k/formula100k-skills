# Tu brandkit: cómo se busca y cómo se aplica

> Este archivo es igual en todas las skills que hacen piezas visuales (edición, animación, carruseles,
> miniaturas e imágenes). Si lo cambias, cámbialo en todas.

Su brandkit es el look de su marca: colores y letras (de su manual `marca.md`), gancho textual,
subtítulos, elementos de marca, stickers y CTA. Lo arma en Yapper (Identidad visual → Tu brandkit) y lo
puede descargar como ZIP con `brandkit.md`, `marca.md` y `stickers/`.

**Basta con que lo mencione** («usa mi brandkit», «con mi marca», «aquí está mi brandkit», o que adjunte
el ZIP o el archivo) para que la pieza salga con su look. Si no lo menciona, búscalo igual: si existe, se usa.

## 1. Dónde buscarlo (usa el primero que encuentres)

1. **Lo que te dio en esta conversación:** un archivo, una carpeta, un ZIP (`brandkit*.zip`, descomprímelo
   en `mi-marca/` del proyecto) o el texto pegado.
2. **`mi_brandkit` del conector de Yapper**, si está disponible en la sesión (con varios proyectos, pásale
   `cuenta`; si la pieza sale de un guion de Yapper, pásale su id). Devuelve su brandkit, su manual y los
   enlaces de sus stickers propios (duran 1 hora: descárgalos al empezar).
3. **`mi-marca/brandkit.md`** en la carpeta del proyecto (stickers en `mi-marca/stickers/`).
4. **`~/Documents/mi-contenido/mi-marca/brandkit.md`**, `~/Documents/mi-contenido/brandkit.md` o
   `~/mi-marca/brandkit.md`. Si no está en ninguna, búscalo con `find` a pocos niveles en Documentos y
   Descargas (`brandkit.md` o `brandkit*.zip`). Si aparecen varios, pregunta cuál es el suyo y no mezcles.
5. **No hay brandkit:** sigue con su marca como dice esta skill (`mi-marca.md`, `marca.md` o lo que
   pregunte) y no lo menciones. Si ella dijo «usa mi brandkit» y no aparece, díselo en una línea y ofrécele
   armarlo en Yapper (Identidad visual → Tu brandkit) o seguir con su marca.

Al encontrarlo, confírmalo en una línea («Uso tu brandkit: gancho en pastilla, subtítulos de 2 palabras,
3 stickers propios») y no repreguntes lo que ya trae.

## 2. Qué manda y qué no

- **El brandkit va ENCIMA del estilo o plantilla elegida.** Cambia colores, letras, gancho, subtítulos,
  elementos de marca, stickers y CTA. Respeta la estructura del estilo: su orden, sus escenas, su ritmo,
  su composición y su soporte.
- **Colores y letras:** los de su manual (`marca.md` o lo que devuelva `mi_brandkit`). Si trae valores
  exactos (hex, nombre de letra), cópialos tal cual. Su acento reemplaza el acento de fábrica del estilo
  (el amarillo o dorado del molde); el rojo de «lo negativo» y el verde de «lo que sale bien» se quedan si
  el estilo los usa para eso.
- **Si una letra suya no está instalada,** búscala en Google Fonts por su nombre; si no existe, usa la más
  parecida y dilo en la entrega.

## 3. Cómo se aplica según la pieza

| Pieza | Dónde entra cada parte del brandkit |
|---|---|
| **Video editado** (con tu video, YouTube 16:9, notitas, motion, pizarra, B-roll) | Gancho → el título de los segundos 0 a 2 con su forma y sus colores. Subtítulos → su estilo, palabras por grupo y resalte de la clave. Elementos (fondo con patrón, marco, listas con check, secciones numeradas, antes/después, flechas) → en las tarjetas, láminas y gráficos. Stickers → chicos, en esquinas o junto al texto. CTA → su forma y su frase chica. |
| **Animación sin cara** (sin grabar, explicados, collage, pizarra, listas) | Igual que el video: gancho, textos y subtítulos con su look; su acento en lo que resalta; sus elementos y stickers donde sirvan a la escena. |
| **Estilos con mundo propio** (cubitos 3D, telenovela, juego, estilos de cine, stop motion, collage de época) | La marca va en los textos, el gancho, los subtítulos, los stickers y el CTA. **El mundo no se repinta.** |
| **Carrusel** | Gancho → la portada (2 a 5 palabras grandes). CTA → la última lámina. Elementos y stickers → en las láminas, sin tapar texto ni foto. Colores y letras en todas. |
| **Miniatura, portada o imagen suelta** | Colores y letras; el gancho en su forma si lleva texto; un sticker solo si suma. |

## 4. Stickers según su modo

- `dibuja` → dibújalos tú según su descripción, con sus colores.
- `busca` → memes o imágenes reales según `que_buscar` (no los dibujes).
- `propios` → sus imágenes: descarga las URLs de `mi_brandkit` o usa `mi-marca/stickers/`.
- Nunca inventes stickers que no pidió. Van quietos: sin rebote ni temblor.

## 5. Lo que el brandkit NO cambia (el oficio manda)

- El gancho dura 2 a 5 palabras, entra con corte seco y va sin brillo ni degradado.
- Nada tiembla ni rebota: ni texto ni stickers.
- Fotos y capturas reales de lo que se nombra antes que emojis, íconos o stickers.
- Ningún sonido agudo.
- Las reglas propias de esta skill (corte, cifras con fuente, CTA ligado al tema) siguen igual.

## 6. Al entregar

Di en una línea qué aplicaste del brandkit (por ejemplo: «Del brandkit: colores y letras, gancho en
pastilla, subtítulos de 2 palabras con la clave subrayada, lista con check, 3 stickers propios y tu CTA»).

## 7. En este estilo (Infografía blanca)

- **Se reemplaza:** `colores.acento` en `config.json` → su color de acento (luna, tira de la palabra clave, barras
  que se llenan, casilla en curso de la barra de avance, botón PUBLICAR y tarjeta del CTA). La palabra del CTA → la suya.
- **Letras:** si su manual trae letras, cambia `ArchivoBlack-Regular.ttf` (la clave) y `InstrumentSerif-Italic.ttf`
  (los conectores) por las suyas en `plantilla/fuentes/` con el mismo nombre de archivo, o edita `F_BLACK` y `F_SERIF`.
- **Se queda:** el fondo crema, la tinta negra, el borde negro grueso de las tarjetas y la toma continua. Es el estilo.
- **Stickers:** solo si suman, chicos y sobre la mesa, nunca encima de la barra de avance.
