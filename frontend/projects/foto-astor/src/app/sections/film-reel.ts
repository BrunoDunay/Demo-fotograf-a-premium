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
import { ALL_VIDEOS, videoPoster, videoSrc } from '../core/media';
import { Motion, isNarrow, prefersReducedMotion } from '../core/motion';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Viewer, ViewerItem } from '../shared/viewer';

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  video: number;
}

/**
 * Rollo de la temporada: columnas de película que corren hacia arriba y hacia abajo, con un video distinto
 * en cada cuadro (como la referencia del carrete que proyecta). Todo se dibuja en un solo canvas: los videos
 * se decodifican una vez y se reparten en muchos cuadros. Se puede alternar color / blanco y negro; con el
 * cursor encima, el cuadro recupera el color y al tocarlo se abre el video completo.
 */
@Component({
  selector: 'app-film-reel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, Icon, Viewer],
  template: `
    <section class="reel on-night" aria-labelledby="reel-title">
      <div class="container head">
        <div class="copy">
          <p class="label kicker" data-reveal>En movimiento</p>
          <h2 id="reel-title" class="title" data-reveal>Lo que se mueve <em>también se recuerda</em></h2>
          <p class="lead" data-reveal>
            Además de las fotos, grabo clips cortos del día: el vals, las bengalas, la salida de la iglesia. Con ellos
            armo un video resumen de tres minutos. Toca cualquier cuadro para verlo completo.
          </p>
        </div>
        <div class="switch" role="radiogroup" aria-label="Color del rollo" data-reveal>
          <button type="button" role="radio" [attr.aria-checked]="!color()" (click)="setColor(false)">Blanco y negro</button>
          <button type="button" role="radio" [attr.aria-checked]="color()" (click)="setColor(true)">Color</button>
          <span class="thumb" [class.right]="color()" aria-hidden="true"></span>
        </div>
      </div>

      <div class="stage" (pointermove)="hover($event)" (pointerleave)="leave()" (click)="open($event)" [class.pointer]="hovered() !== null">
        <canvas class="film" [class.gray]="!color()" aria-hidden="true"></canvas>
        <canvas class="lit" aria-hidden="true"></canvas>
        <div class="fade top" aria-hidden="true"></div>
        <div class="fade bottom" aria-hidden="true"></div>
        <ul class="sr">
          @for (v of videos; track v.name; let i = $index) {
            <li><button type="button" (click)="index.set(i)">Ver video: {{ v.alt }}</button></li>
          }
        </ul>
      </div>
      <div class="decoders" aria-hidden="true">
        @for (v of active(); track v.name) {
          <video [src]="vsrc(v)" muted loop playsinline preload="auto" [attr.data-name]="v.name"></video>
        }
      </div>
      <p class="container foot label">
        <app-icon name="play" [size]="12" />
        {{ videos.length }} clips de la temporada 2025 · rollo Astor 400
      </p>
    </section>
    <app-viewer [items]="items" [(index)]="index" tone="night" />
  `,
  styles: `
    .reel { position: relative; padding-block: var(--space-section) 48px; overflow: hidden; }
    .head { position: relative; z-index: 2; display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 28px; }
    .copy { display: grid; gap: 18px; max-width: 640px; }
    .title { font-size: var(--text-2xl); }
    .title em { color: var(--color-accent-soft); }
    .switch { position: relative; display: inline-grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: var(--radius-pill); box-shadow: inset 0 0 0 1px var(--color-line-night); }
    .switch button { position: relative; z-index: 1; min-height: 44px; padding: 0 18px; white-space: nowrap; font-family: var(--font-label); font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-on-night-2); transition: color 300ms ease; }
    .switch button[aria-checked='true'] { color: var(--color-night); }
    .thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: var(--radius-pill); background: var(--color-on-night); transition: translate 500ms var(--ease-out); }
    .thumb.right { translate: 100% 0; }
    .switch button { min-width: 168px; }

    .stage { position: relative; height: clamp(520px, 86vh, 920px); margin-top: 48px; cursor: default; }
    .stage.pointer { cursor: pointer; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    /* El blanco y negro lo hace la tarjeta gráfica sobre todo el canvas (barato); el cuadro iluminado va encima, a color. */
    .film { filter: grayscale(0) contrast(1); transition: filter 900ms var(--ease-out); }
    .film.gray { filter: grayscale(1) contrast(1.08) brightness(0.86); }
    .lit { pointer-events: none; }
    .fade { position: absolute; left: 0; right: 0; height: 22%; pointer-events: none; }
    .fade.top { top: 0; background: linear-gradient(var(--color-night), transparent); }
    .fade.bottom { bottom: 0; background: linear-gradient(transparent, var(--color-night)); }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .decoders { position: absolute; left: 0; bottom: 0; width: 2px; height: 2px; overflow: hidden; opacity: 0.01; pointer-events: none; }
    .decoders video { width: 2px; height: 2px; }
    .foot { position: relative; z-index: 2; display: flex; align-items: center; gap: 10px; color: var(--color-on-night-2); }

    @media (max-width: 640px) {
      .switch { width: 100%; }
      .switch button { min-width: 0; padding: 0 8px; }
      .stage { height: 78svh; margin-top: 28px; }
    }
  `,
})
export class FilmReel {
  protected readonly videos = ALL_VIDEOS;
  protected readonly color = signal(false);
  protected readonly hovered = signal<number | null>(null);
  protected readonly index = signal<number | null>(null);
  /** Videos que se decodifican a la vez (se reparten en todos los cuadros): menos en celular. */
  protected readonly narrow = signal(false);
  protected readonly active = computed(() => this.videos.slice(0, this.narrow() ? 6 : 10));
  protected readonly items: ViewerItem[] = ALL_VIDEOS.map((v) => ({
    kind: 'video',
    src: videoSrc(v),
    alt: v.alt,
    caption: v.alt,
    meta: 'Clip de la temporada',
    ratio: 4 / 3,
  }));
  protected readonly vsrc = (v: (typeof ALL_VIDEOS)[number]) => videoSrc(v, true);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(Motion);
  private slots: Slot[] = [];
  private pointer: { x: number; y: number } | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.narrow.set(isNarrow());
      // Esperar a que Angular pinte los <video> según el ancho.
      requestAnimationFrame(() => this.start(destroyRef));
    });
  }

  protected setColor(on: boolean) {
    this.color.set(on);
  }

  private start(destroyRef: DestroyRef) {
    const stage = this.host.querySelector<HTMLElement>('.stage')!;
    const canvas = stage.querySelector<HTMLCanvasElement>('canvas.film')!;
    const litCanvas = stage.querySelector<HTMLCanvasElement>('canvas.lit')!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const lit = litCanvas.getContext('2d')!;
    const vids = [...this.host.querySelectorAll<HTMLVideoElement>('.decoders video')];
    const posters = this.active().map((v) => {
      const img = new Image();
      img.src = videoPoster(v);
      return img;
    });
    const reduced = prefersReducedMotion();
    const n = vids.length;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let cols = 6;
    const resize = () => {
      const r = stage.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.25);
      W = r.width;
      H = r.height;
      canvas.width = litCanvas.width = Math.round(W * dpr);
      canvas.height = litCanvas.height = Math.round(H * dpr);
      cols = W < 640 ? 3 : W < 1000 ? 4 : W < 1400 ? 5 : 6;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // Cada columna: desfase inicial, velocidad y sentido propios.
    const lanes = Array.from({ length: 8 }, (_, i) => ({
      offset: Math.random() * 1000,
      // px por milisegundo: entre 26 y 44 px por segundo, despacio para poder ver cada clip.
      speed: (0.026 + (i % 3) * 0.009) * (i % 2 ? -1 : 1),
    }));
    const glow = new Map<string, { a: number; t: number }>();
    let nextGlow = 0;

    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      for (const v of vids) {
        if (visible) v.play().catch(() => {});
        else v.pause();
      }
    }, { rootMargin: '120px' });
    io.observe(stage);

    const TILT = (-7 * Math.PI) / 180;
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const dt = Math.min(50, now - last);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lit.setTransform(dpr, 0, 0, dpr, 0, 0);
      lit.clearRect(0, 0, W, H);
      lit.save();
      lit.translate(W / 2, H / 2);
      lit.rotate(TILT);
      ctx.fillStyle = '#070b16';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      // Película inclinada y más grande que el escenario para que nunca se vean las puntas.
      ctx.translate(W / 2, H / 2);
      ctx.rotate(TILT);
      const span = W * 1.3;
      const laneW = span / cols;
      const stripW = laneW * 0.86;
      const frameW = stripW * 0.74;
      const frameH = frameW * 0.75;
      const pitch = frameH + frameW * 0.1;
      // El scroll empuja un poco el rollo (suave, sin que corra).
      const boost = reduced ? 0 : Math.min(1.2, Math.abs(this.motion.velocity) * 0.02);
      this.slots = [];
      const cos = Math.cos(TILT);
      const sin = Math.sin(TILT);

      for (let c = 0; c < cols; c++) {
        const lane = lanes[c];
        if (!reduced) lane.offset += lane.speed * (1 + boost) * dt;
        const cx = -span / 2 + laneW * (c + 0.5);
        const x0 = cx - stripW / 2;
        const top = -H * 0.75;
        const bottom = H * 0.75;
        // Base de la película.
        ctx.fillStyle = '#10131b';
        ctx.fillRect(x0, top, stripW, bottom - top);
        // Perforaciones a los lados.
        const holeW = stripW * 0.06;
        const holeH = holeW * 1.3;
        const holePitch = holeH * 2.1;
        const holeOff = ((lane.offset % holePitch) + holePitch) % holePitch;
        ctx.fillStyle = '#272b36';
        for (let y = top - holePitch + holeOff; y < bottom; y += holePitch) {
          ctx.fillRect(x0 + stripW * 0.035, y, holeW, holeH);
          ctx.fillRect(x0 + stripW - stripW * 0.035 - holeW, y, holeW, holeH);
        }
        // Cuadros con video.
        const fOff = ((lane.offset % pitch) + pitch) % pitch;
        const firstK = Math.floor(lane.offset / pitch);
        let k = 0;
        for (let y = top - pitch + fOff; y < bottom; y += pitch, k++) {
          const fx = cx - frameW / 2;
          const idx = ((((c * 5 + (k - firstK) * 3) % n) + n) % n);
          const v = vids[idx];
          const src: CanvasImageSource | null = v && v.readyState >= 2 ? v : posters[idx]?.complete ? posters[idx] : null;
          // Centro del cuadro en coordenadas de pantalla (para el cursor).
          const sx = W / 2 + (cx * cos - (y + frameH / 2) * sin);
          const sy = H / 2 + (cx * sin + (y + frameH / 2) * cos);
          this.slots.push({ x: sx, y: sy, w: frameW, h: frameH, video: idx });
          const key = `${c}:${k - firstK}`;
          const isHover = this.pointer !== null && this.hit(this.pointer, sx, sy, frameW, frameH, cos, sin);
          if (isHover && this.hovered() !== idx) this.hovered.set(idx);
          const g = glow.get(key);
          const light = Math.max(isHover ? 1 : 0, g ? g.a : 0);
          if (src) ctx.drawImage(src, fx, y, frameW, frameH);
          else {
            ctx.fillStyle = '#1b1f2a';
            ctx.fillRect(fx, y, frameW, frameH);
          }
          if (light > 0.01 && src) {
            // Mesa de luz: halo detrás y el cuadro a color encima (en la capa sin filtro).
            const grad = lit.createRadialGradient(cx, y + frameH / 2, frameW * 0.2, cx, y + frameH / 2, frameW * 0.95);
            grad.addColorStop(0, `rgba(255,246,240,${0.26 * light})`);
            grad.addColorStop(1, 'rgba(255,246,240,0)');
            lit.fillStyle = grad;
            lit.fillRect(cx - frameW, y - frameH * 0.5, frameW * 2, frameH * 2);
            lit.globalAlpha = light;
            lit.drawImage(src, fx, y, frameW, frameH);
            lit.globalAlpha = 1;
          }
          // Número de cuadro y marca de la película en el borde.
          ctx.fillStyle = 'rgba(236,174,92,0.75)';
          ctx.font = `500 ${Math.max(8, stripW * 0.035)}px "Instrument Sans Variable", sans-serif`;
          ctx.fillText(`${((k - firstK) * 3 + c * 7 + 400) % 36 || 36}A`, fx, y - stripW * 0.02);
          if ((k - firstK + c) % 4 === 0) {
            ctx.fillStyle = 'rgba(236,232,225,0.35)';
            ctx.fillText('ASTOR 400', fx + frameW * 0.62, y - stripW * 0.02);
          }
        }
      }
      ctx.restore();
      lit.restore();

      // Cada tanto se ilumina un cuadro al azar, como en la mesa de luz de la referencia.
      if (now > nextGlow && !reduced) {
        nextGlow = now + 900 + Math.random() * 1400;
        const c = Math.floor(Math.random() * cols);
        const k = Math.floor(Math.random() * 4) - 1;
        glow.set(`${c}:${k}`, { a: 0, t: now });
      }
      for (const [key, g] of glow) {
        const age = (now - g.t) / 1000;
        g.a = age < 0.8 ? age / 0.8 : age < 2.6 ? 1 : Math.max(0, 1 - (age - 2.6) / 1.2);
        if (age > 3.8) glow.delete(key);
      }
    };
    raf = requestAnimationFrame(draw);

    destroyRef.onDestroy(() => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      for (const v of vids) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    });
  }

  /** ¿El punto cae dentro del cuadro inclinado? */
  private hit(p: { x: number; y: number }, cx: number, cy: number, w: number, h: number, cos: number, sin: number) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const lx = dx * cos + dy * sin;
    const ly = -dx * sin + dy * cos;
    return Math.abs(lx) < w / 2 && Math.abs(ly) < h / 2;
  }

  protected hover(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    const cos = Math.cos((-7 * Math.PI) / 180);
    const sin = Math.sin((-7 * Math.PI) / 180);
    if (!this.slots.some((s) => this.hit(this.pointer!, s.x, s.y, s.w, s.h, cos, sin))) this.hovered.set(null);
  }

  protected leave() {
    this.pointer = null;
    this.hovered.set(null);
  }

  protected open(e: MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const cos = Math.cos((-7 * Math.PI) / 180);
    const sin = Math.sin((-7 * Math.PI) / 180);
    const slot = this.slots.find((s) => this.hit(p, s.x, s.y, s.w, s.h, cos, sin));
    if (!slot) return;
    // El índice del decodificador coincide con el de la lista completa (en celular es un subconjunto inicial).
    this.index.set(slot.video);
  }
}
