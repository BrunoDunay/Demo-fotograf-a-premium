import { Slide } from './slides';

// Programación de cada pantalla: qué diapositivas pasa, con qué transiciones y cada cuántos segundos.
// Modos de transición (shader): 0 barrido difuso · 1 deslizamiento · 2 vidrio estriado · 3 iris suave
// · 4 acercamiento con desenfoque · 5 apertura al centro · 6 cortina · 7 fundido por luminosidad.
export const T = { wipe: 0, push: 1, ribs: 2, iris: 3, dissolve: 4, split: 5, blinds: 6, fade: 7 } as const;

export interface Program {
  slides: Slide[];
  transitions: number[];
  /** Segundos que se queda cada diapositiva. */
  hold: number;
  /** Fotos ligeras (720 px) para pantallas chicas. */
  small?: boolean;
}

const full = (p: string, label?: string): Slide => ({ kind: 'full', photos: [p], kb: true, label });
const framed = (p: string, label: string, title?: string, bg: 'night' | 'paper' = 'night'): Slide => ({ kind: 'framed', photos: [p], label, title, bg });

export const WELCOME: Program = {
  hold: 7,
  transitions: [T.wipe, T.ribs, T.push, T.iris, T.split, T.blinds, T.wipe],
  slides: [
    { kind: 'logo', photos: [], label: 'Exposición permanente · Bodas, XV años y eventos sociales', text: 'Aguascalientes, 2017 – 2026' },
    {
      kind: 'split',
      side: 'left',
      panel: 0.36,
      photos: ['hacienda-sombrero'],
      kicker: 'Sala I · Bienvenida',
      title: 'Noches que brillan una sola vez',
      text: 'Bodas, XV años y celebraciones fotografiadas por Emilio Astor en haciendas, viñedos y salones de Aguascalientes.',
    },
    full('velo-noche', 'Boda · Noche de viento, 2024'),
    { kind: 'number', big: '312', label: 'bodas desde 2017', text: 'Y más de 140 XV años, bautizos, comuniones y graduaciones. Una fecha por día, para llegar con calma.', photos: ['charros-caballo'] },
    full('confeti-cielo', 'Salida de los novios'),
    { kind: 'logo', photos: [], label: 'Fotografía de bodas y eventos sociales', text: 'astorfoto.mx · @astor.foto' },
    { kind: 'grid', photos: ['maquillaje', 'altar-dorado', 'chispas-frias'], title: 'De la primera luz a la última canción', text: 'Preparativos, ceremonia, retratos y fiesta, cada parte con su ritmo.' },
    full('pista-novia', 'La pista, 01:40 a. m.'),
  ],
};

export const TOTEMS: Program[] = [
  { hold: 6, small: true, transitions: [T.fade, T.wipe, T.dissolve, T.blinds], slides: [full('chispas-frias'), framed('novia-niebla', 'N.º 014 · Preboda', 'Entre la niebla'), full('silueta-beso'), full('xv-esmeralda'), full('ramo-ventana')] },
  { hold: 6, small: true, transitions: [T.wipe, T.fade, T.blinds, T.dissolve], slides: [full('charro-frente'), full('velo-mirada'), framed('bengalas-ramo', 'N.º 027 · Boda', 'Bengalas', 'paper'), full('xv-turquesa'), full('novia-cortina')] },
  { hold: 6, small: true, transitions: [T.dissolve, T.wipe, T.fade, T.blinds], slides: [full('xv-iglesia'), full('fuente-fuego'), framed('mirada-bn', 'N.º 033 · Retrato', 'Recargada'), { kind: 'logo', photos: [], label: 'Exposición permanente', text: 'Aguascalientes' }, full('novia-chispas'), full('patio-colonial')] },
  { hold: 6, small: true, transitions: [T.blinds, T.fade, T.wipe, T.dissolve], slides: [full('arco-bengalas'), full('xv-corona'), full('beso-luces'), framed('encaje-bn', 'N.º 041 · Detalle', 'Encaje', 'paper'), full('altar-dorado')] },
  { hold: 6, small: true, transitions: [T.fade, T.dissolve, T.wipe, T.blinds], slides: [full('giro-luces'), full('ventanal-bn'), full('xv-jardin'), framed('sol-entre', 'N.º 052 · Preboda', 'El sol entre los dos'), full('burbujas')] },
];

