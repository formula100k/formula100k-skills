// Registro de ESTILOS de edición — datos puros, sin React (igual que
// `formatos.ts`, y por la misma razón: lo leen el render, el agente y el
// build de la vitrina web; un import de React rompe a los dos últimos).
//
// Un "estilo" es lo que la alumna elige en la vitrina. Un "formato" es lo que
// el render sabe componer. Hoy son 1:1, pero no siempre lo serán: a futuro un
// estilo podrá resolverse con otra skill (`collage-cine-f100k`,
// `motion-reels-f100k`) y la alumna no debería notar la diferencia. Por eso
// `resuelvePor` existe desde ya — es un discriminante de un campo, barato
// ahora, y evita migrar el JSON del catálogo después.
//
// REGLA DURA: un estilo no entra acá hasta que su render salga bien de punta
// a punta. Es el bug que ya pasó con `faceless`/`noticiero`: el catálogo
// prometía formatos que el `/render` no sabía invocar. Vale más un catálogo
// de cuatro honesto que uno de cinco con una promesa falsa.

export type EstiloDef = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Señales del guion o del material que hacen que este estilo sea el bueno. */
  cuandoUsar: string[];
  /** Quién sabe producirlo. En v1 siempre 'formato'; 'skill' llega en v1.1. */
  resuelvePor: 'formato' | 'skill';
  /** Id del formato de `formatos.ts`, o slug de la skill si `resuelvePor` es 'skill'. */
  referencia: string;
  /** Requisitos duros: sin esto el estilo no se puede montar. */
  requiere: string[];
  /** Ruta del video de muestra dentro de la vitrina. */
  demo: string;
};

// ──────────────────────────────────────────────────────────────────────
// Las dos primeras partes del prompt son IDÉNTICAS en los cinco estilos, así
// que viven acá una sola vez. Si mañana cambia el instalador, cambia en un
// solo lugar y los cinco prompts quedan al día solos.
// ──────────────────────────────────────────────────────────────────────

/** Parte 1 — instalación. Hace el catálogo servible para alguien sin nada instalado. */
export const PARTE_INSTALACION = `Si todavía no tengo el editor de video instalado, instálalo primero corriendo \`bootstrap.sh\` (macOS) o \`bootstrap.ps1\` (Windows) de la skill \`editor-video-formula100k\`. Si ya lo tengo, sáltate este paso.`;

/**
 * Parte 2.5 — el MANIFEST. Idéntica en los cinco: sin este paso el prompt
 * describe un estilo pero no produce nada, porque el render se alimenta del
 * MANIFEST, no del prompt.
 */
export const PARTE_MANIFEST = `Escribe el \`MANIFEST.md\` de la carpeta con la metadata del formato y todos los cues **anclados por keyword del transcript**, nunca por timestamp: así sobreviven al corte de silencios. Usa keywords distintivas de 2-3 palabras — una palabra corta y común engancha dentro de otra y el cue dispara donde no toca.`;

/** Parte 2 — recorte. El nivel semántico es lo único que varía entre estilos. */
export function parteRecorte(nivel: 'conservador' | 'ajustado'): string {
  return `Antes de montar, corta el video: pase semántico con Claude (borra tomas falladas y reformulaciones) + limpieza local de silencios y muletillas. Nivel: \`${nivel}\`.`;
}

type PartesEstilo = {
  /** Qué montar, en una frase. */
  montaje: string;
  /** `conservador` por defecto; `ajustado` cuando el estilo necesita ritmo. */
  nivel: 'conservador' | 'ajustado';
  /** Instrucciones extra: requisitos duros, assets que hay que generar. */
  extras: string[];
};

