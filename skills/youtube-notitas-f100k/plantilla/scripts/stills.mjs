// Saca cuadros sueltos con un solo bundle: node scripts/stills.mjs <carpeta> 1.0 23.5 ...  (quedan en out/<carpeta>/)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const dir = process.argv[2];
import {mkdirSync} from 'node:fs';
const times = process.argv.slice(3).map(Number);
mkdirSync(path.join('out', dir), {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const comp = await selectComposition({serveUrl, id: 'Video'});
for (const t of times) {
	const frame = Math.round(t * 30);
	await renderStill({serveUrl, composition: comp, frame, output: `out/${dir}/t${t.toFixed(2).padStart(7, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5});
	console.log('ok', t);
}