/** La caja: cada programa ocupa dos caras contiguas (el contenido da la vuelta a la esquina). */
export const CUBE_FRONT: Program = {
  hold: 6.5,
  transitions: [T.push, T.push, T.ribs, T.push, T.wipe],
  slides: [
    { kind: 'split', side: 'left', panel: 0.5, photos: ['empedrado'], kicker: 'Sala III · La caja', title: 'Una historia que da la vuelta', text: 'Camina alrededor: cada cara cuenta una parte de la boda charra de Andrés y Fer.' },
    { ...full('columnas-cantera', 'Hacienda Los Arcos'), kb: true },
    { kind: 'cells', cells: 2, photos: ['charro-mirada', 'charros-caballo'], label: 'Boda charra · 2025' },
    { kind: 'number', big: '9', label: 'años en Aguascalientes', text: 'Haciendas, viñedos, jardines y templos del centro. Conozco la luz de cada lugar.', photos: ['arcos-hacienda'] },
    full('vals-salon', 'El vals'),
  ],
};

export const CUBE_BACK: Program = {
  hold: 6.5,
  transitions: [T.push, T.wipe, T.push, T.split],
  slides: [
    { kind: 'split', side: 'right', panel: 0.5, photos: ['xv-falda-rosa'], kicker: 'XV años', title: 'Su noche, de principio a fin', text: 'Sesión previa, misa, vals, chambelanes y fiesta.' },
    { kind: 'cells', cells: 2, photos: ['xv-papa', 'xv-vals'], label: 'El vals' },
    { kind: 'logo', photos: [], label: 'Sala III · La caja', text: 'Una historia que da la vuelta' },
    full('xv-noche-azul', 'Sesión previa'),
    { kind: 'cells', cells: 2, photos: ['xv-amigas', 'xv-misa'], label: 'Amigas y misa' },
  ],
};

/** Tres pantallas en la pared: una historia en tres tiempos. */
export const TRIPTYCH: Program = {
  hold: 7,
  small: true,
  transitions: [T.blinds, T.wipe, T.dissolve, T.split, T.push],
  slides: [
    { kind: 'cells', cells: 3, photos: ['monio', 'velo-perlas', 'escalinata-bn'], label: 'I · Antes' },
    { kind: 'cells', cells: 3, photos: ['iglesia-bn', 'anillos', 'abuelo-bn'], label: 'II · Ceremonia' },
    { kind: 'cells', cells: 3, photos: ['primer-baile', 'novio-en-hombros', 'pista-azul'], label: 'III · Fiesta' },
    { kind: 'cells', cells: 3, photos: ['xv-misa', 'xv-papa', 'xv-bn'], label: 'XV años' },
    { kind: 'cells', cells: 3, photos: ['bautizo', 'graduacion', 'brindis-confeti'], label: 'Celebraciones' },
  ],
};

/** Cinco pantallas cuadradas en el piso: detalles. */
export const SQUARES: Program = {
  hold: 5,
  small: true,
  transitions: [T.dissolve, T.fade, T.dissolve, T.blinds],
  slides: [
    { kind: 'cells', cells: 5, photos: ['anillo-bn', 'zapatillas-bn', 'velo-perlas', 'comunion-guantes', 'ramo-rosas-bn'] },
    { kind: 'cells', cells: 5, photos: ['arete', 'comunion-rosario', 'encaje-bn', 'detalles', 'monio'] },
    { kind: 'cells', cells: 5, photos: ['velo-bn', 'anillos', 'corse', 'velo-cubre-bn', 'zapatillas-bn'] },
  ],
};

/** Pantalla curva del final: panoramas, una cita y la invitación. */
export const PANORAMA: Program = {
  hold: 8,
  transitions: [T.wipe, T.ribs, T.iris, T.push, T.split, T.fade],
  slides: [
    { kind: 'strip', kicker: 'Sala V · Panorama', title: 'XV años', photos: ['xv-retrato', 'xv-rojo', 'xv-dorado', 'xv-verde', 'xv-lila'] },
    full('pasillo-bengalas', 'Salida entre bengalas'),
    { kind: 'logo', photos: [], label: 'Gracias por recorrer la exposición', text: 'Noches que brillan una sola vez' },
    { kind: 'quote', bg: 'night', photos: [], text: 'La foto del primer baile entre chispas es la que todos nos piden. Valió cada peso.', label: 'Valeria Campos · Boda en Jardín El Mezquite' },
    { kind: 'strip', kicker: 'Sala V · Panorama', title: 'Celebra- ciones', photos: ['comunion', 'graduacion-flores', 'brindis-globos', 'brindis-disco', 'bautizo'] },
    full('atardecer-campo', 'Preboda al atardecer'),
    { kind: 'cta', photos: [], kicker: 'Tu historia', title: 'podría ser la siguiente', label: 'Aparta tu fecha · astorfoto.mx' },
  ],
};

/** Todas las fotos de un programa (el visor permite pasar entre ellas). */
export function programPhotos(p: Program): string[] {
  return [...new Set(p.slides.flatMap((s) => s.photos))];
}