const PARTES: Record<string, PartesEstilo> = {
  fullscreen: {
    montaje:
      'Móntalo con el formato `fullscreen`: yo a cámara completa 9:16, con el ' +
      'header como gancho de los primeros 8 segundos y los apoyos visuales en ' +
      'los tercios — nunca sobre mi cara.',
    nivel: 'conservador',
    extras: [
      'Este formato usa las cinco secciones del MANIFEST: Header, Gancho visual, Énfasis, Overlays y B-roll. `Header` y `Gancho visual` sólo existen acá — en los demás formatos se ignoran en silencio.',
      'Propón 3 variantes de header y pregúntame cuál antes de renderizar: es el gancho, carga el 80% de la retención.',
    ],
  },
  split: {
    montaje:
      'Móntalo con el formato `split`: lienzo arriba (40%) y mi cara abajo ' +
      '(60%), con subtítulos justo debajo de la costura.',
    nivel: 'ajustado',
    extras: [
      'El panel de arriba se llena con Overlays y B-roll. Si en algún tramo no hay ninguno, ese panel queda pintado del color del tema y NO avisa — revisa que la línea de tiempo del panel esté cubierta de punta a punta.',
      'Dos overlays que coincidan en el tiempo se dibujan uno encima del otro (el panel no tiene tercios donde separarlos): escalona las duraciones.',
    ],
  },
  pip: {
    montaje:
      'Móntalo con el formato `pip`: la grabación de pantalla ocupa el frame y ' +
      'yo voy en un recuadro en la esquina.',
    nivel: 'ajustado',
    extras: [
      'Deja la grabación de pantalla en `CANVAS/` dentro de la carpeta del proyecto. Sin esa carpeta el formato cae a mi cámara a pantalla completa, sin header ni gancho visual.',
      'Elige la esquina con `- **Esquina cámara:**` (`tl`, `tr`, `bl`, `br`). Default `tr`: abajo viven los subtítulos y los overlays.',
      'Ojo: un B-roll de VIDEO ocupa el frame entero y tapa el recuadro de cámara. Si quieres que yo siga visible, usa una imagen.',
    ],
  },
  versus: {
    montaje:
      'Móntalo con el formato `versus`: el cuadro partido en dos mitades que se ' +
      'comparan, con mi cámara en un círculo sobre la costura.',
    nivel: 'conservador',
    extras: [
      'Necesito DOS apoyos visuales, uno por mitad — son el formato entero. Sácalos del guion (el antes y el después, el mito y el dato) y genéralos como imágenes 1080×960 si no los tengo ya.',
      'Declara `- **Etiqueta A:**` y `- **Etiqueta B:**` — las dos o ninguna; con una sola el render usa ANTES/AHORA.',
      'Cada fila de B-roll declara su mitad con la columna extra `Lado` (`a` = arriba, `b` = abajo). Una fila sin `Lado` cae en `a`.',
      'Las cards deben huir de la costura: la de arriba con el contenido arriba, la de abajo con el contenido abajo. En el medio viven mi cámara, el subtítulo y el énfasis. Deja libre también la esquina superior izquierda de cada mitad: ahí va la etiqueta.',
      'Si tus cards son texto denso, apaga los subtítulos con `- **Subtítulos:** off`.',
    ],
  },
  pizarra: {
    montaje:
      'Móntalo con el formato `pizarra`: los trazos a mano se van dibujando ' +
      'detrás de mí al ritmo de lo que digo.',
    nivel: 'conservador',
    extras: [
      'Genera mi recorte sin fondo (local y gratis, sin pantalla verde): `npx hyperframes remove-background "<carpeta>/_source_cut.mov" -o "<carpeta>/cutout.webm" --quality balanced`.',
      'El lienzo de trazos lo produce la skill `pizarra-explicativa-f100k` sobre este mismo video. Déjalo en la carpeta con `lienzo` en el nombre. Pídelo en `.webm` si puedes: el alfa de un `.mov` HEVC no lo lee Chrome y hay que convertirlo.',
      'Los dos se descubren solos por nombre; al MANIFEST le alcanza con `- **Formato:** pizarra`.',
      'Diseña los trazos en los primeros ~700 px de alto: de ahí para abajo los tapo yo.',
      'Este formato no admite B-roll — el lienzo ya es el apoyo visual.',
    ],
  },
};

