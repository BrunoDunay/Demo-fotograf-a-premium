import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { BRAND } from '../core/content';
import { hasFinePointer, prefersReducedMotion } from '../core/motion';
import { Icon } from '../shared/icon';

const LAYERS = 8;

/**
 * Tarjeta de presentación en 3D: algodón de 600 g con letras hundidas (letterpress), estrella y órbita en foil
 * plateado y cantos pintados de negro. Se gira libre arrastrándola (con inercia), se voltea con doble toque o
 * con el botón y, quieta, se acomoda sola mostrando la cara más cercana. El foil brilla según el ángulo.
 */
@Component({
  selector: 'app-business-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="scene"
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up($event)"
      (pointercancel)="up($event)"
      (pointerleave)="leave()"
      (dblclick)="flip()"
      role="img"
      [attr.aria-label]="'Tarjeta de presentación de ' + brand.person + '. Arrástrala para girarla.'"
    >
      <div class="card">
        @for (l of layers; track l) {
          <span class="edge" [style.transform]="'translateZ(' + (l * 0.5 - 1.75) + 'px)'"></span>
        }
        <div class="face front">
          <svg class="emboss" viewBox="0 0 350 200" aria-hidden="true">
            <ellipse cx="175" cy="100" rx="150" ry="52" transform="rotate(-9 175 100)" class="hi" />
            <ellipse cx="175" cy="100" rx="150" ry="52" transform="rotate(-9 175 100)" class="lo" />
          </svg>
          <svg class="foil orbit" viewBox="0 0 350 200" aria-hidden="true">
            <ellipse cx="175" cy="100" rx="128" ry="34" transform="rotate(-9 175 100)" />
            <circle cx="296" cy="72" r="2.6" />
          </svg>
          <svg class="foil star" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" />
          </svg>
          <p class="mark">ASTOR</p>
          <p class="tag">Fotografía · Aguascalientes</p>
          <span class="light"></span>
        </div>
        <div class="face back">
          <svg class="ink" viewBox="0 0 160 200" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
            <circle cx="70" cy="96" r="54" class="wash" />
            <path class="brush" d="M-10 150 C 30 120, 60 70, 120 40 C 140 30, 150 34, 132 50 C 90 86, 60 130, 20 176 Z" />
            <path class="brush thin" d="M10 190 C 40 150, 80 120, 150 104 C 160 102, 160 108, 150 112 C 96 130, 60 160, 30 200 Z" />
            <ellipse class="foil-line" cx="80" cy="110" rx="70" ry="20" transform="rotate(-20 80 110)" />
          </svg>
          <div class="details">
            <p class="who">{{ brand.person }}</p>
            <p class="role">Fotógrafo · Bodas y eventos</p>
            <span class="rule"></span>
            <p>{{ brand.web }}</p>
            <p>{{ brand.instagram }}</p>
            <p>{{ brand.email }}</p>
            <p>{{ brand.phone }}</p>
            <p>{{ brand.city }}, Ags.</p>
          </div>
          <p class="foot">Bodas <span class="spark">✦</span> XV años <span class="spark">✦</span> Eventos</p>
          <span class="light"></span>
        </div>
      </div>
      <span class="ground"></span>
    </div>
    <div class="controls">
      <button type="button" class="btn btn-line" (click)="flip()"><app-icon name="flip" [size]="16" /> Voltear</button>
      <p class="label hint"><app-icon name="drag" [size]="15" /> Arrástrala para verla de lado</p>
    </div>
    <p class="specs label">Algodón 600 g · letterpress · foil plata · cantos pintados</p>
  `,
  styles: `
    :host { display: grid; justify-items: center; gap: 18px; }
    .scene { position: relative; display: grid; place-items: center; width: min(420px, 88vw); aspect-ratio: 1.25; perspective: 1100px; cursor: grab; touch-action: pan-y; -webkit-user-select: none; user-select: none; }
    .scene:active { cursor: grabbing; }
    .card { --sx: 50%; --sy: 30%; --sheen: 50%; position: relative; width: min(360px, 80vw); aspect-ratio: 1.75; transform-style: preserve-3d; will-change: transform; }
    .edge, .face { position: absolute; inset: 0; border-radius: 9px; }
    .edge { background: #1c1b19; }
    .face { overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; background-color: #f3f0e9; color: #1e1d1b;
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='8'/%3E%3CfeColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.42 0 0 0 0 0.36 0 0 0 0.22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E"),
        radial-gradient(120% 90% at 30% 20%, #f8f6f1, #ebe7de);
      box-shadow: inset 0 0 0 1px rgb(255 255 255 / 40%), inset 0 0 22px rgb(120 110 95 / 16%);
    }
    .front { transform: translateZ(2px); }
    .back { transform: rotateY(180deg) translateZ(2px); }

    /* Letterpress: tinta hundida en el papel. */
    .mark { position: absolute; left: 0; right: 0; top: 37%; text-align: center; font-family: var(--font-display); font-variation-settings: 'opsz' 96; font-size: clamp(2rem, 9vw, 2.9rem); letter-spacing: 0.12em; line-height: 1; color: #1c1b19; text-shadow: 0 1px 0 rgb(255 255 255 / 75%), 0 -1px 0 rgb(0 0 0 / 18%); }
    .tag { position: absolute; left: 0; right: 0; bottom: 15%; text-align: center; font-family: var(--font-label); font-size: clamp(0.5rem, 2vw, 0.62rem); letter-spacing: 0.42em; text-transform: uppercase; color: #3b3935; text-shadow: 0 1px 0 rgb(255 255 255 / 70%); }
    /* Golpe en seco (sin tinta): una órbita grande apenas marcada. */
    .emboss { position: absolute; inset: 0; width: 100%; height: 100%; fill: none; }
    .emboss .hi { stroke: rgb(255 255 255 / 85%); stroke-width: 2.2; transform: translate(0.8px, 1px); }
    .emboss .lo { stroke: rgb(110 100 85 / 30%); stroke-width: 1.6; }
    /* Foil plata: brillo que corre con el ángulo de la tarjeta. */
    .foil { position: absolute; overflow: visible; filter: brightness(var(--foilb, 1)) drop-shadow(0 0 0.6px rgb(255 255 255 / 80%)); }
    .orbit { inset: 0; width: 100%; height: 100%; fill: none; stroke: #a9a7a2; stroke-width: 1.1; }
    .orbit circle { fill: #b9b7b2; stroke: none; }
    .star { left: 22%; top: 18%; width: 9%; aspect-ratio: 1; }
    .star path { fill: #b9b7b2; }
    .foil-line { filter: brightness(var(--foilb, 1)); }
    .light { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: soft-light; background: radial-gradient(circle at var(--sx) var(--sy), rgb(255 255 255 / 85%), transparent 46%); }
    .light::after { content: ''; position: absolute; inset: 0; mix-blend-mode: screen; opacity: 0.35; background: linear-gradient(115deg, transparent calc(var(--sheen) - 18%), rgb(255 255 255 / 55%) var(--sheen), transparent calc(var(--sheen) + 18%)); }

    .ink { position: absolute; left: 0; top: 0; width: 44%; height: 100%; }
    .wash { fill: rgb(60 58 54 / 16%); }
    .brush { fill: #1d1c1a; opacity: 0.88; }
    .brush.thin { opacity: 0.55; }
    .foil-line { fill: none; stroke: #c9c7c1; stroke-width: 1; }
    .details { position: absolute; left: 47%; right: 7%; top: 13%; display: grid; gap: 2px; font-family: var(--font-label); font-size: clamp(0.5rem, 2.2vw, 0.68rem); letter-spacing: 0.14em; text-transform: uppercase; color: #2a2926; text-shadow: 0 1px 0 rgb(255 255 255 / 70%); }
    .who { font-family: var(--font-display); font-variation-settings: 'opsz' 40; font-size: clamp(1rem, 4.4vw, 1.35rem); letter-spacing: 0.06em; text-transform: none; color: #1c1b19; }
    .role { font-size: 0.86em; letter-spacing: 0.22em; color: #6b6760; }
    .rule { width: 26px; height: 1px; margin: 7px 0 6px; background: #b9b7b2; }
    .foot { position: absolute; left: 47%; right: 7%; bottom: 9%; font-family: var(--font-label); font-size: clamp(0.4rem, 1.6vw, 0.5rem); letter-spacing: 0.3em; text-transform: uppercase; color: #8a867e; }
    .spark { color: #b9b7b2; }
    .ground { position: absolute; left: 18%; right: 18%; bottom: 4%; height: 22px; border-radius: 50%; background: radial-gradient(closest-side, rgb(30 22 12 / 30%), transparent); filter: blur(4px); will-change: transform; }

    .controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 20px; }
    .controls .btn { min-height: 44px; padding: 0 18px; font-size: 0.68rem; }
    .hint { display: inline-flex; align-items: center; gap: 8px; color: var(--color-muted); }
    .specs { color: var(--color-muted); font-size: 0.6rem; text-align: center; }
  `,
})
export class BusinessCard {
  protected readonly brand = BRAND;
  protected readonly layers = Array.from({ length: LAYERS }, (_, i) => i);
  protected readonly dragging = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // Estado: giro actual (grados), velocidad y objetivo de inclinación por cursor.
  private ry = -18;
  private rx = 8;
  private vy = 0;
  private vx = 0;
  private hoverX = 0;
  private hoverY = 0;
  private drag: { x: number; y: number; t: number; id: number } | null = null;
  private lastInput = 0;
  private flipTo: number | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const card = this.host.querySelector<HTMLElement>('.card')!;
      const ground = this.host.querySelector<HTMLElement>('.ground')!;
      const reduced = prefersReducedMotion();
      let raf = 0;
      let prev = performance.now();
      let t = 0;
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(this.host);
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.033, (now - prev) / 1000);
        prev = now;
        if (!visible) return;
        t += dt;
        if (!this.drag) {
          // Inercia que se apaga.
          this.ry += this.vy * dt;
          this.rx += this.vx * dt;
          this.vy *= Math.pow(0.12, dt);
          this.vx *= Math.pow(0.12, dt);
          const idle = now - this.lastInput > 1400 && Math.abs(this.vy) < 20;
          if (this.flipTo !== null) {
            this.ry += (this.flipTo - this.ry) * Math.min(1, dt * 6);
            this.rx += (0 - this.rx) * Math.min(1, dt * 6);
            if (Math.abs(this.flipTo - this.ry) < 0.3) this.flipTo = null;
          } else if (idle) {
            // Quieta, se acomoda en la cara más cercana y se mece despacio.
            const face = Math.round(this.ry / 180) * 180;
            const sway = reduced ? 0 : Math.sin(t * 0.6) * 12 + this.hoverX * 16;
            const tilt = reduced ? 0 : Math.cos(t * 0.45) * 5 - this.hoverY * 10;
            this.ry += (face + sway - this.ry) * Math.min(1, dt * 2.2);
            this.rx += (tilt - this.rx) * Math.min(1, dt * 2.2);
          }
        }
        this.rx = Math.max(-70, Math.min(70, this.rx));
        card.style.transform = `rotateX(${this.rx.toFixed(2)}deg) rotateY(${this.ry.toFixed(2)}deg)`;
        // Luz y foil según el ángulo.
        const ny = ((((this.ry % 360) + 540) % 360) - 180) / 180; // -1..1
        card.style.setProperty('--sheen', `${(50 + Math.sin((this.ry * Math.PI) / 180) * 45 + this.rx * 0.6).toFixed(1)}%`);
        card.style.setProperty('--sx', `${(50 - ny * 60).toFixed(1)}%`);
        card.style.setProperty('--sy', `${(30 + this.rx * 0.8).toFixed(1)}%`);
        // El foil destella cuando la tarjeta pasa por cierto ángulo, como el metal real.
        const glint = Math.pow(Math.max(0, Math.cos(((this.ry % 180) + this.rx - 20) * (Math.PI / 90))), 6);
        card.style.setProperty('--foilb', (0.9 + glint * 0.75).toFixed(3));
        const c = Math.abs(Math.cos((this.ry * Math.PI) / 180));
        ground.style.transform = `scaleX(${(0.35 + c * 0.65).toFixed(3)}) translateY(${(this.rx * 0.3).toFixed(1)}px)`;
      };
      raf = requestAnimationFrame(tick);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        io.disconnect();
      });
    });
  }

  protected down(e: PointerEvent) {
    if (e.button > 0) return;
    this.drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    this.flipTo = null;
    this.vx = this.vy = 0;
    this.lastInput = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.dragging.set(true);
  }

  protected move(e: PointerEvent) {
    const now = performance.now();
    if (this.drag && e.pointerId === this.drag.id) {
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      const dt = Math.max(1, now - this.drag.t) / 1000;
      this.ry += dx * 0.5;
      this.rx -= dy * 0.4;
      this.vy = (dx * 0.5) / dt;
      this.vx = (-dy * 0.4) / dt;
      this.drag = { ...this.drag, x: e.clientX, y: e.clientY, t: now };
      this.lastInput = now;
      return;
    }
    if (!hasFinePointer()) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoverX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    this.hoverY = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }

  protected up(e: PointerEvent) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.drag = null;
    this.dragging.set(false);
    this.lastInput = performance.now();
    this.vy = Math.max(-900, Math.min(900, this.vy));
    this.vx = Math.max(-500, Math.min(500, this.vx));
  }

  protected leave() {
    this.hoverX = this.hoverY = 0;
  }

  flip() {
    const face = Math.round(this.ry / 180) * 180;
    this.flipTo = face + 180;
    this.vx = this.vy = 0;
    this.lastInput = performance.now();
  }
}
