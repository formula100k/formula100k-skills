#!/usr/bin/env node
// Escribe la TABLA DE MONTAJE: qué fragmento entra en qué segundo. Sale en MONTAJE.md y montaje.csv.
//   node montaje.mjs <carpeta>
import fs from 'node:fs';
import path from 'node:path';
import { carpeta, leerConfig, leerTiempos, items, buscarAudio, seg } from './comun.mjs';

const dir = carpeta(process.argv.slice(2));
const C = leerConfig(dir), T = leerTiempos(dir), IT = items(C, T), F = T.frag;
const audios = path.join(dir, 'audios');
const fila = it => {
  const a = buscarAudio(audios, it.num);
  return { ...it, archivo: a ? path.basename(a) : `${it.num}.mp3`, esta: !!a, sale: it.entra + F };
};
const filas = IT.map(fila);

let md = `# Tabla de montaje · ${C.titulo.linea1}${C.titulo.linea2 ? ' ' + C.titulo.linea2 : ''}\n\n`;
md += `Duración total: ${seg(T.dur)} s · ${filas.length} fragmentos de ${seg(F)} s.${T.estimado ? ' **Tiempos ESTIMADOS: falta la voz.**' : ''}\n`;
md += `Cada fragmento entra cuando su fila se enciende (aparece el nombre y el indicador empieza a llenarse). Entre categorías habla la voz y no suena nada.\n\n`;
md += `| # | Archivo en \`audios/\` | Categoría | Nombre | Autor | Entra (s) | Sale (s) | Desde el segundo del archivo |\n|---|---|---|---|---|---|---|---|\n`;
filas.forEach(f => { md += `| ${f.n} | \`${f.archivo}\`${f.esta ? '' : ' (falta)'} | ${f.categoria} | ${f.nombre} | ${f.autor || ''} | ${seg(f.entra)} | ${seg(f.sale)} | ${seg(f.inicio)} |\n`; });
md += `\n## Voz\n\n| Frase | Entra (s) | Dura (s) | Texto |\n|---|---|---|---|\n`;
T.frases.forEach(f => { md += `| ${f.num} | ${seg(f.entra)} | ${seg(f.dura)} | ${f.texto} |\n`; });
md += `\n## Cómo ponerle el sonido\n\n`;
md += `- **Automático:** deja los audios en \`audios/\` con los nombres de la tabla (\`01.mp3\`, \`02.mp3\`…; también vale \`01-nombre.mp3\`) y corre \`mezclar.mjs\`. Para elegir qué parte de cada audio suena, cambia \`inicio\` en ese ítem de \`config.js\`.\n`;
md += `- **A mano en tu editor:** pon cada fragmento en su segundo «Entra», con ${seg(F)} s de largo, por debajo de la voz (\`pista-voz.wav\` ya viene alineada al video).\n`;
md += `- **Quién pone la música:** la música comercial la consigue y la licencia quien publica. Esta carpeta no trae audios de terceros.\n`;
md += `- **Antes de darlo por bueno:** prueba en tu cuenta si Instagram deja publicar un reel con ${filas.length} fragmentos de música distintos sin silenciarlo ni limitarlo. No está comprobado.\n`;
md += `- **Opción segura:** publica el MP4 que solo lleva la voz y ponle, al subirlo, UN audio de la biblioteca de Instagram a volumen bajo.\n`;
md += `- Si cambias \`tiempos.fragmento\`, la voz o el orden, vuelve a correr \`voz.mjs\`, el render y este script: los segundos cambian.\n`;
fs.writeFileSync(path.join(dir, 'MONTAJE.md'), md);

const c = v => /[",;\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
const csv = [['numero', 'archivo', 'categoria', 'nombre', 'autor', 'etiqueta', 'entra_s', 'sale_s', 'dura_s', 'inicio_en_archivo_s'].join(',')]
  .concat(filas.map(f => [f.n, f.archivo, f.categoria, f.nombre, f.autor || '', f.etiqueta || '', f.entra.toFixed(2), f.sale.toFixed(2), F.toFixed(2), f.inicio.toFixed(2)].map(c).join(',')));
fs.writeFileSync(path.join(dir, 'montaje.csv'), csv.join('\n') + '\n');
const faltan = filas.filter(f => !f.esta).length;
console.log(`Escrito MONTAJE.md y montaje.csv en ${dir} · ${filas.length} fragmentos · ${faltan ? faltan + ' audios todavía no están en audios/' : 'todos los audios están'}`);
