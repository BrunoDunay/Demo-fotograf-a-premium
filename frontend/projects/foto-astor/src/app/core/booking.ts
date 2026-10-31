import { Injectable, signal } from '@angular/core';

/** Lo que el visitante ya eligió en otras secciones (fecha del calendario, paquete) para llenar el formulario. */
@Injectable({ providedIn: 'root' })
export class Booking {
  readonly date = signal<string | null>(null);
  readonly packageName = signal<string | null>(null);
  readonly eventType = signal<string | null>(null);
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const monthName = (m: number) => MONTHS[m];

/** "sábado 14 de noviembre de 2026" a partir de "2026-11-14". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]} ${d} de ${MONTHS[m - 1]} de ${y}`;
}

export const isoDate = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * Disponibilidad ficticia pero creíble (sin backend): los sábados de temporada alta casi siempre están
 * apartados, los viernes a medias y entre semana casi todo libre. La misma fecha siempre da el mismo resultado.
 */
export type DayStatus = 'libre' | 'ultima' | 'apartada' | 'pasada';

/** Hoy a medianoche (la disponibilidad se calcula siempre desde el día en que se visita el sitio). */
export function today(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function dayStatus(y: number, m: number, d: number, now = today()): DayStatus {
  const today = now;
  const date = new Date(y, m, d);
  if (date <= today) return 'pasada';
  const dow = date.getDay();
  let h = (y * 372 + m * 31 + d) * 2654435761;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  const r = ((h >>> 0) % 1000) / 1000;
  const high = [3, 4, 9, 10, 11].includes(m) ? 0.14 : 0; // abril–mayo y oct–dic: temporada alta
  const monthsAhead = (y - today.getFullYear()) * 12 + (m - today.getMonth());
  const soon = Math.max(0, 0.16 - monthsAhead * 0.04); // lo más cercano se llena antes
  const busy =
    dow === 6 ? 0.42 + high + soon : dow === 5 ? 0.22 + high / 2 + soon : dow === 0 ? 0.12 + soon / 2 : 0.04 + soon / 3;
  if (r < busy) return 'apartada';
  if (r < busy + 0.08 && (dow === 5 || dow === 6)) return 'ultima';
  return 'libre';
}
