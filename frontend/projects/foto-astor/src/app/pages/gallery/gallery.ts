import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { photo, photoSrc } from '../../core/media';
import { Motion, hasFinePointer, prefersReducedMotion } from '../../core/motion';
import { Icon } from '../../shared/icon';
import { Viewer, ViewerItem } from '../../shared/viewer';
import { GalleryArchive } from './archive';
import type { GalleryApi } from './engine';
import { PANORAMA, TOTEMS, TRIPTYCH, WELCOME, programPhotos } from './programs';

const ROOMS = [
  { n: 'Sala I', title: 'Bienvenida', note: 'Un muro de diez metros para empezar' },
  { n: 'Sala II', title: 'Tótems', note: 'Bodas y XV años de pie, a tu altura' },
  { n: 'Sala III', title: 'La caja', note: 'Una boda charra y unos XV que dan la vuelta' },
  { n: 'Sala IV', title: 'Detalles', note: 'Tres tiempos en la pared, cinco detalles en el piso' },
  { n: 'Sala V', title: 'Panorama', note: 'XV años, celebraciones y lo que sigue' },
];
/** Primera estación de cada sala dentro del recorrido (índices de las paradas). */
const ROOM_STOP = [0, 2, 4, 7, 9];
const STOPS = 12;

/**
 * Galería: una exposición en 3D (Three.js) que se recorre con el scroll. Cada sala tiene pantallas con su propia
 * programación y transiciones; las siluetas miran las pantallas. Tocar una pantalla abre la foto que está mostrando.
 * Al terminar el recorrido sigue el archivo: todas las fotos en cuadrícula, con filtros.
 */
