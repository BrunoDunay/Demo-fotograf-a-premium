import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import { Motion, prefersReducedMotion } from '../core/motion';

// Órbita: elipse con centro (100, 30), radios 96 × 17, inclinada -8°.
const CX = 100;
const CY = 30;
const RX = 96;
const RY = 17;
const TILT = (-8 * Math.PI) / 180;
const REST = -0.62 * Math.PI; // la luna descansa arriba a la derecha

function orbitPoint(t: number) {
  const x = RX * Math.cos(t);
  const y = RY * Math.sin(t);
  return {
    x: CX + x * Math.cos(TILT) - y * Math.sin(TILT),
    y: CY + x * Math.sin(TILT) + y * Math.cos(TILT),
  };
}

const A = orbitPoint(0);
const B = orbitPoint(Math.PI);
const deg = (TILT * 180) / Math.PI;
// Mitad de atrás (tenue, pasa detrás de la palabra) y mitad de enfrente (marcada).
const BACK = `M${B.x.toFixed(2)} ${B.y.toFixed(2)} A${RX} ${RY} ${deg} 0 1 ${A.x.toFixed(2)} ${A.y.toFixed(2)}`;
const FRONT = `M${A.x.toFixed(2)} ${A.y.toFixed(2)} A${RX} ${RY} ${deg} 0 1 ${B.x.toFixed(2)} ${B.y.toFixed(2)}`;

