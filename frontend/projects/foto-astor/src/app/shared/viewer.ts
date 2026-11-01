import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Motion } from '../core/motion';
import { Icon } from './icon';

export interface ViewerItem {
  kind: 'photo' | 'video';
  src: string;
  /** Versión ligera que se muestra mientras carga la grande. */
  preview?: string;
  alt: string;
  caption?: string;
  meta?: string;
  ratio?: number;
}

/**
 * Visor a pantalla completa para fotos y videos: entra con una escala suave, sale más rápido, se cierra con
 * Esc, con un toque fuera o deslizando hacia abajo, y se navega con flechas, teclado o deslizando de lado.
 */
@Component({
  selector: 'app-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (current(); as item) {
      <div class="viewer" [class.closing]="closing()" [class.night]="tone() === 'night'" role="dialog" aria-modal="true" [attr.aria-label]="item.alt" (click)="close()">
        <figure
          class="frame"
          (click)="$event.stopPropagation()"
          (pointerdown)="down($event)"
          (pointermove)="move($event)"
          (pointerup)="up()"
          (pointercancel)="up()"
          [style.translate]="'0 ' + dragY() + 'px'"
          [style.--ratio]="item.ratio ?? 1.5"
        >
          @if (item.kind === 'photo') {
            @if (item.preview) {
              <img class="media preview" [src]="item.preview" alt="" draggable="false" />
            }
            <img class="media" [src]="item.src" [alt]="item.alt" draggable="false" (load)="loaded.set(true)" [class.ready]="loaded()" />
          } @else {
            <video #vid class="media ready" [src]="item.src" autoplay muted loop playsinline controls [attr.aria-label]="item.alt"></video>
          }
          <figcaption>
            <span class="cap">{{ item.caption ?? item.alt }}</span>
            @if (item.meta) {
              <span class="label meta">{{ item.meta }}</span>
            }
          </figcaption>
        </figure>
        <button type="button" class="close" aria-label="Cerrar" (click)="close()"><app-icon name="close" [size]="22" /></button>
        @if (items().length > 1) {
          <button type="button" class="nav prev" aria-label="Anterior" (click)="step(-1, $event)"><app-icon name="chevron-left" [size]="22" /></button>
          <button type="button" class="nav next" aria-label="Siguiente" (click)="step(1, $event)"><app-icon name="chevron-right" [size]="22" /></button>
          <p class="count label">{{ (index() ?? 0) + 1 }} / {{ items().length }}</p>
        }
      </div>
    }
  `,
  styles: `
    .viewer {
      position: fixed;
      inset: 0;
      z-index: var(--z-viewer);
      display: grid;
      place-items: center;
      padding: 64px var(--gutter) 56px;
      background: rgb(233 235 239 / 94%);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: var(--color-ink);
      animation: fade-in 420ms var(--ease-out) both;
    }
    .viewer.night { background: rgb(7 11 22 / 94%); color: var(--color-on-night); }
    .viewer.closing { animation: fade-out 220ms ease-in both; }
    .viewer.closing .frame { animation: frame-out 220ms ease-in both; }
    @keyframes fade-in { from { opacity: 0; } }
    @keyframes fade-out { to { opacity: 0; } }
    .frame { position: relative; display: grid; gap: 14px; justify-items: center; width: min(100%, calc((100svh - 190px) * var(--ratio)), 1400px); animation: frame-in 620ms var(--ease-out) both; touch-action: none; transition: translate 300ms var(--ease-out); }
    @keyframes frame-in { from { opacity: 0; scale: 0.94; } }
    @keyframes frame-out { to { opacity: 0; scale: 0.97; } }
    .media { grid-area: 1 / 1; width: 100%; aspect-ratio: var(--ratio); object-fit: contain; box-shadow: var(--shadow-night); background: rgb(0 0 0 / 6%); user-select: none; -webkit-user-drag: none; }
    img.media:not(.preview) { opacity: 0; transition: opacity 400ms ease; }
    img.media.ready { opacity: 1; }
    figcaption { display: grid; gap: 4px; justify-items: center; text-align: center; max-width: 60ch; }
    .cap { font-family: var(--font-display); font-style: italic; font-size: 1.15rem; }
    .meta { opacity: 0.6; }
    .close, .nav { position: absolute; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: rgb(127 127 127 / 12%); transition: background-color 200ms ease, scale 160ms var(--ease-out); }
    .close:active, .nav:active { scale: 0.92; }
    @media (hover: hover) and (pointer: fine) { .close:hover, .nav:hover { background: rgb(127 127 127 / 24%); } }
    .close { top: 14px; right: 14px; }
    .nav { top: 50%; translate: 0 -50%; }
    .prev { left: 14px; }
    .next { right: 14px; }
    .count { position: absolute; bottom: 18px; left: 50%; translate: -50% 0; opacity: 0.6; }
    @media (max-width: 640px) {
      .nav { top: auto; bottom: 8px; translate: none; }
      .prev { left: 16px; }
      .next { right: 16px; }
      .count { bottom: 22px; }
    }
  `,
})
export class Viewer {
  readonly items = input.required<ViewerItem[]>();
  readonly index = model<number | null>(null);
  readonly tone = input<'paper' | 'night'>('paper');
  readonly closed = output<void>();

  protected readonly closing = signal(false);
  protected readonly loaded = signal(false);
  protected readonly dragY = signal(0);
  protected readonly current = computed(() => {
    const i = this.index();
    return i === null ? null : this.items()[i] ?? null;
  });
  private readonly motion = inject(Motion);
  private start: { x: number; y: number } | null = null;
  private dx = 0;
  private locked = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const open = this.index() !== null;
      if (open && !this.locked) {
        this.locked = true;
        this.motion.lock();
      }
    });
    effect(() => {
      this.current();
      this.loaded.set(false);
    });
    const onKey = (e: KeyboardEvent) => {
      if (this.index() === null) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight') this.step(1);
      if (e.key === 'ArrowLeft') this.step(-1);
    };
    if (typeof window !== 'undefined') {
      addEventListener('keydown', onKey);
      destroyRef.onDestroy(() => {
        removeEventListener('keydown', onKey);
        if (this.locked) this.motion.unlock();
      });
    }
  }

  protected step(dir: number, e?: Event) {
    e?.stopPropagation();
    const n = this.items().length;
    this.index.update((i) => ((i ?? 0) + dir + n) % n);
  }

  close() {
    if (this.index() === null || this.closing()) return;
    this.closing.set(true);
    setTimeout(() => {
      this.closing.set(false);
      this.dragY.set(0);
      this.index.set(null);
      if (this.locked) {
        this.locked = false;
        this.motion.unlock();
      }
      this.closed.emit();
    }, 220);
  }

  // Deslizar: hacia abajo cierra, de lado cambia de foto.
  protected down(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    this.start = { x: e.clientX, y: e.clientY };
    this.dx = 0;
  }

  protected move(e: PointerEvent) {
    if (!this.start) return;
    const dy = e.clientY - this.start.y;
    this.dx = e.clientX - this.start.x;
    if (Math.abs(dy) > Math.abs(this.dx)) this.dragY.set(Math.max(0, dy));
  }

  protected up() {
    if (!this.start) return;
    this.start = null;
    if (this.dragY() > 110) this.close();
    else if (Math.abs(this.dx) > 60) this.step(this.dx < 0 ? 1 : -1);
    this.dragY.set(0);
  }
}
