#!/usr/bin/env tsx
/**
 * CLI para renderizar la composición horizontal "FÓRMULA 100K NEWS" (1920×1080).
 *
 *   tsx scripts/render_news.ts \
 *     --video _source_cut.mov \
 *     --transcript <captions.json> \
 *     --cues <news_cues.json> \
 *     [--out <salida.mp4>] \
 *     [--duration <segundos>]
 *
 * news_cues.json = { brand, ticker[], chyrons[], cards[] }
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

type Word = {text: string; start: number; end: number};

function parseArgs(argv: string[]) {
  const raw: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--video') raw.video = next();
    else if (a === '--transcript') raw.transcript = next();
    else if (a === '--cues') raw.cues = next();
    else if (a === '--out') raw.out = next();
    else if (a === '--duration') raw.duration = next();
  }
  if (!raw.video) throw new Error('Missing --video');
  if (!raw.transcript) throw new Error('Missing --transcript');
  if (!raw.cues) throw new Error('Missing --cues');
  return {
    video: raw.video,
    transcriptPath: path.resolve(raw.transcript),
    cuesPath: path.resolve(raw.cues),
    outPath: path.resolve(raw.out ?? './news-horizontal.mp4'),
    duration: raw.duration ? Number(raw.duration) : undefined,
  };
}

async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await fs.readFile(p, 'utf-8')) as T;
}

function normalizeTranscript(raw: unknown[]): Word[] {
  return raw
    .map((w) => {
      const o = w as Record<string, unknown>;
      const text = String(o.text ?? o.word ?? '').trim();
      const start = Number(o.start);
      const end = Number(o.end);
      if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return null;
      return {text, start, end} as Word;
    })
    .filter((x): x is Word => x !== null);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const [transcriptRaw, cues] = await Promise.all([
    readJson<unknown[]>(args.transcriptPath),
    readJson<Record<string, unknown>>(args.cuesPath),
  ]);
  const transcript = normalizeTranscript(transcriptRaw);

  const fps = 30;
  const lastEnd = transcript.length ? transcript[transcript.length - 1].end : 1;
  const seconds = args.duration ?? lastEnd + 0.4;
  const durationInFrames = Math.max(1, Math.ceil(seconds * fps));

  const inputProps = {
    videoSrc: args.video,
    transcript,
    brand: (cues.brand as string) ?? 'F100K NEWS',
    ticker: (cues.ticker as string[]) ?? [],
    chyrons: (cues.chyrons as unknown[]) ?? [],
    cards: (cues.cards as unknown[]) ?? [],
    width: 1920,
    height: 1080,
    fps,
    durationInFrames,
  };

  console.log('[render] bundling…');
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, 'src', 'index.ts'),
    webpackOverride: (c) => c,
  });

  console.log('[render] selecting composition news-horizontal…');
  const composition = await selectComposition({
    serveUrl,
    id: 'news-horizontal',
    inputProps,
  });

  console.log(
    `[render] composition: ${composition.width}x${composition.height} @ ${fps}fps, ${durationInFrames} frames (${seconds.toFixed(1)}s)`
  );

  await renderMedia({
    serveUrl,
    composition: {...composition, durationInFrames, fps},
    codec: 'h264',
    outputLocation: args.outPath,
    inputProps,
    chromiumOptions: {gl: 'angle'},
    concurrency: null,
    onProgress: ({progress}) => {
      if (progress === undefined) return;
      process.stdout.write(`\r[render] ${(progress * 100).toFixed(1)}%`.padEnd(40));
    },
  });

  process.stdout.write('\n');
  console.log(`[render] done → ${args.outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
