// Prepara las fotos y videos de Astor (demo Premium de fotografía de bodas y eventos sociales).
// Uso: node scripts/media.mjs [fotos|videos|recortes]
// - Fotos y videos de Pexels (licencia libre, sin atribución obligatoria). Se guardan en scripts/.cache/.
// - Fotos: WebP normal (1600 px) y -sm (720 px) en public/media/fotos/.
// - Videos: MP4 recortado 4:3 para el rollo (-sm) y MP4 de 960 px para el visor, con póster, en public/media/videos/.
// - Recortes (PNG con fondo transparente en scripts/recortes/): cámara colgante, lente, dron y siluetas
//   de la galería. Las siluetas se rellenan de negro para que se vean como personas a contraluz.
// - Escribe src/app/core/media.data.ts con medidas y textos para el código.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.resolve(import.meta.dirname, '..');
const APP = path.join(ROOT, 'projects/foto-astor');
const CACHE = path.join(ROOT, 'scripts/.cache');
const CUTS = path.join(ROOT, 'scripts/recortes');
const OUT_PHOTOS = path.join(APP, 'public/media/fotos');
const OUT_VIDEOS = path.join(APP, 'public/media/videos');
const OUT_CUTS = path.join(APP, 'public/media/recortes');
for (const d of [CACHE, OUT_PHOTOS, OUT_VIDEOS, OUT_CUTS]) fs.mkdirSync(d, { recursive: true });

