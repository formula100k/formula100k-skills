// Render completo: node scripts/render.mjs [salida]
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import os from 'node:os';
const out = process.argv[2] || 'out/video.mp4';
const range = process.argv[3] ? process.argv[3].split('-').map(Number) : null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id: 'Video'});
let last = -1;
await renderMedia({
	serveUrl,
	composition,
	codec: 'h264',
	crf: 17,
	jpegQuality: 92,
	audioBitrate: '320k',
	concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
	outputLocation: out,
	...(range ? {frameRange: [range[0], range[1]]} : {}),
	onProgress: ({progress}) => {
		const p = Math.floor(progress * 100);
		if (p !== last && p % 2 === 0) console.log(new Date().toISOString().slice(11, 19), p + '%');
		last = p;
	},
});
console.log('listo', out);
