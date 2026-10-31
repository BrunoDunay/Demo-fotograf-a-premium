import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { Motion, prefersReducedMotion, useGsap } from '../core/motion';

const KEY = 'astor-intro';

/**
 * Intro del logo (una vez por sesión): en la oscuridad se enciende la estrella, se dibuja la órbita, sube la
 * palabra ASTOR y dispara un flash de cámara. Cuando se apaga el flash ya estás viendo la mesa de fotos.
 * Va en el HTML prerenderizado para tapar la página desde el primer cuadro; index.html la oculta si ya se vio.
 */
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!gone()) {
      <div class="intro" (click)="skip()" aria-hidden="true">
        <div class="mark">
          <svg class="orbit" viewBox="0 0 400 140">
            <ellipse class="ring" cx="200" cy="70" rx="190" ry="44" transform="rotate(-8 200 70)" pathLength="1" />
            <circle class="moon" cx="374" cy="38" r="4" />
          </svg>
          <svg class="star" viewBox="0 0 24 24"><path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" /></svg>
          <p class="word">@for (c of letters; track $index) {<span>{{ c }}</span>}</p>
          <p class="sub">Fotografía · Aguascalientes</p>
        </div>
        <div class="flash"></div>
      </div>
    }
  `,
  styles: `
    .intro { position: fixed; inset: 0; z-index: var(--z-intro); display: grid; place-items: center; background: var(--color-night); color: var(--color-on-night); cursor: pointer; }
    :host-context(.no-intro) .intro { display: none; }
    .mark { position: relative; display: grid; justify-items: center; gap: 14px; }
    .orbit { position: absolute; left: 50%; top: 42%; width: min(86vw, 560px); translate: -50% -50%; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1; }
    .ring { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0.6; }
    .moon { fill: currentColor; stroke: none; opacity: 0; }
    .star { position: absolute; left: 50%; top: -28px; width: 30px; height: 30px; margin-left: -15px; fill: var(--color-on-night); filter: drop-shadow(0 0 14px rgb(255 255 255 / 70%)); scale: 0; }
    .word { display: flex; overflow: hidden; font-family: var(--font-display); font-size: clamp(3.4rem, 13vw, 7.5rem); font-variation-settings: 'opsz' 96; letter-spacing: 0.08em; line-height: 1.1; padding-inline: 0.1em; }
    .word span { display: inline-block; transform: translateY(105%); }
    .sub { font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.4em; text-transform: uppercase; opacity: 0; color: var(--color-on-night-2); }
    .flash { position: absolute; inset: 0; background: #fffdf8; opacity: 0; pointer-events: none; }
  `,
})
export class Intro {
  protected readonly letters = [...'ASTOR'];
  protected readonly gone = signal(false);
  private readonly motion = inject(Motion);
  private tl?: { progress(n: number): void; kill(): void };

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      let seen = false;
      try {
        seen = !!sessionStorage.getItem(KEY);
        sessionStorage.setItem(KEY, '1');
      } catch {}
      if (seen || prefersReducedMotion()) {
        this.finish();
        return;
      }
      this.motion.lock();
      const { gsap } = useGsap();
      const q = gsap.utils.selector(host);
      const tl = gsap.timeline({ onComplete: () => this.finish() });
      tl.to(q('.star'), { scale: 1, rotation: 180, duration: 0.9, ease: 'expo.out' }, 0.15)
        .to(q('.ring'), { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.3)
        .to(q('.moon'), { opacity: 1, duration: 0.3 }, 1.1)
        .to(q('.word span'), { y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.45)
        .to(q('.sub'), { opacity: 1, duration: 0.6 }, 0.95)
        // El flash: sube de golpe y la intro desaparece detrás de él.
        .to(q('.flash'), { opacity: 1, duration: 0.07, ease: 'none' }, 1.95)
        .set(q('.mark'), { opacity: 0 }, 2.02)
        .set(q('.intro'), { backgroundColor: 'transparent' }, 2.02)
        .to(q('.flash'), { opacity: 0, duration: 0.7, ease: 'power2.out' }, 2.05)
        .call(() => this.release(), [], 2.05);
      this.tl = tl;
    });
  }

  protected skip() {
    this.tl?.progress(1);
  }

  private released = false;
  private release() {
    if (this.released) return;
    this.released = true;
    this.motion.unlock();
    this.motion.introDone.set(true);
  }

  private finish() {
    if (!this.released) {
      if (this.tl) this.release();
      else {
        this.released = true;
        this.motion.introDone.set(true);
      }
    }
    this.gone.set(true);
    document.documentElement.classList.add('no-intro');
  }
}