// cat: boda | xv | social | estudio. alt en español (también se usa como pie de foto).
const PHOTOS = [
  // Bodas
  ['silueta-beso', 31806632, 'boda', 'Silueta de los novios a punto de besarse'],
  ['beso-luces', 10152724, 'boda', 'Novios besándose a contraluz frente a un arco de luces'],
  ['ventanal-bn', 30375728, 'boda', 'Novios junto a un ventanal, en blanco y negro'],
  ['mirada-bn', 27060159, 'boda', 'Novia recargada en el hombro del novio, en blanco y negro'],
  ['ramo-bn', 13525831, 'boda', 'Novio sosteniendo el ramo de peonías, en blanco y negro'],
  ['anillo-bn', 27499470, 'boda', 'Mano de la novia con el anillo, en blanco y negro'],
  ['escalinata-bn', 8693636, 'boda', 'Novios bajando una escalinata, en blanco y negro'],
  ['circulo-velas', 2496348, 'boda', 'Novios abrazados dentro de un círculo de velas junto al lago'],
  ['ramo-ventana', 36380148, 'boda', 'Silueta de la novia oliendo su ramo junto a la ventana'],
  ['novia-ventanal', 15681056, 'boda', 'Novia de espaldas frente a un ventanal'],
  ['zapatillas-bn', 37828085, 'boda', 'Zapatillas de la novia con luz dura, en blanco y negro'],
  ['novia-cortina', 35583429, 'boda', 'Novia en silueta junto a las cortinas'],
  ['novia-niebla', 18678216, 'boda', 'Novia caminando entre la niebla en un pastizal'],
  ['estanque', 20092017, 'boda', 'Novios abrazados junto a un estanque con neblina'],
  ['chispas-frias', 15865306, 'boda', 'Primer baile entre chispas frías'],
  ['bengalas-ramo', 20519799, 'boda', 'Novios entre bengalas con el ramo'],
  ['fuente-fuego', 11984593, 'boda', 'Novia levantando dos fuentes de chispas en la noche'],
  ['pasillo-bengalas', 13434421, 'boda', 'Beso de los novios en un pasillo de bengalas'],
  ['salida-bengalas', 13110256, 'boda', 'Salida de los novios entre invitados con bengalas'],
  ['novia-chispas', 15549004, 'boda', 'Novia de espaldas entre chispas'],
  ['beso-bengalas', 13617313, 'boda', 'Beso entre bengalas y vestidos de colores'],
  ['fuegos-artificiales', 3397027, 'boda', 'Fuegos artificiales rojos sobre los novios'],
  ['arco-bengalas', 38566294, 'boda', 'Beso bajo un arco de bengalas'],
  ['baile-bn', 38652167, 'boda', 'Novios girando en la pista, en blanco y negro'],
  ['pista-azul', 12417635, 'boda', 'Novia bailando con sus invitados bajo luz azul'],
  ['giro-luces', 38551352, 'boda', 'Novia girando con estelas de luz'],
  ['pista-novia', 28588868, 'boda', 'Novia en el piso de la pista entre risas'],
  ['primer-baile', 28123410, 'boda', 'Primer baile en una pista iluminada con flores'],
  ['pista-bn', 40436483, 'boda', 'Novios bailando rodeados de invitados, en blanco y negro'],
  ['novio-en-hombros', 30146380, 'boda', 'Invitados cargando al novio en la pista'],
  ['charros-caballo', 19284113, 'boda', 'Novia en caballo blanco junto al novio de charro'],
  ['charro-frente', 34926934, 'boda', 'Novio de charro y novia frente a frente'],
  ['hacienda-sombrero', 34926937, 'boda', 'Novios lanzando el sombrero frente al portón de la hacienda'],
  ['charro-mirada', 34926943, 'boda', 'Novia mirando al novio de charro'],
  ['columnas-cantera', 34926932, 'boda', 'Novios entre columnas de cantera'],
  ['empedrado', 34926935, 'boda', 'Novios caminando por el empedrado de la hacienda'],
  ['velo-noche', 20721475, 'boda', 'Velo al viento en la noche, con el novio de sombrero'],
  ['patio-luces', 36200504, 'boda', 'Novios bailando en un patio con luces'],
  ['arcos-hacienda', 12031113, 'boda', 'Novia bajo los arcos de una casona'],
  ['patio-colonial', 36866117, 'boda', 'Novia en el pasillo de un patio colonial'],
  ['vals-salon', 34152939, 'boda', 'Vals de los novios en el salón'],
  ['altar-dorado', 32142652, 'boda', 'Novios frente al altar dorado'],
  ['pasillo-iglesia', 10279235, 'boda', 'Pasillo de la iglesia con alfombra roja'],
  ['iglesia-bn', 10541675, 'boda', 'Ceremonia en la iglesia, en blanco y negro'],
  ['burbujas', 31562256, 'boda', 'Beso de los novios entre burbujas'],
  ['abuelo-bn', 12272137, 'boda', 'El abuelo felicita a la novia, en blanco y negro'],
  ['corse', 28919269, 'boda', 'Amarrando el corsé del vestido'],
  ['maquillaje', 37710473, 'boda', 'La novia en el maquillaje'],
  ['silueta-velo', 18844527, 'boda', 'Silueta de la novia acomodando el velo'],
  ['velo-bn', 35536264, 'boda', 'Novia bajo el velo, en blanco y negro'],
  ['velo-cubre-bn', 38849776, 'boda', 'Novia cubierta por el velo, en blanco y negro'],
  ['encaje-bn', 40450823, 'boda', 'Vestido y velo de encaje, en blanco y negro'],
  ['velo-perlas', 33466163, 'boda', 'Detalle de la novia con velo y perlas'],
  ['velo-mirada', 39904287, 'boda', 'Novia mirando a través del velo'],
  ['arete', 39904286, 'boda', 'Novia poniéndose el arete detrás del velo'],
  ['novia-salon', 36637251, 'boda', 'Novia en un salón con luz de ventanales'],
  ['monio', 35505716, 'boda', 'Novio acomodándose el moño'],
  ['novio-bn', 18247644, 'boda', 'Novio sonriendo en un sillón, en blanco y negro'],
  ['confeti-beso-bn', 20311458, 'boda', 'Beso con confeti, en blanco y negro'],
  ['confeti-noche', 34353736, 'boda', 'Lluvia de confeti en la noche, en blanco y negro'],
  ['confeti-risa', 31263156, 'boda', 'Novios riendo bajo el confeti'],
  ['confeti-cielo', 37341691, 'boda', 'Confeti al cielo sobre los novios'],
  ['atardecer-campo', 30335822, 'boda', 'Novios en el campo al atardecer'],
  ['sol-entre', 38758010, 'boda', 'El sol entre los novios'],
  ['silueta-atardecer', 17886021, 'boda', 'Silueta de los novios frente a frente al atardecer'],
  ['anillos', 18706408, 'boda', 'Intercambio de anillos'],
  ['ramo-rosas-bn', 33448864, 'boda', 'Ramo de rosas y peonías, en blanco y negro'],
  ['detalles', 39183510, 'boda', 'Ramo, zapatillas y anillos de la novia'],
  // XV años
  ['xv-esmeralda', 35047203, 'xv', 'Quinceañera con vestido esmeralda y tiara'],
  ['xv-lila', 17931321, 'xv', 'Quinceañera con vestido lila entre flores'],
  ['xv-amigas', 15591486, 'xv', 'Quinceañera riendo con sus amigas'],
  ['xv-noche-azul', 8467349, 'xv', 'Quinceañera de azul en la noche'],
  ['xv-vals', 17931407, 'xv', 'Vals de la quinceañera en el salón'],
  ['xv-turquesa', 16999946, 'xv', 'Quinceañera de turquesa en el salón'],
  ['xv-misa', 36629706, 'xv', 'Misa de XV años'],
  ['xv-corona', 17731609, 'xv', 'Quinceañera acomodándose la corona en el jardín'],
  ['xv-jardin', 16420023, 'xv', 'Quinceañera en un jardín de flores colgantes'],
  ['xv-salon-rosa', 8466257, 'xv', 'Quinceañera en el salón decorado'],
  ['xv-retrato', 39450622, 'xv', 'Retrato de quinceañera con su ramo'],
  ['xv-rojo', 34720698, 'xv', 'Quinceañera de rojo en el jardín'],
  ['xv-falda-roja', 31303437, 'xv', 'Quinceañera con la falda roja extendida'],
  ['xv-iglesia', 34206524, 'xv', 'Quinceañera de espaldas en la iglesia'],
  ['xv-arboles', 34982744, 'xv', 'Quinceañera de rosa entre árboles'],
  ['xv-falda-rosa', 34421926, 'xv', 'Quinceañera sentada con la falda rosa extendida'],
  ['xv-verde', 39967129, 'xv', 'Quinceañera de verde en estudio'],
  ['xv-papa', 17931369, 'xv', 'Vals de la quinceañera con su papá'],
  ['xv-chambelanes', 18265902, 'xv', 'Quinceañera bailando con sus chambelanes'],
  ['xv-dorado', 38400866, 'xv', 'Quinceañera de dorado en un patio'],
  ['xv-bn', 16636598, 'xv', 'Quinceañera en la fiesta, en blanco y negro'],
  // Eventos sociales
  ['bautizo', 35663279, 'social', 'Bautizo en la parroquia'],
  ['brindis-bengalas', 6405778, 'social', 'Brindis con bengalas'],
  ['brindis-globos', 19095111, 'social', 'Brindis entre globos y confeti'],
  ['brindis-confeti', 3171837, 'social', 'Brindis con confeti dorado'],
  ['graduacion', 7944234, 'social', 'Graduados lanzando confeti'],
  ['graduacion-flores', 30079720, 'social', 'Graduadas con diplomas y flores'],
  ['comunion', 35761560, 'social', 'Primera comunión frente al altar'],
  ['comunion-rosario', 5824134, 'social', 'Manos con rosario en la primera comunión'],
  ['comunion-guantes', 14354566, 'social', 'Guantes de encaje y rosario'],
  ['brindis-disco', 59884, 'social', 'Brindis bajo esferas de espejo'],
  // Estudio (Emilio, detrás de cámara)
  ['emilio', 27786109, 'estudio', 'Emilio Astor con su cámara'],
  ['emilio-lente', 7702471, 'estudio', 'Mirando a través del lente, en blanco y negro'],
  ['emilio-camara', 19871898, 'estudio', 'Tomando una foto con luz de ventana'],
  ['emilio-equipo', 16025062, 'estudio', 'Preparando la cámara antes de una sesión'],
];

