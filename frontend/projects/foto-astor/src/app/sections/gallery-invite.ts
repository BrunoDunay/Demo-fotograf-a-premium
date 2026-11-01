import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cutoutSrc, photo, photoSrc } from '../core/media';
import { hasFinePointer } from '../core/motion';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

/**
 * Invitación a la galería: una sala en miniatura (CSS 3D) con tres pantallas que cambian de foto con un barrido,
 * piso que refleja y una silueta mirando. Se inclina con el cursor. Lleva a /galeria, donde está la sala completa.
 */
@Component({
  selector: 'app-gallery-invite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Reveal],
  template: `
    <section class="invite on-night" aria-labelledby="invite-title">
      <div class="container grid">
        <div class="copy">
          <p class="label kicker" data-reveal>La galería</p>
          <h2 id="invite-title" class="title" data-reveal>No es un álbum. <em>Es una exposición.</em></h2>
          <p class="lead" data-reveal>
            Mis bodas y XV años viven en pantallas de una galería oscura que recorres al hacer scroll. Hay salas, tótems,
            una pantalla curva y gente mirando. Toca una pantalla y la foto es tuya por un momento.
          </p>
          <a routerLink="/galeria" class="btn btn-light" data-reveal>
            <span class="btn-t">Entrar a la galería</span> <app-icon name="arrow-right" [size]="16" />
          </a>
        </div>

        <a routerLink="/galeria" class="room-link" aria-label="Entrar a la galería" (pointermove)="tilt($event)" (pointerleave)="rx.set(0); ry.set(0)">
          <div class="room" [style.--rx]="rx() + 'deg'" [style.--ry]="ry() + 'deg'">
            <div class="floor"></div>
            <div class="ceiling">
              @for (i of [0, 1, 2, 3, 4, 5]; track i) {
                <span class="beam" [style.--i]="i"></span>
              }
            </div>
            @for (s of screens; track s.cls) {
              <div class="screen" [class]="'screen ' + s.cls">
                @for (p of s.photos; track p; let i = $index) {
                  <img [src]="src(p)" alt="" [style.--i]="i" />
                }
                <span class="glow"></span>
              </div>
            }
            <img class="person" [src]="sil" alt="" loading="lazy" />
            <span class="enter label">Entrar <app-icon name="arrow-right" [size]="14" /></span>
          </div>
        </a>
      </div>
    </section>
  `,
  styles: `
    .invite { position: relative; padding-block: var(--space-section); overflow: hidden; }
    .grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(32px, 5vw, 80px); align-items: center; }
    .copy { display: grid; gap: 20px; justify-items: start; }
    .title { font-size: var(--text-2xl); }
    .title em { display: block; color: var(--color-accent-soft); }

    .room-link { display: block; perspective: 900px; }
    .room {
      position: relative;
      aspect-ratio: 16 / 10;
      transform-style: preserve-3d;
      transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
      transition: transform 900ms var(--ease-out);
      background: radial-gradient(70% 60% at 50% 45%, #161c2c, #04060c 75%);
      overflow: hidden;
      border-radius: 4px;
      box-shadow: 0 0 0 1px var(--color-line-night), var(--shadow-night);
    }
    .floor { position: absolute; left: 0; right: 0; bottom: 0; height: 34%; background: linear-gradient(#0a0d16, #141a26); }
    .floor::after { content: ''; position: absolute; inset: 0; background: radial-gradient(50% 70% at 50% 0%, rgb(255 250 240 / 16%), transparent 70%); }
    .ceiling { position: absolute; left: 0; right: 0; top: 0; height: 16%; }
    .beam { position: absolute; top: 34%; left: calc(8% + var(--i) * 16.8%); width: 9%; height: 2px; background: rgb(255 255 255 / 55%); box-shadow: 0 0 12px rgb(255 255 255 / 60%); }
    .screen { position: absolute; overflow: hidden; background: #000; box-shadow: 0 0 40px rgb(255 248 235 / 12%); }
    .screen img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: wipe 12s var(--ease-in-out) infinite; animation-delay: calc(var(--i) * 4s - 12s); clip-path: inset(0 100% 0 0); }
    @keyframes wipe {
      0% { clip-path: inset(0 100% 0 0); }
      8%, 33% { clip-path: inset(0 0 0 0); }
      41%, 100% { clip-path: inset(0 0 0 100%); }
    }
    .center { left: 26%; right: 26%; top: 18%; bottom: 38%; }
    .left { left: 4%; width: 18%; top: 22%; bottom: 36%; transform: perspective(600px) rotateY(38deg); transform-origin: right; }
    .right { right: 4%; width: 18%; top: 22%; bottom: 36%; transform: perspective(600px) rotateY(-38deg); transform-origin: left; }
    .glow { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(255 255 255 / 6%), transparent 30%); }
    .screen::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 60%; background: inherit; }
    .person { position: absolute; left: 58%; bottom: 14%; height: 44%; width: auto; filter: brightness(0.6); }
    .enter { position: absolute; right: 16px; bottom: 14px; display: inline-flex; align-items: center; gap: 8px; color: var(--color-on-night-2); transition: color 300ms ease, gap 300ms var(--ease-out); }
    @media (hover: hover) and (pointer: fine) {
      .room-link:hover .enter { color: var(--color-on-night); gap: 12px; }
    }
    .room-link:active .room { scale: 0.99; }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
  `,
})
export class GalleryInvite {
  protected readonly rx = signal(0);
  protected readonly ry = signal(0);
  protected readonly sil = cutoutSrc('sil-abrigo');
  protected readonly screens = [
    { cls: 'left', photos: ['xv-noche-azul', 'velo-noche', 'novia-ventanal'] },
    { cls: 'center', photos: ['chispas-frias', 'hacienda-sombrero', 'pista-bn'] },
    { cls: 'right', photos: ['novia-niebla', 'xv-iglesia', 'ramo-ventana'] },
  ];

  protected src(name: string) {
    return photoSrc(photo(name), true);
  }

  protected tilt(e: PointerEvent) {
    if (!hasFinePointer()) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.ry.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    this.rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
  }
}
