// topojson land-110m -> puntos de tierra cada PASO grados (lon,lat) para el globo de puntos
import { readFileSync, writeFileSync } from 'node:fs';
const [inp, out, PASO = '1.6'] = process.argv.slice(2);
const t = JSON.parse(readFileSync(inp, 'utf8'));
const { scale: [sx, sy], translate: [tx, ty] } = t.transform;
const arcs = t.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arco = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const anillos = [];
for (const g of t.objects.land.geometries) {
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  for (const p of polys) for (const r of p) anillos.push(r.flatMap(arco));
}
const dentro = (x, y) => { let c = 0; for (const R of anillos) for (let i = 0, j = R.length - 1; i < R.length; j = i++) { const [xi, yi] = R[i], [xj, yj] = R[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c ^= 1; } return c; };
const pts = []; const s = +PASO;
for (let lat = -58; lat <= 82; lat += s) { const paso = s / Math.max(.25, Math.cos(lat * Math.PI / 180)); for (let lon = -180; lon < 180; lon += paso) if (dentro(lon, lat)) pts.push([+lon.toFixed(1), +lat.toFixed(1)]); }
writeFileSync(out, 'const TIERRA=' + JSON.stringify(pts) + ';');
console.log(pts.length, 'puntos');