// ss: segundo donde empieza el corte; t: duración; y: posición vertical del recorte 4:3 (0 arriba, 1 abajo).
const VIDEOS = [
  { name: 'fiesta', id: 19366395, ss: 2, alt: 'La novia baila con sus invitados' },
  { name: 'salida-iglesia', id: 30005349, ss: 1, alt: 'Los novios salen de la iglesia entre pétalos' },
  { name: 'luces-jardin', id: 32009248, ss: 2, alt: 'Baile bajo series de luces en el jardín' },
  { name: 'pista-flores', id: 31898707, ss: 2, y: 0.55, alt: 'Primer baile con humo bajo flores colgantes' },
  { name: 'vals', id: 26761228, ss: 2, y: 0.4, alt: 'Vals de los novios en el salón' },
  { name: 'novia-baila', id: 36569510, ss: 1, y: 0.3, alt: 'La novia baila con el novio' },
  { name: 'bengalas', id: 6396219, ss: 1, alt: 'Invitados encendiendo bengalas' },
  { name: 'fuente-chispas', id: 4194080, ss: 1, y: 0.6, alt: 'Fuente de chispas en cámara lenta' },
  { name: 'xv-jardin', id: 19156608, ss: 1, alt: 'Quinceañera de rojo en el jardín' },
  { name: 'xv-camina', id: 19052132, ss: 1, alt: 'Quinceañera caminando con su vestido rojo' },
  { name: 'xv-columpio', id: 19098378, ss: 1, alt: 'Quinceañera en un columpio entre plantas' },
  { name: 'ceremonia', id: 38614800, ss: 2, alt: 'Ceremonia al aire libre con invitados' },
  { name: 'ramo-pasto', id: 32320878, ss: 1, alt: 'Los novios bailan alrededor del ramo' },
  { name: 'atardecer', id: 31252870, ss: 1, y: 0.55, alt: 'Baile al atardecer bajo un árbol' },
  { name: 'brindis', id: 39323987, ss: 1, y: 0.4, alt: 'Brindis con copas de champaña' },
  { name: 'ramo', id: 30081239, ss: 1, alt: 'Ramo de rosas blancas' },
  { name: 'velo', id: 36972697, ss: 1, y: 0.25, alt: 'Novia con velo a contraluz' },
];

