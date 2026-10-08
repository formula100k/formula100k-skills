# Tabla de montaje · Plantas de interior según la luz de tu casa

Duración total: 50,08 s · 12 fragmentos de 2,00 s.
Cada fragmento entra cuando su fila se enciende (aparece el nombre y el indicador empieza a llenarse). Entre categorías habla la voz y no suena nada.

| # | Archivo en `audios/` | Categoría | Nombre | Autor | Entra (s) | Sale (s) | Desde el segundo del archivo |
|---|---|---|---|---|---|---|---|
| 1 | `01.mp3` | Sol directo | Aloe vera | Aloe barbadensis | 4,33 | 6,33 | 0,00 |
| 2 | `02.mp3` | Sol directo | Árbol de jade | Crassula ovata | 6,33 | 8,33 | 0,00 |
| 3 | `03.mp3` | Sol directo | Echeveria | Echeveria elegans | 8,33 | 10,33 | 1,00 |
| 4 | `04.mp3` | Luz brillante sin sol | Monstera | Monstera deliciosa | 14,64 | 16,64 | 0,00 |
| 5 | `05.mp3` | Luz brillante sin sol | Ficus lira | Ficus lyrata | 16,64 | 18,64 | 0,00 |
| 6 | `06.mp3` | Luz brillante sin sol | Pilea | Pilea peperomioides | 18,64 | 20,64 | 2,00 |
| 7 | `07.mp3` | Luz media | Potus | Epipremnum aureum | 23,76 | 25,76 | 0,00 |
| 8 | `08.mp3` | Luz media | Cinta | Chlorophytum comosum | 25,76 | 27,76 | 0,00 |
| 9 | `09.mp3` | Luz media | Calatea | Goeppertia orbifolia | 27,76 | 29,76 | 0,00 |
| 10 | `10.mp3` | Poca luz | Sansevieria | Dracaena trifasciata | 33,33 | 35,33 | 0,00 |
| 11 | `11.mp3` | Poca luz | Zamioculca | Zamioculcas zamiifolia | 35,33 | 37,33 | 0,00 |
| 12 | `12.mp3` | Poca luz | Aspidistra | Aspidistra elatior | 37,33 | 39,33 | 0,00 |

## Voz

| Frase | Entra (s) | Dura (s) | Texto |
|---|---|---|---|
| 01 | 0,45 | 3,53 | Si a tu ventana le da el sol directo, pon una de estas. |
| 02 | 10,68 | 3,61 | Si entra mucha luz, pero sin sol directo, estas. |
| 03 | 20,99 | 2,42 | Para un cuarto con luz media, estas. |
| 04 | 30,11 | 2,87 | Y si casi no entra luz, estas aguantan. |
| 05 | 39,78 | 5,71 | Estas son doce. La guía completa trae treinta plantas, ordenadas por luz y por riego. |
| 06 | 46,04 | 2,44 | Comenta la palabra plantas y te la mando. |

## Cómo ponerle el sonido

- **Automático:** deja los audios en `audios/` con los nombres de la tabla (`01.mp3`, `02.mp3`…; también vale `01-nombre.mp3`) y corre `mezclar.mjs`. Para elegir qué parte de cada audio suena, cambia `inicio` en ese ítem de `config.js`.
- **A mano en tu editor:** pon cada fragmento en su segundo «Entra», con 2,00 s de largo, por debajo de la voz (`pista-voz.wav` ya viene alineada al video).
- **Quién pone la música:** la música comercial la consigue y la licencia quien publica. Esta carpeta no trae audios de terceros.
- **Antes de darlo por bueno:** prueba en tu cuenta si Instagram deja publicar un reel con 12 fragmentos de música distintos sin silenciarlo ni limitarlo. No está comprobado.
- **Opción segura:** publica el MP4 que solo lleva la voz y ponle, al subirlo, UN audio de la biblioteca de Instagram a volumen bajo.
- Si cambias `tiempos.fragmento`, la voz o el orden, vuelve a correr `voz.mjs`, el render y este script: los segundos cambian.
