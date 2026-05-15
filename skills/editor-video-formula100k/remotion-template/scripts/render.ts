#!/usr/bin/env tsx
/**
 * CLI para renderizar el reel "Crea Contenido Viral".
 *
 * Uso:
 *   tsx scripts/render.ts \
 *     --video <ruta-al-mp4> \
 *     --transcript <ruta-al-transcript.json> \
 *     --cues <ruta-al-cues.json> \
 *     [--out <ruta-de-salida.mp4>] \
 *     [--duration <segundos>]
 *
 * Formato transcript.json: TranscriptWord[]  (text/start/end por palabra)
 * Formato cues.json:       { header, emphasisCues, overlayCues, brollCues }
 *
 * Si --duration se omite, se infiere del último word.end del transcript.
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {
  getCompositions,
  renderMedia,
  selectComposition,
} from '@remotion/renderer';
import type {
  BrollCue,
  CreaContenidoViralProps,
  EmphasisCue,
  HookCue,
  OverlayCue,
  ReelHeader,
  TranscriptWord,
} from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

type CuesFile = {
  header: ReelHeader;
  emphasisCues: EmphasisCue[];
  overlayCues: OverlayCue[];
  brollCues: BrollCue[];
  hookCue?: HookCue | null;
};

type Args = {
  video: string;
  transcriptPath: string;
  cuesPath: string;
  outPath: string;
  duration?: number;
};

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--video') out.video = next();
    else if (a === '--transcript') out.transcriptPath = next();
    else if (a === '--cues') out.cuesPath = next();
    else if (a === '--out') out.outPath = next();
    else if (a === '--duration') out.duration = Number(next());
  }
  if (!out.video) throw new Error('Missing --video');
  if (!out.transcriptPath) throw new Error('Missing --transcript');
  if (!out.cuesPath) throw new Error('Missing --cues');
  // --video se deja como string (debe ser relativo a public/ o una URL http(s)).
  // --transcript/--cues sí se resuelven absolutos (los lee fs).
  return {
    video: out.video,
    transcriptPath: path.resolve(out.transcriptPath),
    cuesPath: path.resolve(out.cuesPath),
    outPath: path.resolve(out.outPath ?? './reel-viral.mp4'),
    duration: out.duration,
  };
}

async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf-8');
  return JSON.parse(raw) as T;
}

// Accepts either {text,start,end} (new shape) or {word,start,end} (legacy
// from cut_silences_and_fillers.py) and normalizes.
function normalizeTranscript(raw: unknown[]): TranscriptWord[] {
  return raw
    .map((w) => {
      const obj = w as Record<string, unknown>;
      const text = String(obj.text ?? obj.word ?? '').trim();
      const start = Number(obj.start);
      const end = Number(obj.end);
      if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return null;
      return {text, start, end} as TranscriptWord;
    })
    .filter((x): x is TranscriptWord => x !== null);
}

function inferDuration(transcript: TranscriptWord[]): number {
  if (transcript.length === 0) return 1;
  return transcript[transcript.length - 1].end + 0.4;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const [transcriptRaw, cues] = await Promise.all([
    readJson<unknown[]>(args.transcriptPath),
    readJson<CuesFile>(args.cuesPath),
  ]);
  const transcript = normalizeTranscript(transcriptRaw);

  const fps = 30;
  const seconds = args.duration ?? inferDuration(transcript);
  const durationInFrames = Math.max(1, Math.ceil(seconds * fps));

  const inputProps: CreaContenidoViralProps = {
    videoSrc: args.video,
    transcript,
    header: cues.header,
    emphasisCues: cues.emphasisCues ?? [],
    overlayCues: cues.overlayCues ?? [],
    brollCues: cues.brollCues ?? [],
    hookCue: cues.hookCue ?? null,
    width: 1080,
    height: 1920,
    fps,
    durationInFrames,
  };

  console.log('[render] bundling…');
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, 'src', 'index.ts'),
    webpackOverride: (c) => c,
  });

  console.log('[render] selecting composition reel-viral…');
  const composition = await selectComposition({
    serveUrl,
    id: 'reel-viral',
    inputProps,
  });

  console.log(
    `[render] composition: ${composition.width}x${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames`
  );

  await renderMedia({
    serveUrl,
    composition: {
      ...composition,
      durationInFrames,
    },
    codec: 'h264',
    outputLocation: args.outPath,
    inputProps,
    chromiumOptions: {gl: 'angle'},
    onProgress: ({progress}) => {
      if (progress === undefined) return;
      process.stdout.write(
        `\r[render] ${(progress * 100).toFixed(1)}%`.padEnd(40)
      );
    },
  });

  process.stdout.write('\n');
  console.log(`[render] done → ${args.outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