// Recortes: archivo PNG en scripts/recortes/ → nombre publicado. silhouette: rellena de negro.
const CUTOUTS = [
  { file: '12597611.png', name: 'camara-colgante', w: 900 },
  { file: '34956920.png', name: 'lente', w: 700 },
  { file: '6145874.png', name: 'dron', w: 900 },
  { file: '14654924.png', name: 'sil-abrigo', silhouette: true },
  { file: '4400019.png', name: 'sil-senor', silhouette: true },
  { file: '21302344.png', name: 'sil-pensando', silhouette: true },
  { file: '17781140.png', name: 'sil-mujer-espalda', silhouette: true },
  { file: '5408709.png', name: 'sil-sombrero', silhouette: true },
  { file: '9623646.png', name: 'sil-camina', silhouette: true },
  { file: '6100180.png', name: 'sil-vestido', silhouette: true },
  { file: '40160382.png', name: 'sil-vestido-blanco', silhouette: true },
  { file: '6668809.png', name: 'sil-joven', silhouette: true },
  { file: '5322514.png', name: 'sil-mochila', silhouette: true },
  { file: '27593714.png', name: 'sil-traje', silhouette: true },
  { file: '31894858.png', name: 'sil-mujer', silhouette: true },
];

async function pexelsPhoto(id) {
  const file = path.join(CACHE, `pexels-${id}.jpg`);
  if (!fs.existsSync(file)) {
    const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`No se pudo bajar ${id}: ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}

async function processPhoto([name, id, cat, alt]) {
  const src = await pexelsPhoto(id);
  const base = await sharp(src).rotate().toBuffer();
  const meta = await sharp(base).metadata();
  const w = Math.min(1600, meta.width);
  const out = path.join(OUT_PHOTOS, `${name}.webp`);
  if (!fs.existsSync(out)) {
    await sharp(base).resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(out);
    await sharp(base).resize({ width: Math.min(720, meta.width) }).webp({ quality: 72, effort: 5 }).toFile(path.join(OUT_PHOTOS, `${name}-sm.webp`));
  }
  // Color promedio: fondo mientras carga la foto.
  const { dominant } = await sharp(base).resize(32).stats();
  const tone = `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return { name, cat, alt, w, h: Math.round((meta.height * w) / meta.width), tone };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

async function videoUrl(id, tries = 3) {
  try {
    const res = await fetch(`https://www.pexels.com/download/video/${id}/`, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const url = res.headers.get('location');
    if (!url) throw new Error(`Sin enlace para el video ${id}`);
    return url;
  } catch (err) {
    if (tries <= 1) throw err;
    await new Promise((r) => setTimeout(r, 1500));
    return videoUrl(id, tries - 1);
  }
}

async function processVideo(v) {
  const sm = path.join(OUT_VIDEOS, `${v.name}-sm.mp4`);
  const full = path.join(OUT_VIDEOS, `${v.name}.mp4`);
  const poster = path.join(OUT_VIDEOS, `${v.name}.jpg`);
  if (!fs.existsSync(sm) || !fs.existsSync(full)) {
    const url = await videoUrl(v.id);
    const cut = ['-ss', String(v.ss ?? 1), '-t', String(v.t ?? 6)];
    const y = v.y ?? 0.5;
    // Recorte 4:3 centrado (en verticales se elige la altura con "y").
    const crop = `crop='min(iw,ih*4/3)':'min(ih,iw*3/4)':'(iw-min(iw,ih*4/3))/2':'(ih-min(ih,iw*3/4))*${y}'`;
    execFileSync(ffmpeg, ['-y', '-v', 'error', ...cut, '-i', url, '-an', '-vf', `${crop},scale=400:300,fps=24`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', sm]);
    execFileSync(ffmpeg, ['-y', '-v', 'error', ...cut, '-i', url, '-an', '-vf', "scale='if(gt(iw,ih),960,-2)':'if(gt(iw,ih),-2,960)',fps=25", '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', full]);
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', sm, '-frames:v', '1', '-q:v', '5', poster]);
  }
  const probe = await sharp(poster).metadata();
  const kb = Math.round(fs.statSync(sm).size / 1024);
  return { name: v.name, alt: v.alt, kb, w: probe.width, h: probe.height };
}

async function processCutout(c) {
  const src = path.join(CUTS, c.file);
  if (!fs.existsSync(src)) {
    console.warn(`Falta el recorte ${c.file}`);
    return null;
  }
  let img = sharp(src).trim({ threshold: 1 });
  const out = path.join(OUT_CUTS, `${c.name}.webp`);
  if (c.silhouette) {
    // Persona a contraluz: se conserva solo la forma (canal alfa) sobre un negro casi puro.
    const trimmed = await img.toBuffer();
    const meta = await sharp(trimmed).metadata();
    const h = Math.min(900, meta.height);
    const alpha = await sharp(trimmed).resize({ height: h }).extractChannel('alpha').toBuffer();
    const m2 = await sharp(alpha).metadata();
    await sharp({ create: { width: m2.width, height: m2.height, channels: 3, background: '#060606' } })
      .joinChannel(alpha)
      .webp({ quality: 90, alphaQuality: 90 })
      .toFile(out);
    return { name: c.name, w: m2.width, h: m2.height };
  }
  const buf = await img.resize({ width: c.w ?? 900, withoutEnlargement: true }).toBuffer();
  await sharp(buf).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
  const meta = await sharp(buf).metadata();
  return { name: c.name, w: meta.width, h: meta.height };
}

const only = process.argv[2];
const dataFile = path.join(APP, 'src/app/core/media.data.ts');
const prev = fs.existsSync(path.join(CACHE, 'media.json')) ? JSON.parse(fs.readFileSync(path.join(CACHE, 'media.json'), 'utf8')) : {};
const data = { photos: prev.photos ?? [], videos: prev.videos ?? [], cutouts: prev.cutouts ?? [] };

if (!only || only === 'fotos') {
  data.photos = await pool(PHOTOS, 6, processPhoto);
  console.log(`fotos: ${data.photos.length}`);
}
if (!only || only === 'videos') {
  data.videos = await pool(VIDEOS, 3, processVideo);
  console.log(`videos: ${data.videos.length} (${data.videos.reduce((a, v) => a + v.kb, 0)} KB en el rollo)`);
}
if (!only || only === 'recortes') {
  data.cutouts = (await Promise.all(CUTOUTS.map(processCutout))).filter(Boolean);
  console.log(`recortes: ${data.cutouts.length}`);
}

fs.writeFileSync(path.join(CACHE, 'media.json'), JSON.stringify(data));
const ts = `// Generado por scripts/media.mjs. No editar a mano.
export interface PhotoData { name: string; cat: 'boda' | 'xv' | 'social' | 'estudio'; alt: string; w: number; h: number; tone: string }
export interface VideoData { name: string; alt: string; kb: number; w: number; h: number }
export interface CutoutData { name: string; w: number; h: number }

export const PHOTOS: PhotoData[] = ${JSON.stringify(data.photos, null, 1)};

export const VIDEOS: VideoData[] = ${JSON.stringify(data.videos, null, 1)};

export const CUTOUTS: CutoutData[] = ${JSON.stringify(data.cutouts, null, 1)};
`;
fs.mkdirSync(path.dirname(dataFile), { recursive: true });
fs.writeFileSync(dataFile, ts);
console.log('listo:', path.relative(ROOT, dataFile));
