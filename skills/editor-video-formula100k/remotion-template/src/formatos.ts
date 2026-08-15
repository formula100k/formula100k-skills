// ──────────────────────────────────────────────────────────────────────
// Catálogo de formatos de edición — DATOS PUROS.
//
// Este archivo NO importa React a propósito: lo leen tanto el render como
// el agente cuando propone un formato. Si le agregas un import de React,
// rompes el segundo consumidor.
// ──────────────────────────────────────────────────────────────────────

export type CapaId =
  | 'header' | 'emphasis' | 'overlay' | 'broll'
  | 'hook' | 'captions' | 'sfx';

/** Modo de `scripts/render.ts` que sabe montar este formato. */
export type ModoRender = 'reel' | 'tutorial' | 'news';

export type FormatoDef = {
  id: string;
  nombre: string;
  /** Qué es, en una línea. Se muestra al proponer. */
  descripcion: string;
  /** Señales en el transcript o la carpeta que sugieren este formato. */
  cuandoUsar: string[];
  dimensiones: {w: number; h: number};
  /** Id de composición Remotion registrada en Root.tsx. */
  composicion: string;
  modo: ModoRender;
  /** Capas que este formato admite. */
  capas: CapaId[];
  /** Cuáles vienen encendidas. Las ausentes se consideran apagadas. */
  capasDefault: Partial<Record<CapaId, boolean>>;
  temaDefault: string;
};

export const FORMATO_DEFAULT = 'fullscreen';

export const FORMATOS: FormatoDef[] = [
  {
    id: 'fullscreen',
    nombre: 'Cara completa',
    descripcion: 'Talking-head 9:16 a pantalla completa con overlays en los tercios.',
    cuandoUsar: [
      'el video es sólo Andrea hablando a cámara',
      'no hay screen recordings en la carpeta',
      'el contenido es opinión, storytelling o enseñanza sin demo',
    ],
    dimensiones: {w: 1080, h: 1920},
    composicion: 'reel-viral',
    modo: 'reel',
    capas: ['header', 'emphasis', 'overlay', 'broll', 'hook', 'captions', 'sfx'],
    capasDefault: {header: true, emphasis: true, overlay: true, broll: true, hook: true, sfx: true},
    temaDefault: 'default',
  },
  {
    id: 'split',
    nombre: 'Panel dividido',
    descripcion: 'Canvas arriba (tarjeta o screen-rec) y la cara abajo, sin solaparse.',
    cuandoUsar: [
      'el guion avanza por pasos numerados',
      'hay tarjetas o infografías que merecen protagonismo',
      'quieres mostrar algo sin taparte la cara',
    ],
    dimensiones: {w: 1080, h: 1920},
    composicion: 'reel-viral',
    modo: 'reel',
    capas: ['emphasis', 'overlay', 'broll', 'captions', 'sfx'],
    capasDefault: {emphasis: true, overlay: true, broll: true, captions: true, sfx: true},
    temaDefault: 'crema-editorial',
  },
  {
    id: 'pip',
    nombre: 'Cámara en recuadro',
    descripcion: 'Screen recording a pantalla completa con la cámara en un recuadro.',
    cuandoUsar: [
      'hay un screen recording largo en la carpeta',
      'el guion dice "te muestro", "mira esto", "acá se ve"',
      'es un tutorial o demo de una app',
    ],
    dimensiones: {w: 1080, h: 1920},
    composicion: 'reel-viral',
    modo: 'reel',
    capas: ['overlay', 'broll', 'captions', 'sfx'],
    capasDefault: {overlay: true, broll: true, captions: true, sfx: true},
    temaDefault: 'default',
  },
  {
    id: 'faceless',
    nombre: 'Sin cara',
    descripcion: 'Screen recording y tarjetas sobre voz en off, sin cámara.',
    cuandoUsar: [
      'no hay video de cámara, sólo audio',
      'el contenido es 100% demostración de pantalla',
    ],
    dimensiones: {w: 1080, h: 1920},
    composicion: 'tutorial-faceless',
    modo: 'tutorial',
    capas: ['broll', 'captions', 'sfx'],
    capasDefault: {broll: true, captions: true, sfx: true},
    temaDefault: 'default',
  },
  {
    id: 'noticiero',
    nombre: 'Noticiero',
    descripcion: 'Formato horizontal 16:9 con barra de noticias, chyrons y tarjetas.',
    cuandoUsar: [
      'el contenido son noticias o novedades de la semana',
      'el destino es YouTube horizontal',
    ],
    dimensiones: {w: 1920, h: 1080},
    composicion: 'news-horizontal',
    modo: 'news',
    capas: ['overlay', 'broll', 'sfx'],
    capasDefault: {overlay: true, broll: true, sfx: true},
    temaDefault: 'default',
  },
];

export function getFormato(id: string): FormatoDef | undefined {
  return FORMATOS.find((f) => f.id === id);
}
