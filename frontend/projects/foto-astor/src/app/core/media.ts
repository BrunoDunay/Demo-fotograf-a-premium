import { CUTOUTS, CutoutData, PHOTOS, PhotoData, VIDEOS, VideoData } from './media.data';

export type { PhotoData, VideoData, CutoutData };

const byName = new Map(PHOTOS.map((p) => [p.name, p]));

/** Foto por nombre (lanza si no existe, para detectar errores al compilar el prerender). */
export function photo(name: string): PhotoData {
  const p = byName.get(name);
  if (!p) throw new Error(`Foto desconocida: ${name}`);
  return p;
}

export const photoSrc = (p: PhotoData | string, small = false) =>
  `/media/fotos/${typeof p === 'string' ? p : p.name}${small ? '-sm' : ''}.webp`;

export const photoSrcset = (p: PhotoData) => `${photoSrc(p, true)} 720w, ${photoSrc(p)} ${p.w}w`;

/** Fotos de eventos (sin las del estudio). */
export const EVENT_PHOTOS = PHOTOS.filter((p) => p.cat !== 'estudio');
export const photosOf = (cat: PhotoData['cat']) => PHOTOS.filter((p) => p.cat === cat);

export const isPortrait = (p: PhotoData) => p.h > p.w * 1.05;

const videoByName = new Map(VIDEOS.map((v) => [v.name, v]));
export const video = (name: string) => videoByName.get(name)!;
export const ALL_VIDEOS = VIDEOS;
export const videoSrc = (v: VideoData, small = false) => `/media/videos/${v.name}${small ? '-sm' : ''}.mp4`;
export const videoPoster = (v: VideoData) => `/media/videos/${v.name}.jpg`;

const cutByName = new Map(CUTOUTS.map((c) => [c.name, c]));
export const cutout = (name: string) => cutByName.get(name)!;
export const cutoutSrc = (name: string) => `/media/recortes/${name}.webp`;
export const SILHOUETTES = CUTOUTS.filter((c) => c.name.startsWith('sil-') && c.name !== 'sil-vestido-blanco');

/** Baraja (Fisher–Yates) con semilla opcional para resultados repetibles en el prerender. */
export function shuffle<T>(list: readonly T[], seed?: number): T[] {
  const out = list.slice();
  let s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor((seed === undefined ? Math.random() : rnd()) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Generador pseudoaleatorio con semilla (para decorados que deben salir igual en servidor y navegador). */
export function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