export const ESTILOS: EstiloDef[] = [
  {
    id: 'fullscreen',
    nombre: 'Pantalla completa',
    descripcion:
      'Tú a cámara completa, con el gancho arriba y los apoyos visuales en los tercios.',
    cuandoUsar: [
      'lo que dices se sostiene solo y la cara es el argumento',
      'quieres el gancho de texto grande de los primeros 8 segundos',
      'tienes apoyos sueltos que acompañan, no que explican',
    ],
    resuelvePor: 'formato',
    referencia: 'fullscreen',
    requiere: [],
    demo: 'estilos/fullscreen.mp4',
  },
  {
    id: 'split',
    nombre: 'Pantalla dividida',
    descripcion: 'Un lienzo arriba y tú abajo: se ve lo que cuentas mientras lo cuentas.',
    cuandoUsar: [
      'cada cosa que dices tiene una imagen que la prueba',
      'quieres que se lea el dato sin quitarte a ti del cuadro',
      'el guion va por pasos y cada paso tiene su apoyo',
    ],
    resuelvePor: 'formato',
    referencia: 'split',
    requiere: ['al menos un overlay o B-roll por tramo'],
    demo: 'estilos/split.mp4',
  },
  {
    id: 'pip',
    nombre: 'Pantalla + tú',
    descripcion: 'La grabación de pantalla manda y tú comentas desde un recuadro.',
    cuandoUsar: [
      'estás mostrando una herramienta, una app o un proceso en pantalla',
      'lo importante es lo que pasa en la pantalla, no tu cara',
      'es un tutorial y hay que seguir los clics',
    ],
    resuelvePor: 'formato',
    referencia: 'pip',
    requiere: ['CANVAS/'],
    demo: 'estilos/pip.mp4',
  },
  {
    id: 'versus',
    nombre: 'Versus',
    descripcion:
      'El cuadro partido en dos: arriba una cosa, abajo la otra, y tú en la costura.',
    cuandoUsar: [
      'el guion contrapone dos cosas: antes/ahora, mito/realidad, error/acierto',
      'hay dos imágenes o clips que se entienden mejor juntos que separados',
      'quieres que se vea la diferencia, no explicarla',
    ],
    resuelvePor: 'formato',
    referencia: 'versus',
    requiere: ['dos apoyos visuales, uno por lado'],
    demo: 'estilos/versus.mp4',
  },
  {
    id: 'pizarra',
    nombre: 'Pizarra',
    descripcion: 'Una pizarra que se va dibujando sola detrás de ti al ritmo de lo que dices.',
    cuandoUsar: [
      'estás explicando algo que se entiende mejor dibujado que dicho',
      'el guion conecta ideas: esto lleva a esto, y esto a esto otro',
      'grabaste contra una pared lisa y con buena luz',
    ],
    resuelvePor: 'formato',
    referencia: 'pizarra',
    requiere: ['cutout sin fondo', 'lienzo de trazos con alfa'],
    demo: 'estilos/pizarra.mp4',
  },
];

export function getEstilo(id: string): EstiloDef | undefined {
  return ESTILOS.find((e) => e.id === id);
}

/**
 * Compone el prompt que la alumna copia de la vitrina y pega en Claude Code.
 *
 * Tres partes, siempre en el mismo orden: instalación → recorte → estilo.
 * Las dos primeras son constantes compartidas; la tercera es lo único que
 * cambia entre estilos.
 *
 * El prompt es el producto. Si no llega al mp4 sin ayuda humana, está mal el
 * prompt, no la alumna.
 */
export function construirPrompt(id: string): string {
  const estilo = getEstilo(id);
  if (!estilo) {
    throw new Error(
      `No existe el estilo "${id}". Los de la v1 son: ` +
        ESTILOS.map((e) => e.id).join(', '),
    );
  }
  const partes = PARTES[id];
  if (!partes) {
    throw new Error(`El estilo "${id}" está en ESTILOS pero no tiene texto de prompt.`);
  }

  const cuerpo = [
    PARTE_INSTALACION,
    parteRecorte(partes.nivel),
    partes.montaje,
    PARTE_MANIFEST,
    ...partes.extras,
    'Renderiza y déjame el `BORRADOR_AUTO.mp4` en la misma carpeta. Si algo sale con un `[warn]`, dímelo en vez de dármelo por bueno.',
  ];

  return [
    `Edita con la skill \`editor-video-formula100k\` el video sin editar que está en esta carpeta, con el estilo **${estilo.nombre}** (\`${estilo.referencia}\`). Si hay más de un video, pregúntame cuál antes de empezar.`,
    '',
    ...cuerpo.map((paso, i) => `${i + 1}. ${paso}`),
  ].join('\n');
}