/**
 * Logo de Astor: la palabra con una estrella de cuatro puntas sobre la A y una órbita con su luna.
 * La órbita tiene profundidad: la mitad de atrás pasa detrás de la palabra y la de enfrente por delante;
 * la luna se achica y se apaga cuando va por detrás.
 * - Al aparecer: la órbita se dibuja, las letras suben una por una y la estrella se enciende girando.
 * - Al pasar el cursor: la luna da una vuelta completa, las letras hacen una ola y la estrella destella.
 * - Quieta: la estrella titila cada tanto.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(pointerenter)': 'spin()' },
  template: `
    <span class="logo" [class.compact]="compact()">
      <svg class="orbit back" viewBox="0 0 200 60" aria-hidden="true">
        <path [attr.d]="back" pathLength="1" />
      </svg>
      <span class="word" aria-label="Astor">
        @for (c of letters; track $index) {
          <span class="l" [style.--i]="$index" aria-hidden="true">{{ c }}</span>
        }
      </span>
      <svg class="orbit front" viewBox="0 0 200 60" aria-hidden="true">
        <path [attr.d]="front" pathLength="1" />
        <circle class="moon" r="2.6" [attr.cx]="rest.x" [attr.cy]="rest.y" />
      </svg>
      <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" />
      </svg>
      <span class="flare" aria-hidden="true"></span>
    </span>
  `,
  styles: `
    :host { display: inline-flex; }
    .logo { position: relative; display: inline-flex; align-items: center; padding: 0.15em 0.2em; color: inherit; }
    .word {
      position: relative;
      z-index: 1;
      display: inline-flex;
      font-family: var(--font-display);
      font-size: 1.75em;
      font-weight: 400;
      letter-spacing: 0.06em;
      line-height: 1;
      text-transform: uppercase;
    }
    .l { display: inline-block; transition: translate 700ms var(--ease-spring); transition-delay: calc(var(--i) * 40ms); }
    .orbit {
      position: absolute;
      left: -8%;
      top: 50%;
      width: 116%;
      translate: 0 -50%;
      overflow: visible;
      fill: none;
      stroke: currentColor;
      transition: rotate 1200ms var(--ease-out);
    }
    .orbit path { stroke-dasharray: 1; stroke-dashoffset: 0; }
    .back { z-index: 0; stroke-width: 0.6; opacity: 0.3; }
    .front { z-index: 2; stroke-width: 0.9; opacity: 0.7; }
    .moon { fill: currentColor; stroke: none; }
    .star {
      position: absolute;
      z-index: 3;
      top: -0.1em;
      left: 0.08em;
      width: 0.62em;
      height: 0.62em;
      fill: currentColor;
      animation: twinkle 7s ease-in-out 3s infinite;
      transition: rotate 900ms var(--ease-out), scale 600ms var(--ease-spring);
    }
    /* Destello horizontal (como en un lente) al nacer la estrella y al pasar el cursor. */
    .flare {
      position: absolute;
      z-index: 3;
      top: 0.2em;
      left: 0.39em;
      width: 3.2em;
      height: 1px;
      translate: -50% 0;
      background: linear-gradient(90deg, transparent, currentColor 45% 55%, transparent);
      opacity: 0;
      scale: 0 1;
      pointer-events: none;
    }
    @keyframes twinkle {
      0%, 86%, 100% { scale: 1; rotate: 0deg; }
      90% { scale: 1.35; rotate: 45deg; }
      94% { scale: 0.85; rotate: 90deg; }
    }
    .compact .word { font-size: 1.4em; }

    /* Entrada: con JS el logo empieza "apagado" hasta que el componente le pone .done (al verse). */
    :host-context(.js):host(:not(.done)) .orbit path { stroke-dashoffset: 1; }
    :host-context(.js):host(:not(.done)) .l { translate: 0 0.5em; opacity: 0; filter: blur(4px); }
    :host-context(.js):host(:not(.done)) .star { scale: 0; rotate: -180deg; animation: none; }
    :host-context(.js):host(:not(.done)) .moon { opacity: 0; }
    :host(.in) .orbit path { transition: stroke-dashoffset 1300ms var(--ease-in-out); }
    :host(.in) .back path { transition-delay: 250ms; }
    :host(.in) .l { transition: translate 900ms var(--ease-out), opacity 700ms ease, filter 700ms ease; transition-delay: calc(var(--i) * 70ms + 150ms); }
    :host(.in) .star { transition: rotate 1100ms var(--ease-out) 550ms, scale 700ms var(--ease-spring) 550ms; }
    :host(.in) .moon { transition: opacity 400ms ease 1100ms; }
    :host(.in) .flare { animation: flare 900ms var(--ease-out) 600ms; }
    :host(.spin) .flare { animation: flare 800ms var(--ease-out); }
    :host(.spin) .star { animation: none; rotate: 180deg; scale: 1.4; }
    :host(.spin) .l { translate: 0 -0.12em; }
    @keyframes flare { 0% { opacity: 0; scale: 0 1; } 30% { opacity: 0.9; scale: 1 1; } 100% { opacity: 0; scale: 1.4 1; } }
  `,
})
export class Logo {
  readonly compact = input(false);
  /** Anima la entrada la primera vez que se ve (después de la intro). */
  readonly animate = input(true);
  protected readonly letters = [...'ASTOR'];
  protected readonly back = BACK;
  protected readonly front = FRONT;
  protected readonly rest = orbitPoint(REST);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(Motion);
  private spinning = false;
  private ready = false;

  private play = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      if (this.motion.introDone()) this.play();
    });
    afterNextRender(() => {
      if (!this.animate() || prefersReducedMotion()) {
        this.host.classList.add('done');
        this.ready = true;
        return;
      }
      let seen = false;
      const io = new IntersectionObserver(([e]) => {
        seen = e.isIntersecting;
        play();
      });
      io.observe(this.host);
      const play = (this.play = () => {
        if (!seen || !this.motion.introDone() || this.host.classList.contains('in')) return;
        io.disconnect();
        this.host.classList.add('in');
        requestAnimationFrame(() => requestAnimationFrame(() => this.host.classList.add('done')));
        setTimeout(() => {
          this.host.classList.remove('in');
          this.ready = true;
          this.orbitMoon(1.1);
        }, 1900);
      });
      play();
      destroyRef.onDestroy(() => io.disconnect());
    });
  }

  protected spin() {
    if (!this.ready || this.spinning || prefersReducedMotion()) return;
    this.host.classList.add('spin');
    this.orbitMoon(1.4);
    setTimeout(() => this.host.classList.remove('spin'), 700);
  }

  /** La luna da una vuelta completa a la órbita; por detrás se achica y se apaga. */
  private orbitMoon(seconds: number) {
    const moon = this.host.querySelector<SVGCircleElement>('.moon');
    if (!moon) return;
    this.spinning = true;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / (seconds * 1000));
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const t = REST + e * Math.PI * 2;
      const p = orbitPoint(t);
      const depth = Math.sin(t); // > 0 enfrente, < 0 detrás
      moon.setAttribute('cx', p.x.toFixed(2));
      moon.setAttribute('cy', p.y.toFixed(2));
      moon.setAttribute('r', (2.6 + depth * 0.9).toFixed(2));
      moon.style.opacity = String(0.65 + depth * 0.35);
      if (k < 1) requestAnimationFrame(step);
      else this.spinning = false;
    };
    requestAnimationFrame(step);
  }
}
