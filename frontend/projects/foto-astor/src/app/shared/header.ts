import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { BRAND } from '../core/content';
import { photoSrc } from '../core/media';
import { Motion } from '../core/motion';
import { Logo } from './logo';

const LINKS = [
  { path: '/galeria', label: 'Galería', note: 'Una exposición que se recorre', photo: 'chispas-frias' },
  { path: '/sobre-mi', label: 'Sobre mí', note: 'Quién está detrás de la cámara', photo: 'emilio' },
  { path: '/equipo', label: 'Mi equipo', note: 'Lo que cargo cada fin de semana', photo: 'emilio-camara' },
  { path: '/paquetes', label: 'Paquetes', note: 'Precios claros desde el inicio', photo: 'xv-esmeralda' },
  { path: '/contacto', label: 'Contacto', note: 'Fechas disponibles y mi tarjeta', photo: 'hacienda-sombrero' },
];

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Logo],
  host: { '[class.night]': "theme() === 'night'", '[class.solid]': 'solid()', '[class.hidden]': 'hidden() && !open()' },
  template: `
    <header class="bar">
      <a routerLink="/" class="brand" aria-label="Astor, ir al inicio" (click)="open.set(false)"><app-logo [compact]="true" /></a>
      <nav class="links" aria-label="Principal">
        @for (l of links; track l.path) {
          <a [routerLink]="l.path" routerLinkActive="active">{{ l.label }}</a>
        }
      </nav>
      <a routerLink="/contacto" fragment="fechas" class="cta btn btn-ink">
        <span>Aparta tu fecha</span>
      </a>
      <button type="button" class="menu-btn" [attr.aria-expanded]="open()" aria-controls="menu" (click)="toggle()">
        <span class="lines" aria-hidden="true"><i></i><i></i></span>
        <span class="menu-label">{{ open() ? 'Cerrar' : 'Menú' }}</span>
      </button>
    </header>

    @if (open() || closing()) {
      <div id="menu" class="menu" [class.closing]="closing()" role="dialog" aria-modal="true" aria-label="Menú">
        <div class="menu-photo" aria-hidden="true">
          @for (l of links; track l.path; let i = $index) {
            <img [src]="photoSrc(l.photo, true)" alt="" [class.on]="hover() === i" />
          }
        </div>
        <nav class="menu-links" aria-label="Menú principal">
          <a routerLink="/" class="m-link" (click)="close()" (pointerenter)="hover.set(-1)" [style.--i]="0">
            <span class="n">00</span><span class="t">Inicio</span>
          </a>
          @for (l of links; track l.path; let i = $index) {
            <a [routerLink]="l.path" class="m-link" (click)="close()" (pointerenter)="hover.set(i)" [style.--i]="i + 1">
              <span class="n">0{{ i + 1 }}</span><span class="t">{{ l.label }}</span><span class="note">{{ l.note }}</span>
            </a>
          }
        </nav>
        <div class="menu-foot">
          <p class="label">{{ brand.city }} · {{ brand.phone }}</p>
          <p class="label">{{ brand.instagram }}</p>
        </div>
      </div>
    }
  `,
  styles: `
    :host { position: fixed; inset: 0 0 auto; z-index: var(--z-header); color: var(--color-ink); transition: translate 420ms var(--ease-out), color 400ms ease; }
    :host(.hidden) { translate: 0 -110%; }
    .bar {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 28px;
      height: 76px;
      padding-inline: var(--gutter);
      transition: background-color 400ms ease, box-shadow 400ms ease, backdrop-filter 400ms ease;
    }
    :host(.solid) .bar { background: rgb(239 236 230 / 82%); backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2); box-shadow: 0 1px 0 var(--color-line); }
    :host(.night) { color: var(--color-on-night); }
    :host(.night.solid) .bar { background: rgb(10 10 11 / 72%); box-shadow: 0 1px 0 var(--color-line-night); }
    .brand { display: inline-flex; font-size: 15px; margin-right: auto; position: relative; z-index: 3; }
    .links { display: flex; gap: 30px; }
    .links a {
      position: relative;
      font-family: var(--font-label);
      font-size: 0.74rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding-block: 8px;
      opacity: 0.78;
      transition: opacity 200ms ease;
    }
    .links a::after { content: ''; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: currentColor; scale: 0 1; transform-origin: right; transition: scale 500ms var(--ease-out); }
    .links a.active { opacity: 1; }
    .links a.active::after { scale: 1 1; }
    @media (hover: hover) and (pointer: fine) {
      .links a:hover { opacity: 1; }
      .links a:hover::after { scale: 1 1; transform-origin: left; }
    }
    .cta { min-height: 44px; padding: 0 20px; font-size: 0.7rem; }
    :host(.night) .cta { background: var(--color-on-night); color: var(--color-night); }
    .menu-btn { display: none; position: relative; z-index: 3; align-items: center; gap: 10px; min-height: 44px; font-family: var(--font-label); font-size: 0.74rem; letter-spacing: 0.2em; text-transform: uppercase; }
    .menu-btn:active { scale: 0.95; }
    .lines { position: relative; width: 22px; height: 10px; }
    .lines i { position: absolute; left: 0; right: 0; height: 1.5px; background: currentColor; transition: translate 400ms var(--ease-out), rotate 400ms var(--ease-out); }
    .lines i:first-child { top: 0; }
    .lines i:last-child { bottom: 0; }
    [aria-expanded='true'] .lines i:first-child { translate: 0 4.25px; rotate: 45deg; }
    [aria-expanded='true'] .lines i:last-child { translate: 0 -4.25px; rotate: -45deg; }

    .menu {
      position: fixed;
      inset: 0;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr;
      align-content: center;
      padding: 110px var(--gutter) 40px;
      background: var(--color-paper);
      color: var(--color-ink);
      animation: menu-in 620ms var(--ease-drawer) both;
    }
    .menu.closing { animation: menu-out 300ms var(--ease-in-out) both; }
    @keyframes menu-in { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes menu-out { from { clip-path: inset(0 0 0 0); } to { clip-path: inset(0 0 100% 0); } }
    .menu-photo { position: absolute; right: var(--gutter); top: 50%; width: min(34vw, 420px); aspect-ratio: 4 / 5; translate: 0 -50%; overflow: hidden; display: none; }
    .menu-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; scale: 1.08; transition: opacity 500ms ease, scale 900ms var(--ease-out); }
    .menu-photo img.on { opacity: 1; scale: 1; }
    .menu-links { display: grid; gap: 4px; }
    .m-link { display: grid; grid-template-columns: 42px auto; align-items: baseline; column-gap: 12px; padding-block: 6px; animation: link-in 800ms var(--ease-out) both; animation-delay: calc(var(--i) * 60ms + 160ms); }
    @keyframes link-in { from { opacity: 0; translate: 0 30px; } }
    .m-link .n { font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.16em; color: var(--color-muted); }
    .m-link .t { font-family: var(--font-display); font-style: italic; font-size: clamp(2.4rem, 9vw, 5.2rem); line-height: 1.05; transition: translate 500ms var(--ease-out); }
    .m-link .note { grid-column: 2; font-size: 0.86rem; color: var(--color-muted); margin-top: -4px; }
    .m-link:active .t { translate: 8px 0; }
    @media (hover: hover) and (pointer: fine) {
      .m-link:hover .t { translate: 14px 0; }
    }
    .menu-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px; margin-top: 40px; color: var(--color-muted); }

    @media (min-width: 1000px) {
      .menu-photo { display: block; }
    }
    @media (max-width: 980px) {
      .links, .cta { display: none; }
      .menu-btn { display: inline-flex; }
      .bar { height: 68px; }
    }
  `,
})
export class Header {
  readonly theme = input<'paper' | 'night'>('paper');
  protected readonly links = LINKS;
  protected readonly brand = BRAND;
  protected readonly photoSrc = photoSrc;
  protected readonly open = signal(false);
  protected readonly closing = signal(false);
  protected readonly solid = signal(false);
  protected readonly hidden = signal(false);
  protected readonly hover = signal(0);
  private readonly motion = inject(Motion);

  constructor() {
    const destroyRef = inject(DestroyRef);
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.hidden.set(false));

    effect(() => {
      // Con el menú abierto la página no se desplaza.
      if (this.open()) this.motion.lock();
    });

    afterNextRender(() => {
      let last = scrollY;
      const onScroll = () => {
        const y = scrollY;
        this.solid.set(y > 40);
        // Se esconde al bajar y regresa al subir (no estorba a las fotos).
        if (Math.abs(y - last) > 6) this.hidden.set(y > last && y > 300);
        last = y;
      };
      addEventListener('scroll', onScroll, { passive: true });
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && this.open() && this.close();
      addEventListener('keydown', onKey);
      destroyRef.onDestroy(() => {
        removeEventListener('scroll', onScroll);
        removeEventListener('keydown', onKey);
      });
    });
  }

  protected toggle() {
    if (this.open()) this.close();
    else this.open.set(true);
  }

  protected close() {
    if (!this.open()) return;
    this.open.set(false);
    this.closing.set(true);
    this.motion.unlock();
    setTimeout(() => this.closing.set(false), 300);
  }
}
