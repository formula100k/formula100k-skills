# Texturas reales para la serie

Todas son NASA (dominio público). Bájalas a `<PROYECTO>/fuente/assets/` con
`node <skill>/scripts/bajar-texturas.mjs <PROYECTO>/fuente/assets` (agrega `--tesela B2` para la tesela de alta).

| Archivo | Qué es | De dónde |
|---|---|---|
| `earth-blue-marble.jpg` | Blue Marble 4096 px, para mapas 2D reproyectados | three-globe en jsDelivr (`cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg`) |
| `earth-topology.png` | relieve 2048 px (bumpMap) | three-globe, misma carpeta |
| `tierra-5400.jpg` | BMNG topografía + batimetría, diciembre, 5400×2700 (Tierra 3D) | `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg` |
| `chile-alta.jpg` | parche 30°×30° a 240 px/grado (1,8 km/px) | recorte de la tesela B2 |

## Teselas de alta (21.600 × 21.600, 90° × 90°, ~50 MB)
`https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x21600x21600.<T>.jpg`

| T | Longitud | Latitud |
|---|---|---|
| A1 | 180° O – 90° O | 90° N – 0 |
| B1 | 90° O – 0 | 90° N – 0 |
| C1 | 0 – 90° E | 90° N – 0 |
| D1 | 90° E – 180° | 90° N – 0 |
| A2 / B2 / C2 / D2 | igual | 0 – 90° S |

Recorte de un parche (240 px por grado; máx. 8192 px por lado, el render sin ventana no carga texturas más grandes),
igual en Mac y Windows:
```
uv run <skill>/scripts/recortar_tesela.py TESELA.jpg parche.jpg <(latNorteTesela − latNorteParche)·240> <(lonOesteParche − lonOesteTesela)·240> <alto> <ancho>
```
Ej. Chile: B2, lon −90…−60, lat −25…−55 → `uv run recortar_tesela.py tesela-B2.jpg chile-alta.jpg 6000 0 7200 7200`.

En three.js el parche es `SphereGeometry(R + .12, 240, 240, (lonOeste+180)°, ancho°, (90−latNorte)°, alto°)` con
`polygonOffset`. Grados a radianes. Mapeo lon/lat → mundo: `v3()` del ejemplo.
