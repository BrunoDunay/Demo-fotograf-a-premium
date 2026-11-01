import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { Motion, prefersReducedMotion, useGsap } from '../core/motion';

const KEY = 'astor-intro';

// Órbita de la intro (mismo dibujo que el logo, más grande): centro (200, 70), radios 190 × 44, -8°.
const CX = 200;
const CY = 70;
const RX = 190;
const RY = 44;
const TILT = (-8 * Math.PI) / 180;
const START = -0.62 * Math.PI;
const pt = (t: number) => {
  const x = RX * Math.cos(t);
  const y = RY * Math.sin(t);
  return { x: CX + x * Math.cos(TILT) - y * Math.sin(TILT), y: CY + x * Math.sin(TILT) + y * Math.cos(TILT) };
};
const P0 = pt(START);
const P1 = pt(START + Math.PI);
const D = (TILT * 180) / Math.PI;
const RING = `M${P0.x} ${P0.y} A${RX} ${RY} ${D} 0 1 ${P1.x} ${P1.y} A${RX} ${RY} ${D} 0 1 ${P0.x} ${P0.y}`;

const BLADES = 7;

/**
 * Intro del logo (una vez por sesión, ~3 s, se salta con un clic):
 * 1. Se enciende un cielo de estrellas que se acerca despacio.
 * 2. Nace la estrella con un destello de lente y un cometa dibuja la órbita; al terminar se queda como la luna.
 * 3. ASTOR entra letra por letra, desenfocada y muy espaciada, y se enfoca mientras se junta.
 * 4. Un diafragma de cámara (7 hojas) se cierra sobre el logo y se abre ya sobre el sitio: el "clic".
 * Va en el HTML prerenderizado para tapar la página desde el primer cuadro; index.html la oculta si ya se vio.
 */
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!gone()) {
      <div class="intro" (click)="skip()" aria-hidden="true">
        <canvas class="sky"></canvas>
        <div class="mark">
          <svg class="orbit" viewBox="0 0 400 140">
            <path class="ring" [attr.d]="ring" pathLength="1" />
            <circle class="comet-tail" r="9" />
            <circle class="comet" r="3.2" />
          </svg>
          <div class="star-wrap">
            <span class="streak"></span>
            <span class="streak v"></span>
            <svg class="star" viewBox="0 0 24 24"><path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" /></svg>
          </div>
          <p class="word">@for (c of letters; track $index) {<span>{{ c }}</span>}</p>
          <p class="sub"><i></i><span>Fotografía de bodas y eventos · Aguascalientes</span><i></i></p>
        </div>
        <canvas class="iris"></canvas>
      </div>
    }
  `,
  styles: `
    .intro { position: fixed; inset: 0; z-index: var(--z-intro); display: grid; place-items: center; background: var(--color-night); color: var(--color-on-night); cursor: pointer; overflow: hidden; }
    :host-context(.no-intro) .intro { display: none; }
    .sky, .iris { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .sky { opacity: 0; }
    .mark { position: relative; display: grid; justify-items: center; gap: 18px; }
    .orbit { position: absolute; left: 50%; top: 40%; width: min(88vw, 600px); translate: -50% -50%; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1; }
    .ring { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0.55; }
    .comet { fill: #fff; stroke: none; opacity: 0; filter: drop-shadow(0 0 6px #fff); }
    .comet-tail { fill: var(--color-accent-soft); stroke: none; opacity: 0; filter: blur(6px); }
    .star-wrap { position: absolute; left: 50%; top: -34px; width: 34px; height: 34px; margin-left: -17px; }
    .star { position: absolute; inset: 0; fill: #fff; filter: drop-shadow(0 0 16px rgb(255 255 255 / 80%)); scale: 0; }
    .streak { position: absolute; left: 50%; top: 50%; width: min(70vw, 520px); height: 1px; translate: -50% -50%; background: linear-gradient(90deg, transparent, rgb(255 255 255 / 90%) 48% 52%, transparent); scale: 0 1; opacity: 0; }
    .streak.v { width: 1px; height: 160px; background: linear-gradient(180deg, transparent, rgb(255 255 255 / 70%) 48% 52%, transparent); scale: 1 0; }
    .word { display: flex; font-family: var(--font-display); font-size: clamp(3.8rem, 14vw, 8.4rem); letter-spacing: 0.5em; line-height: 1.05; padding-inline: 0.1em; margin-right: -0.5em; }
    .word span { display: inline-block; opacity: 0; filter: blur(14px); translate: 0 0.35em; }
    .sub { display: flex; align-items: center; gap: 14px; font-family: var(--font-label); font-size: 0.68rem; letter-spacing: 0.34em; text-transform: uppercase; color: var(--color-on-night-2); }
    .sub span { opacity: 0; }
    .sub i { width: 46px; height: 1px; background: currentColor; scale: 0 1; }
    .sub i:first-child { transform-origin: right; }
    .sub i:last-child { transform-origin: left; }
    @media (max-width: 600px) { .sub { font-size: 0.56rem; letter-spacing: 0.22em; } .sub i { width: 18px; } }
  `,
})
export class Intro {
  protected readonly letters = [...'ASTOR'];
  protected readonly ring = RING;
  protected readonly gone = signal(false);
  private readonly motion = inject(Motion);
  private tl?: { progress(n: number): void; kill(): void };
  private raf = 0;

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
      const sky = this.startSky(q('.sky')[0] as HTMLCanvasElement);
      const iris = this.makeIris(q('.iris')[0] as HTMLCanvasElement);
      const comet = host.querySelector('.comet') as SVGCircleElement;
      const tail = host.querySelector('.comet-tail') as SVGCircleElement;
      const orbit = { p: 0 };
      const moveComet = () => {
        const t = START + orbit.p * Math.PI * 2;
        const p = pt(t);
        const back = pt(t - 0.18);
        comet.setAttribute('cx', String(p.x));
        comet.setAttribute('cy', String(p.y));
        tail.setAttribute('cx', String(back.x));
        tail.setAttribute('cy', String(back.y));
        comet.setAttribute('r', String(3.2 + Math.sin(t) * 1.1));
      };
      moveComet();
      const shutter = { k: 0 };

      const tl = gsap.timeline({ onComplete: () => this.finish() });
      tl.to(q('.sky'), { opacity: 1, duration: 0.9, ease: 'power1.out' }, 0)
        // La estrella nace con su destello.
        .to(q('.streak:not(.v)'), { scaleX: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0.2)
        .to(q('.streak.v'), { scaleY: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0.26)
        .to(q('.streak'), { opacity: 0, duration: 0.7, ease: 'power2.in' }, 0.6)
        .to(q('.star'), { scale: 1, rotation: 270, duration: 1.2, ease: 'expo.out' }, 0.2)
        // El cometa dibuja la órbita y se queda como luna.
        .to([comet, tail], { opacity: 1, duration: 0.2 }, 0.4)
        .to(orbit, { p: 1, duration: 1.45, ease: 'power2.inOut', onUpdate: moveComet }, 0.4)
        .to(q('.ring'), { strokeDashoffset: 0, duration: 1.45, ease: 'power2.inOut' }, 0.4)
        .to(tail, { opacity: 0, duration: 0.3 }, 1.7)
        .to(comet, { attr: { r: 4 }, duration: 0.3 }, 1.75)
        // ASTOR se enfoca mientras se junta.
        .to(q('.word'), { letterSpacing: '0.08em', marginRight: '-0.08em', duration: 1.6, ease: 'expo.out' }, 0.55)
        .to(q('.word span'), { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, 0.55)
        .to(q('.sub i'), { scaleX: 1, duration: 0.8, ease: 'expo.out' }, 1.45)
        .to(q('.sub span'), { opacity: 1, duration: 0.7 }, 1.55)
        // Clic: el diafragma se cierra sobre el logo y se abre sobre el sitio.
        .to(shutter, { k: 1, duration: 0.42, ease: 'power3.in', onUpdate: () => iris(shutter.k) }, 2.55)
        .call(() => {
          gsap.set(q('.mark, .sky'), { opacity: 0 });
          gsap.set(q('.intro'), { backgroundColor: 'transparent' });
          cancelAnimationFrame(sky);
          this.release();
        }, [], 2.97)
        .to(shutter, { k: 0, duration: 0.9, ease: 'expo.out', onUpdate: () => iris(shutter.k) }, 3.02);
      this.tl = tl;
    });
  }

  protected skip() {
    this.tl?.progress(1);
  }

  /** Cielo: estrellas finas que titilan y se acercan despacio desde el centro. */
  private startSky(canvas: HTMLCanvasElement) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth;
    const h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const stars = Array.from({ length: Math.round((w * h) / 5200) }, () => ({
      a: Math.random() * Math.PI * 2,
      d: Math.random() ** 0.7,
      s: Math.random() * 1.1 + 0.25,
      ph: Math.random() * 6.28,
      sp: Math.random() * 2 + 1,
    }));
    const t0 = performance.now();
    const R = Math.hypot(w, h) * 0.6;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const zoom = 1 + t * 0.05;
      for (const s of stars) {
        const r = s.d * R * zoom;
        const x = w / 2 + Math.cos(s.a) * r;
        const y = h / 2 + Math.sin(s.a) * r * 0.8;
        const tw = 0.45 + 0.55 * Math.sin(s.ph + t * s.sp);
        ctx.globalAlpha = Math.max(0, tw) * (0.25 + s.d * 0.75);
        ctx.fillStyle = '#e9ecf3';
        ctx.beginPath();
        ctx.arc(x, y, s.s * (0.8 + t * 0.06), 0, 6.283);
        ctx.fill();
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
    return this.raf;
  }

  /**
   * Diafragma de 7 hojas dibujado en canvas. k = 0 abierto (no se ve), k = 1 cerrado.
   * El hueco es un polígono que gira al cerrarse; cada hoja va de un vértice hacia afuera, con su propio tono.
   */
  private makeIris(canvas: HTMLCanvasElement) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth;
    const h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const cx = w / 2;
    const cy = h / 2;
    const far = Math.hypot(w, h);
    return (k: number) => {
      ctx.clearRect(0, 0, w, h);
      if (k <= 0.001) return;
      const r = (1 - k) * far * 0.62;
      const twist = k * 1.1;
      const vs = Array.from({ length: BLADES }, (_, i) => {
        const a = (i / BLADES) * Math.PI * 2 + twist;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
      });
      // Las hojas: todo lo que queda fuera del hueco, con un degradado metálico oscuro.
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      vs.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
      ctx.closePath();
      const g = ctx.createRadialGradient(cx, cy, r, cx, cy, Math.max(r + 1, far * 0.7));
      g.addColorStop(0, '#1b2337');
      g.addColorStop(0.25, '#0f1526');
      g.addColorStop(1, '#04060c');
      ctx.fillStyle = g;
      ctx.fill('evenodd');
      // Cada hoja: un brillo que arranca en su vértice y su orilla (la línea donde se encima con la siguiente).
      for (const v of vs) {
        const ta = v.a + Math.PI / 2 - 0.45;
        const ex = v.x + Math.cos(ta) * far;
        const ey = v.y + Math.sin(ta) * far;
        const sheen = ctx.createLinearGradient(v.x, v.y, v.x + Math.cos(ta) * far * 0.45, v.y + Math.sin(ta) * far * 0.45);
        sheen.addColorStop(0, 'rgb(233 236 243 / 34%)');
        sheen.addColorStop(1, 'rgb(233 236 243 / 0%)');
        ctx.strokeStyle = sheen;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // Sombra suave del lado de afuera de la orilla: da el volumen de la hoja encimada.
        const na = ta - 0.12;
        ctx.fillStyle = 'rgb(0 0 0 / 22%)';
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(ex, ey);
        ctx.lineTo(v.x + Math.cos(na) * far, v.y + Math.sin(na) * far);
        ctx.closePath();
        ctx.fill();
      }
    };
  }

  private released = false;
  private release() {
    if (this.released) return;
    this.released = true;
    this.motion.unlock();
    this.motion.introDone.set(true);
  }

  private finish() {
    cancelAnimationFrame(this.raf);
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
