# Tu mapa te miente · clon del reel De0C1AHxBFq

**Qué es:** clon de edición del reel de @viani.pro «¿Por qué los aviones no vuelan en línea recta?»
(https://www.instagram.com/reel/De0C1AHxBFq/, publicado el 22-oct-2026; el 23-oct tenía 63.572 likes y 2.904 comentarios;
las reproducciones no se ven). Mismo tema, que ya está validado, con otro guion, marca propia, la voz de quien publica y un CTA a un regalo propio.
Lo hizo Claude de punta a punta: guion, dibujo de cada cuadro con código, voz y mezcla.

## Gancho (autoevaluado: se entrega solo el ganador)
| Variante | Palabra clave | Coherente | Sin contexto | Negativo | De TÚ | Total |
|---|---|---|---|---|---|---|
| **A · «tu mapa / TE MIENTE»** ✅ | mapa | sí | sí | sí | sí | 5/5 |
| B · «los aviones / NO VUELAN RECTO» | aviones | sí | sí | sí | no | 4/5 |
| C · «1.434 KM / de mentira» | cifra | no (dos ideas pegadas) | no | sí | no | 2/5 |
Gana A porque se lee como una sola frase, habla de TI y la voz arranca diciendo lo mismo.

## Guion (16 frases)
1. Tu mapa te miente.
2. Mira este vuelo de Santiago a Sídney.
3. En vez de cruzar derecho el océano, baja casi hasta la Antártida.
4. Parece un desvío enorme. Pero esa curva es el camino más corto.
5. Son unos 1.400 kilómetros menos que ir derecho.
6. El que te engaña es el mapa. La Tierra es una pelota.
7. Y aplanar una pelota es como aplastar la cáscara de una naranja: se rompe.
8. Para tapar los huecos, el mapa estira todo lo que está cerca de los polos.
9. Por eso Groenlandia parece tan grande como África.
10. Pero África es catorce veces más grande.
11. Ahora pon un hilo tenso sobre el globo, de Santiago a Sídney.
12. El hilo se va al sur, donde la Tierra es más angosta.
13. Al aplanarla en el mapa, ese hilo recto se ve torcido.
14. El avión sí vuela recto. El torcido es el mapa.
15. Este video lo hizo Claude, sin cámara y sin editor.
16. Comenta GUIA y te mando la guía para hacer videos así.

## De dónde sale cada cifra
- **1.434 km** (en pantalla; en la voz, «unos 1.400»): cálculo propio desde el aeropuerto de Santiago (SCL, 33,39° S, 70,79° O)
  hasta el de Sídney (SYD, 33,95° S, 151,18° E), con un radio terrestre de 6.371 km. La ruta más corta (ortodrómica) mide 11.340 km
  y la de rumbo fijo, que en el mapa Mercator se ve recta (loxodrómica), 12.774 km. La diferencia es de 1.434 km y coincide con la referencia.
- **14 veces**: superficie de África, 30,37 millones de km², contra la de Groenlandia, 2,166 millones de km² (30,37 / 2,166 = 14,0).

## Material
- Apertura en 3D (la primera versión abría en un mapa plano y se rechazó): Tierra en three.js con NASA Blue Marble Next Generation (topografía y batimetría, diciembre 2004), un parche en alta sobre Chile (1,8 km por píxel, recorte de la tesela B2) y la atmósfera calculada desde la cámara. El avión está modelado con piezas y no va a escala. Sale de la cordillera, va recto al oeste por la línea punteada, gira al suroeste (214,5°, el rumbo real de la ruta más corta) y la cámara sube hasta ver el globo. Después hay un corte seco al mapa plano.
- Mapa: NASA Blue Marble (dominio público), copia de three-globe en jsDelivr. El globo, los gajos y el Mercator se reproyectan píxel a píxel desde esa imagen.
- Siluetas de África y Groenlandia: Natural Earth 1:110m (dominio público).
- Cierre: la página completa del regalo capturada en celular (390 px; `assets/regalo-pagina-completa.jpg`, con `scripts/capturar-pagina.mjs`). El mockup baja por toda la página, desde la portada hasta el formulario del correo, para que se vea todo lo que trae el regalo.
- Efectos de sonido: sintetizados con `scripts/sonidos.mjs` (ffmpeg, sin archivos de terceros). Sin música (se pone al publicar).

## Por confirmar
- ⚠️ La palabra **GUIA** en la automatización de mensajes todavía no está armada.
- ⚠️ No lleva CTA a mitad de video: en una pieza viral de curiosidad, vender a la mitad corta el misterio. Si lo quieres, se agrega como texto en pantalla en la escena de Groenlandia.

## Cómo rehacerlo
`node <skill>/scripts/voz.mjs fuente/pieza.src.html voz video-voz.mp4`
y luego `node <skill>/scripts/mezclar.mjs fuente/pieza.html video-voz.mp4 sfx TU-MAPA-TE-MIENTE.mp4`.
