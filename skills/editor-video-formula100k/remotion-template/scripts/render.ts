#!/usr/bin/env tsx
/**
 * CLI para renderizar el reel "Crea Contenido Viral" o composiciones de motion graphics.
 *
 * Modo reel (default):
 *   tsx scripts/render.ts \
 *     --video <ruta-al-mp4> \
 *     --transcript <ruta-al-transcript.json> \
 *     --cues <ruta-al-cues.json> \
 *     [--out <ruta-de-salida.mp4>] \
 *     [--duration <segundos>] \
 *     [--canvas <lienzo-de-pip>] \
 *     [--lienzo <pizarra-con-alfa>] [--cutout <sujeto-con-alfa>]
 *
 * Modo motion graphics:
 *   tsx scripts/render.ts \
 *     --composition motion-badge|motion-stat|motion-quote|motion-list \
 *     --props '{"badgeNumber":1,"title":"..."}' \
 *     --out <ruta-de-salida.mp4>
 *
 * Modo tutorial (faceless):
 *   tsx scripts/render.ts \
 *     --mode tutorial \
 *     --audio <ruta-al-audio.m4a> \
 *     --transcript <captions.json> \
 *     --cues <cues.json> \
 *     --captions <captions_kinetic.json> \
 *     --out <ruta-de-salida.mp4>
 *
 *   NOTA: los captions cinéticos de este modo pasan por la capa compartida
 *   `src/layers/Captions.tsx`, que aplica `textTransform: uppercase` sin
 *   forma de apagarlo por prop. El componente de captions que tenía este
 *   modo antes de compartir la capa NO ponía mayúsculas — quien consuma este
 *   output esperando el casing original del transcript debe saber que ahora
 *   sale en MAYÚSCULAS.
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
  TutorialFacelessProps,
} from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

type CuesFile = {
  header: ReelHeader;
  emphasisCues: EmphasisCue[];
  overlayCues: OverlayCue[];
  brollCues: BrollCue[];
  hookCue?: HookCue | null;
  formato?: string;
  tema?: string;
  subtitulos?: boolean;
  pipEsquina?: 'tl' | 'tr' | 'bl' | 'br';
  versusEtiquetas?: {a: string; b: string};
};

type ReelArgs = {
  mode: 'reel';
  video: string;
  transcriptPath: string;
  cuesPath: string;
  outPath: string;
  duration?: number;
  canvas?: string;
  lienzo?: string;
  cutout?: string;
};

type MotionArgs = {
  mode: 'motion';
  composition: string;
  props: Record<string, unknown>;
  outPath: string;
};

type TutorialArgs = {
  mode: 'tutorial';
  audio: string;
  transcriptPath: string;
  cuesPath: string;
  captionsPath: string;
  outPath: string;
};

type Args = ReelArgs | MotionArgs | TutorialArgs;

const MOTION_COMPOSITIONS = ['motion-badge', 'motion-stat', 'motion-quote', 'motion-list'];
const MOTION_DURATIONS: Record<string, number> = {
  'motion-badge': 90,
  'motion-stat': 60,
  'motion-quote': 90,
  'motion-list': 90,
};

function parseArgs(argv: string[]): Args {
  const raw: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--mode') raw.mode = next();
    else if (a === '--video') raw.video = next();
    else if (a === '--audio') raw.audio = next();
    else if (a === '--transcript') raw.transcriptPath = next();
    else if (a === '--cues') raw.cuesPath = next();
    else if (a === '--captions') raw.captionsPath = next();
    else if (a === '--out') raw.outPath = next();
    else if (a === '--duration') raw.duration = next();
    else if (a === '--composition') raw.composition = next();
    else if (a === '--props') raw.props = next();
    else if (a === '--canvas') raw.canvas = next();
    else if (a === '--lienzo') raw.lienzo = next();
    else if (a === '--cutout') raw.cutout = next();
  }

  if (raw.mode === 'tutorial') {
    if (!raw.audio) throw new Error('Missing --audio');
    if (!raw.transcriptPath) throw new Error('Missing --transcript');
    if (!raw.cuesPath) throw new Error('Missing --cues');
    if (!raw.captionsPath) throw new Error('Missing --captions');
    return {
      mode: 'tutorial',
      audio: raw.audio,
      transcriptPath: path.resolve(raw.transcriptPath),
      cuesPath: path.resolve(raw.cuesPath),
      captionsPath: path.resolve(raw.captionsPath),
      outPath: path.resolve(raw.outPath ?? './tutorial-faceless.mp4'),
    };
  }

  if (raw.composition && MOTION_COMPOSITIONS.includes(raw.composition)) {
    const props = raw.props ? JSON.parse(raw.props) : {};
    // motion-list: recalculate duration based on items count
    if (raw.composition === 'motion-list' && Array.isArray(props.items)) {
      MOTION_DURATIONS['motion-list'] = 30 + 12 * Math.min(props.items.length, 10) + 20;
    }
    return {
      mode: 'motion',
      composition: raw.composition,
      props,
      outPath: path.resolve(raw.outPath ?? `./${raw.composition}.mp4`),
    };
  }

  if (!raw.video) throw new Error('Missing --video');
  if (!raw.transcriptPath) throw new Error('Missing --transcript');
  if (!raw.cuesPath) throw new Error('Missing --cues');
  return {
    mode: 'reel',
    video: raw.video,
    transcriptPath: path.resolve(raw.transcriptPath),
    cuesPath: path.resolve(raw.cuesPath),
    outPath: path.resolve(raw.outPath ?? './reel-viral.mp4'),
    duration: raw.duration ? Number(raw.duration) : undefined,
    canvas: raw.canvas,
    lienzo: raw.lienzo,
    cutout: raw.cutout,
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

  console.log('[render] bundling…');
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, 'src', 'index.ts'),
    webpackOverride: (c) => c,
  });

  if (args.mode === 'motion') {
    const fps = 30;
    const durationInFrames = MOTION_DURATIONS[args.composition] ?? 90;

    console.log(`[render] selecting composition ${args.composition}…`);
    const composition = await selectComposition({
      serveUrl,
      id: args.composition,
      inputProps: args.props,
    });

    console.log(
      `[render] composition: ${composition.width}x${composition.height} @ ${fps}fps, ${durationInFrames} frames`
    );

    await renderMedia({
      serveUrl,
      composition: {...composition, durationInFrames, fps},
      codec: 'h264',
      outputLocation: args.outPath,
      inputProps: args.props,
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
    return;
  }

  if (args.mode === 'tutorial') {
    const [transcriptRaw, cues, kinetic] = await Promise.all([
      readJson<unknown[]>(args.transcriptPath),
      readJson<Record<string, unknown>>(args.cuesPath),
      readJson<unknown[]>(args.captionsPath),
    ]);
    const transcript = normalizeTranscript(transcriptRaw);
    const fps = 30;
    const lastEnd = transcript.length ? transcript[transcript.length - 1].end : 1;
    const ctaDur = (cues.cta as {duration?: number} | null)?.duration ?? 0;
    const durationInFrames = Math.ceil((lastEnd + ctaDur + 0.5) * fps);

    const inputProps: TutorialFacelessProps = {
      audioSrc: path.basename(args.audio),
      transcript,
      kineticCaptions: kinetic as TutorialFacelessProps['kineticCaptions'],
      hookCard: (cues.hookCard as TutorialFacelessProps['hookCard']) ?? null,
      background: (cues.background as TutorialFacelessProps['background']) ?? [],
      cards: (cues.cards as TutorialFacelessProps['cards']) ?? [],
      broll: (cues.broll as TutorialFacelessProps['broll']) ?? [],
      cta: (cues.cta as TutorialFacelessProps['cta']) ?? null,
      captionsConfig: (cues.captions as TutorialFacelessProps['captionsConfig']) ?? {enabled: true, position: 'lower-third'},
      width: 1080, height: 1920, fps, durationInFrames,
    };

    console.log('[render] selecting composition tutorial-faceless…');
    const composition = await selectComposition({
      serveUrl,
      id: 'tutorial-faceless',
      inputProps,
    });

    console.log(
      `[render] composition: ${composition.width}x${composition.height} @ ${fps}fps, ${durationInFrames} frames`
    );

    await renderMedia({
      serveUrl,
      composition: {...composition, durationInFrames},
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
    return;
  }

  // mode === 'reel'
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
    formato: cues.formato ?? 'fullscreen',
    tema: cues.tema ?? 'default',
    subtitulos: cues.subtitulos ?? false,
    canvasSrc: args.canvas ? path.basename(args.canvas) : undefined,
    pipEsquina: cues.pipEsquina,
    versusEtiquetas: cues.versusEtiquetas,
    lienzoSrc: args.lienzo ? path.basename(args.lienzo) : undefined,
    cutoutSrc: args.cutout ? path.basename(args.cutout) : undefined,
  };

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
