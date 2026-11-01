import { ChangeDetectionStrategy, Component, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';

const COVER_MS = 380; // lo que tarda el obturador en tapar la pantalla
const MIN_SHOWN_MS = 640; // tiempo mínimo cerrado: alcanzan a verse la estrella y la órbita
const LEAVE_MS = 520;

const ORBIT = 'M10 40 A90 22 -8 1 1 190 22 A90 22 -8 1 1 10 40';

/**
 * Cambio de página: la versión rápida de la intro, como un obturador. La noche se abre desde el centro
 * y tapa la página, se enciende la estrella con su destello y la órbita la rodea; ya con la página nueva
 * lista debajo, la noche se cierra hacia el centro como un diafragma. El router espera a que tape (guard).
 */
@Injectable({ providedIn: 'root' })
export class PageCurtainService {
  readonly phase = signal<'idle' | 'in' | 'out'>('idle');
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router);
  private coveredAt = 0;
  private covering: Promise<void> | null = null;

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) this.reveal();
    });
  }

  cover(): Promise<void> {
    // La primera carga la cubre la intro; en el prerender no hay nada que animar.
    if (!this.browser || !this.router.navigated) return Promise.resolve();
    if (document.documentElement.classList.contains('reduce-motion')) return Promise.resolve();
    if (this.covering) return this.covering;
    this.phase.set('in');
    this.coveredAt = performance.now();
    this.covering = new Promise((resolve) => setTimeout(resolve, COVER_MS));
    return this.covering;
  }

  private reveal(): void {
    if (this.phase() !== 'in') return;
    const wait = Math.max(0, MIN_SHOWN_MS - (performance.now() - this.coveredAt));
    setTimeout(() => {
      this.covering = null;
      this.phase.set('out');
      setTimeout(() => this.phase() === 'out' && this.phase.set('idle'), LEAVE_MS);
    }, wait);
  }
}

/** Solo cuando de verdad se cambia de página (no al volver a tocar la misma ni al saltar a una sección). */
export const pageCurtainGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const path = (url: string) => url.split(/[?#]/)[0];
  if (path(state.url) === path(router.url)) return true;
  return inject(PageCurtainService).cover().then(() => true);
};

@Component({
  selector: 'app-page-curtain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.is-in]': 'curtain.phase() === "in"', '[class.is-out]': 'curtain.phase() === "out"' },
  template: `
    @if (curtain.phase() !== 'idle') {
      <div class="mark">
        <svg class="orbit" viewBox="0 0 200 62"><path [attr.d]="orbit" pathLength="1" /></svg>
        <span class="flash"></span>
        <svg class="star" viewBox="0 0 24 24"><path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" /></svg>
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: calc(var(--z-intro) - 1);
      display: grid;
      place-items: center;
      background: var(--color-night);
      color: var(--color-on-night);
      pointer-events: none;
      visibility: hidden;
      clip-path: circle(0% at 50% 50%);
    }
    :host(.is-in) { visibility: visible; pointer-events: auto; animation: open 380ms cubic-bezier(0.76, 0, 0.24, 1) forwards; }
    :host(.is-out) { visibility: visible; clip-path: circle(75% at 50% 50%); animation: close 520ms cubic-bezier(0.76, 0, 0.24, 1) forwards; }
    .mark { position: relative; display: grid; place-items: center; width: 220px; height: 120px; }
    :host(.is-out) .mark { animation: fade 220ms ease-in forwards; }
    .orbit { position: absolute; width: 200px; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1; opacity: 0.6; }
    .orbit path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 520ms cubic-bezier(0.65, 0, 0.35, 1) 180ms forwards; }
    .star { position: relative; width: 30px; height: 30px; fill: #fff; filter: drop-shadow(0 0 12px rgb(255 255 255 / 75%)); scale: 0; rotate: -45deg; animation: star 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 140ms forwards; }
    .flash { position: absolute; width: 200px; height: 1px; background: linear-gradient(90deg, transparent, rgb(255 255 255 / 85%) 48% 52%, transparent); scale: 0 1; opacity: 0; animation: flash 520ms ease-out 160ms forwards; }
    @keyframes open { from { clip-path: circle(0% at 50% 50%); } to { clip-path: circle(75% at 50% 50%); } }
    @keyframes close { from { clip-path: circle(75% at 50% 50%); } to { clip-path: circle(0% at 50% 50%); } }
    @keyframes star { to { scale: 1; rotate: 0deg; } }
    @keyframes flash { 40% { scale: 1 1; opacity: 1; } to { scale: 1.2 1; opacity: 0; } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes fade { to { opacity: 0; } }
  `,
})
export class PageCurtain {
  protected readonly curtain = inject(PageCurtainService);
  protected readonly orbit = ORBIT;
}