@Component({
  selector: 'app-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Viewer, GalleryArchive],
  template: `
    <section class="walk" [style.--stops]="stops" aria-label="Recorrido por la galería">
      <div class="stage">
        @if (!fallback()) {
          <canvas
            aria-label="Galería en 3D con pantallas que muestran fotos de bodas, XV años y eventos sociales"
            role="img"
            (pointermove)="move($event)"
            (pointerleave)="leave()"
            (click)="pick($event)"
            [class.pointer]="hover()"
          ></canvas>
        }

        @if (!ready() && !fallback()) {
          <div class="loader" [class.out]="ready()">
            <svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" /></svg>
            <p class="label">Encendiendo las pantallas</p>
            <span class="bar"><i [style.width.%]="load() * 100"></i></span>
          </div>
        }

        <div class="room" [class.show]="ready()" aria-live="polite">
          @for (r of rooms; track r.n; let i = $index) {
            <div class="room-item" [class.on]="room() === i">
              <p class="label n">{{ r.n }}</p>
              <p class="t">{{ r.title }}</p>
              <p class="note">{{ r.note }}</p>
            </div>
          }
        </div>

        <nav class="rail" aria-label="Salas de la galería" [class.show]="ready()">
          @for (r of rooms; track r.n; let i = $index) {
            <button type="button" [class.on]="room() === i" [attr.aria-current]="room() === i ? 'step' : null" (click)="goRoom(i)">
              <span class="dot"></span><span class="label txt">{{ r.title }}</span>
            </button>
          }
        </nav>

        <p class="hint label" [class.show]="ready() && !moved()">
          <app-icon name="scroll" [size]="18" /> Desplázate para recorrer<span class="long"> · toca una pantalla para ver la foto</span>
        </p>

        @if (atEnd()) {
          <div class="end">
            <p class="script">¿Tu historia sigue?</p>
            <div class="end-actions">
              <a routerLink="/contacto" fragment="fechas" class="btn btn-light"><span class="btn-t">Aparta tu fecha</span></a>
              <button type="button" class="btn btn-line-light" (click)="toArchive()"><span class="btn-t">Verlas en cuadrícula</span></button>
              <button type="button" class="btn btn-line-light" (click)="restart()"><span class="btn-t">Volver a la entrada</span></button>
            </div>
          </div>
        }

        <span class="cursor label" [class.on]="hover() && fine" [style.translate]="cursor()">Ver foto</span>

        @if (fallback()) {
          <div class="fallback">
            <p class="label">Galería</p>
            <h1 class="fb-title">Tu dispositivo no pudo encender la sala en 3D, <em>pero aquí están las fotos.</em></h1>
            <ul class="fb-grid">
              @for (p of fallbackPhotos; track p; let i = $index) {
                <li><button type="button" (click)="openFallback(i)"><img [src]="src(p)" [alt]="alt(p)" loading="lazy" /></button></li>
              }
            </ul>
          </div>
        }
      </div>
      <h1 class="visually-hidden">Galería de Astor: bodas, XV años y eventos sociales en Aguascalientes</h1>
    </section>
    <app-gallery-archive id="archivo" (open)="openArchive($event)" />
    <app-viewer [items]="items()" [(index)]="index" tone="night" />
  `,
  styles: `
    :host { display: block; background: var(--color-night); color: var(--color-on-night); }
    .walk { position: relative; height: calc(var(--stops) * 82svh + 100svh); }
    .stage { position: sticky; top: 0; height: 100svh; overflow: hidden; }
    canvas { display: block; width: 100%; height: 100%; touch-action: pan-y; }
    canvas.pointer { cursor: pointer; }

    .loader { position: absolute; inset: 0; z-index: 5; display: grid; place-content: center; justify-items: center; gap: 18px; background: var(--color-night); transition: opacity 700ms ease; }
    .loader .star { width: 26px; height: 26px; fill: var(--color-on-night); animation: spin 2.4s var(--ease-in-out) infinite; filter: drop-shadow(0 0 10px rgb(255 255 255 / 60%)); }
    @keyframes spin { 50% { rotate: 180deg; scale: 0.7; } 100% { rotate: 360deg; } }
    .loader .label { color: var(--color-on-night-2); }
    .bar { width: 180px; height: 1px; background: var(--color-line-night); overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--color-on-night); transition: width 400ms var(--ease-out); }

    .room { position: absolute; left: var(--gutter); bottom: clamp(28px, 6vh, 56px); z-index: 2; pointer-events: none; opacity: 0; transition: opacity 800ms ease; }
    .room.show { opacity: 1; }
    .room-item { position: absolute; left: 0; bottom: 0; width: max-content; max-width: 70vw; opacity: 0; translate: 0 14px; transition: opacity 500ms ease, translate 700ms var(--ease-out); }
    .room-item.on { position: relative; opacity: 1; translate: 0 0; transition-delay: 200ms; }
    .room-item .n { color: var(--color-accent-soft); }
    .room-item .t { font-family: var(--font-display); font-style: italic; font-size: clamp(2.2rem, 5vw, 4.2rem); line-height: 1; margin-top: 6px; text-shadow: 0 2px 30px rgb(0 0 0 / 60%); }
    .room-item .note { margin-top: 8px; font-size: 0.92rem; color: var(--color-on-night-2); }

    .rail { position: absolute; right: var(--gutter); top: 50%; z-index: 2; display: grid; gap: 4px; translate: 0 -50%; opacity: 0; transition: opacity 800ms ease; }
    .rail.show { opacity: 1; }
    .rail button { display: flex; align-items: center; justify-content: flex-end; gap: 12px; min-height: 36px; flex-direction: row-reverse; color: var(--color-on-night-2); transition: color 300ms ease; }
    .rail .dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: inset 0 0 0 1px currentColor; transition: background-color 300ms ease, scale 300ms var(--ease-spring); }
    .rail .txt { opacity: 0; translate: 6px 0; transition: opacity 300ms ease, translate 400ms var(--ease-out); font-size: 0.62rem; }
    .rail button.on { color: var(--color-on-night); }
    .rail button.on .dot { background: currentColor; scale: 1.25; }
    @media (hover: hover) and (pointer: fine) {
      .rail button:hover .txt, .rail button.on .txt { opacity: 1; translate: 0 0; }
      .rail button:hover { color: var(--color-on-night); }
    }

    .hint { position: absolute; left: 50%; bottom: 28px; z-index: 2; display: inline-flex; align-items: center; gap: 10px; translate: -50% 10px; opacity: 0; white-space: nowrap; color: var(--color-on-night-2); transition: opacity 600ms ease, translate 600ms var(--ease-out); }
    .hint.show { opacity: 1; translate: -50% 0; }
    .hint app-icon { animation: nudge 1.8s var(--ease-in-out) infinite; }
    @keyframes nudge { 50% { translate: 0 4px; } }

    .end { position: absolute; left: 50%; top: 12%; z-index: 3; display: grid; justify-items: center; gap: 18px; translate: -50% 0; text-align: center; animation: end-in 900ms var(--ease-out) both; }
    @keyframes end-in { from { opacity: 0; translate: -50% 16px; } }
    .end .script { font-size: clamp(2.6rem, 6vw, 4.4rem); color: var(--color-accent-soft); text-shadow: 0 2px 30px rgb(0 0 0 / 70%); }
    .end-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }

    .cursor { position: fixed; left: 0; top: 0; z-index: 4; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-on-night); color: var(--color-night); pointer-events: none; opacity: 0; scale: 0.8; transition: opacity 200ms ease, scale 300ms var(--ease-out); font-size: 0.62rem; }
    .cursor.on { opacity: 1; scale: 1; }

    .fallback { position: absolute; inset: 0; overflow-y: auto; padding: 120px var(--gutter) 60px; }
    .fb-title { font-size: var(--text-xl); margin: 14px 0 28px; max-width: 24em; }
    .fb-title em { color: var(--color-accent-soft); }
    .fb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
    .fb-grid button { display: block; width: 100%; }
    .fb-grid img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }

    @media (max-width: 760px) {
      .rail { right: 10px; }
      .rail button { min-height: 30px; }
      .rail .txt { display: none; }
      .room { bottom: 26px; }
      .room-item .t { font-size: 2.2rem; }
      .room-item .note { font-size: 0.84rem; max-width: 72vw; }
      .hint { bottom: 132px; font-size: 0.62rem; }
      .hint .long { display: none; }
    }
  `,
})
export default class Gallery {
  protected readonly rooms = ROOMS;
  protected readonly stops = STOPS;
  protected readonly ready = signal(false);
  protected readonly load = signal(0);
  protected readonly room = signal(0);
  protected readonly hover = signal(false);
  protected readonly moved = signal(false);
  protected readonly atEnd = signal(false);
  protected readonly fallback = signal(false);
  protected readonly cursor = signal('0 0');
  protected readonly index = signal<number | null>(null);
  protected readonly picked = signal<string[]>([]);
  protected fine = false;
  protected readonly fallbackPhotos = [
    ...new Set([...programPhotos(WELCOME), ...TOTEMS.flatMap(programPhotos), ...programPhotos(TRIPTYCH), ...programPhotos(PANORAMA)]),
  ];
  protected readonly items = computed<ViewerItem[]>(() =>
    this.picked().map((name) => {
      const p = photo(name);
      return { kind: 'photo', src: photoSrc(p), preview: photoSrc(p, true), alt: p.alt, caption: p.alt, meta: 'Galería Astor', ratio: p.w / p.h };
    }),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(Motion);
  private api?: GalleryApi;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.fine = hasFinePointer();
      const canvas = this.host.querySelector('canvas');
      const probe = document.createElement('canvas');
      if (!canvas || !probe.getContext('webgl2')) {
        this.fallback.set(true);
        return;
      }
      let disposed = false;
      import('./engine').then(async ({ createGallery }) => {
        if (disposed) return;
        try {
          this.api = await createGallery(
            canvas,
            {
              onRoom: (i) => this.room.set(i),
              onHover: (on) => this.hover.set(on),
              onPick: (photos, i) => {
                this.picked.set(photos);
                this.index.set(i);
              },
              onLoad: (p) => this.load.set(p),
              onReady: () => this.ready.set(true),
              onEnd: (end) => this.atEnd.set(end),
            },
            { reduced: prefersReducedMotion() },
          );
        } catch (err) {
          console.error(err);
          this.fallback.set(true);
          return;
        }
        if (disposed) return this.api.destroy();
        this.onScroll();
      });

      const walk = this.host.querySelector<HTMLElement>('.walk')!;
      const io = new IntersectionObserver(([e]) => this.api?.setVisible(e.isIntersecting));
      io.observe(walk);
      addEventListener('scroll', this.onScroll, { passive: true });
      const onResize = () => this.api?.resize();
      addEventListener('resize', onResize);
      destroyRef.onDestroy(() => {
        disposed = true;
        io.disconnect();
        removeEventListener('scroll', this.onScroll);
        removeEventListener('resize', onResize);
        this.api?.destroy();
      });
    });
  }

  private readonly onScroll = () => {
    const walk = this.host.querySelector<HTMLElement>('.walk');
    if (!walk) return;
    const r = walk.getBoundingClientRect();
    const q = -r.top / Math.max(1, r.height - innerHeight);
    this.api?.setProgress(q);
    if (q > 0.015 && !this.moved()) this.moved.set(true);
  };

  protected move(e: PointerEvent) {
    this.api?.pointer(e.clientX, e.clientY, e.pointerType === 'mouse');
    if (e.pointerType === 'mouse') this.cursor.set(`${e.clientX + 16}px ${e.clientY + 14}px`);
  }

  protected leave() {
    this.api?.leave();
  }

  protected pick(e: MouseEvent) {
    this.api?.click(e.clientX, e.clientY);
  }

  protected goRoom(i: number) {
    const walk = this.host.querySelector<HTMLElement>('.walk')!;
    const top = walk.getBoundingClientRect().top + scrollY;
    const span = walk.offsetHeight - innerHeight;
    // Justo en el primer encuadre de la sala.
    const q = ROOM_STOP[i] / (STOPS - 1);
    this.motion.scrollTo(top + span * q, false, 0);
  }

  protected toArchive() {
    const el = this.host.querySelector<HTMLElement>('#archivo');
    if (el) this.motion.scrollTo(el.getBoundingClientRect().top + scrollY - 40, false, 0);
  }

  protected openArchive(e: { photos: string[]; index: number }) {
    this.picked.set(e.photos);
    this.index.set(e.index);
  }

  protected restart() {
    this.goRoom(0);
  }

  protected src(name: string) {
    return photoSrc(photo(name), true);
  }

  protected alt(name: string) {
    return photo(name).alt;
  }

  protected openFallback(i: number) {
    this.picked.set(this.fallbackPhotos);
    this.index.set(i);
  }
}
