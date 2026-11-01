import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { ALL_VIDEOS, videoPoster, videoSrc } from '../core/media';
import { prefersReducedMotion } from '../core/motion';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Viewer, ViewerItem } from '../shared/viewer';

/** Orden del resumen (como se contaría el día) con el tramo que usa cada clip y su tamaño real. */
const CUT: [name: string, seconds: number, w: number, h: number][] = [
  ['ceremonia', 3.4, 960, 540],
  ['velo', 3, 540, 960],
  ['ramo', 2.8, 960, 540],
  ['salida-iglesia', 2, 960, 540],
  ['atardecer', 3.6, 540, 960],
  ['ramo-pasto', 3, 960, 540],
  ['luces-jardin', 3.4, 960, 540],
  ['brindis', 2.8, 540, 960],
  ['vals', 4, 540, 960],
  ['pista-flores', 3.6, 540, 960],
  ['novia-baila', 3.2, 540, 960],
  ['fiesta', 3, 960, 540],
  ['xv-camina', 3.6, 960, 540],
  ['xv-columpio', 3.4, 960, 540],
  ['xv-jardin', 3, 960, 540],
  ['bengalas', 3.4, 960, 406],
  ['fuente-chispas', 4, 540, 960],
];

/** Píxeles por segundo en la línea de tiempo. */
const PX = 64;
const FPS = 30;

interface Clip {
  name: string;
  alt: string;
  start: number;
  dur: number;
  w: number;
  h: number;
}

/**
 * Sala de edición: así arma Astor el video resumen. Arriba, el monitor de programa reproduce el clip que está bajo
 * el cabezal (cada clip completo, sin recortar, sobre un fondo desenfocado de sí mismo). Abajo, la línea de tiempo
 * con pistas de títulos, video y música; el cabezal avanza y la línea se desplaza para seguirlo. Con el cursor
 * encima se "barre" la línea (el monitor muestra ese cuadro); al tocar un clip se abre completo.
 */
@Component({
  selector: 'app-edit-suite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, Icon, Viewer],
  template: `
    <section class="suite on-night" aria-labelledby="suite-title">
      <div class="container head">
        <div class="copy">
          <p class="label kicker" data-reveal>En movimiento</p>
          <h2 id="suite-title" class="title" data-reveal>Lo que se mueve <em>también se recuerda</em></h2>
        </div>
        <p class="lead" data-reveal>
          Además de las fotos, grabo clips cortos del día: el vals, las bengalas, la salida de la iglesia. Con ellos armo
          un video resumen de tres minutos. Pasa el cursor por la línea de tiempo o toca un clip para verlo completo.
        </p>
      </div>

      <div class="container">
        <div class="window" data-reveal>
          <div class="bar">
            <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="label proj">Resumen · Ana &amp; Luis · Hacienda Los Arcos</span>
            <span class="label state" [class.live]="playing()"><i></i>{{ playing() ? 'Reproduciendo' : 'En pausa' }}</span>
          </div>

          <div class="top">
            <aside class="inspector" aria-hidden="true">
              <p class="label h">Clip</p>
              <p class="clip-name">{{ clip().alt }}</p>
              <dl>
                <div><dt>Duración</dt><dd>{{ tc(clip().dur) }}</dd></div>
                <div><dt>Formato</dt><dd>{{ clip().w > clip().h ? 'Horizontal' : 'Vertical' }} · {{ clip().w }}×{{ clip().h }}</dd></div>
                <div><dt>Color</dt><dd>Astor Noche</dd></div>
                <div><dt>Velocidad</dt><dd>{{ clip().name === 'fuente-chispas' ? '50 %' : '100 %' }}</dd></div>
              </dl>
              <p class="label h">Corte</p>
              <p class="cut">{{ current() + 1 }} de {{ clips.length }}</p>
            </aside>

            <div class="monitor">
              <div class="screen" (click)="openCurrent()" role="button" tabindex="0" (keydown.enter)="openCurrent()" [attr.aria-label]="'Ver completo: ' + clip().alt">
                <img class="backdrop" [src]="poster(clip().name)" alt="" aria-hidden="true" />
                <video class="v a" muted playsinline preload="auto" aria-hidden="true"></video>
                <video class="v b" muted playsinline preload="auto" aria-hidden="true"></video>
                <span class="safe" aria-hidden="true"></span>
                <span class="label expand"><app-icon name="expand" [size]="14" /> Ver completo</span>
              </div>
              <div class="transport">
                <span class="tc label" aria-hidden="true">00:00:00:00</span>
                <div class="buttons">
                  <button type="button" (click)="jump(-1)" aria-label="Clip anterior"><app-icon name="skip-back" [size]="16" /></button>
                  <button type="button" class="play" (click)="toggle()" [attr.aria-label]="playing() ? 'Pausar' : 'Reproducir'">
                    <app-icon [name]="playing() ? 'pause' : 'play'" [size]="18" />
                  </button>
                  <button type="button" (click)="jump(1)" aria-label="Clip siguiente"><app-icon name="skip-forward" [size]="16" /></button>
                </div>
                <span class="tc label total" aria-hidden="true">{{ tc(total) }}</span>
              </div>
            </div>
          </div>

          <div class="timeline" (pointermove)="scrub($event)" (pointerleave)="release()" (click)="pickAt($event)">
            <div class="heads" aria-hidden="true">
              <span class="ruler-h"></span>
              <span class="label">V2</span>
              <span class="label">V1</span>
              <span class="label">A1</span>
            </div>
            <div class="view">
              <div class="lanes" [style.width.px]="total * px + 400">
                <div class="ruler" aria-hidden="true">
                  @for (s of ticks; track s) {
                    <span class="tick" [class.major]="s % 5 === 0" [style.left.px]="s * px">
                      @if (s % 5 === 0) {
                        <i>{{ tc(s, false) }}</i>
                      }
                    </span>
                  }
                </div>
                <div class="lane v2" aria-hidden="true">
                  @for (t of titles; track t.label) {
                    <span class="title-clip" [style.left.px]="t.start * px" [style.width.px]="t.dur * px - 3">{{ t.label }}</span>
                  }
                </div>
                <ul class="lane v1">
                  @for (c of clips; track c.name; let i = $index) {
                    <li class="clip" [class.on]="current() === i" [style.left.px]="c.start * px" [style.width.px]="c.dur * px - 3">
                      <button type="button" (click)="open(i, $event)" [attr.aria-label]="'Ver clip: ' + c.alt" [style.background-image]="'url(' + poster(c.name) + ')'">
                        <span class="name">{{ c.name }}</span>
                      </button>
                      @if (i > 0 && i % 3 === 0) {
                        <span class="xfade" aria-hidden="true">Disolvencia</span>
                      }
                    </li>
                  }
                </ul>
                <div class="lane a1" aria-hidden="true">
                  <svg [attr.width]="total * px" height="54" [attr.viewBox]="'0 0 ' + total * px + ' 54'" preserveAspectRatio="none">
                    <path [attr.d]="wave" />
                  </svg>
                  <span class="track-name">Música · "Primer baile" (versión instrumental)</span>
                </div>
              </div>
              <span class="playhead" aria-hidden="true"><i></i></span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <app-viewer [items]="items" [(index)]="index" tone="night" />
  `,
  styles: `
    .suite { position: relative; padding-block: var(--space-section); overflow: hidden; }
    .head { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px 64px; align-items: end; margin-bottom: 44px; }
    .copy { display: grid; gap: 18px; }
    .title { font-size: var(--text-2xl); }
    .title em { color: var(--color-accent-soft); }
    .lead { color: var(--color-on-night-2); max-width: 46ch; }

    /* Ventana del editor */
    .window { border-radius: 14px; background: linear-gradient(#10172a, #0b1121); box-shadow: 0 0 0 1px var(--color-line-night), 0 40px 90px -30px rgb(0 0 0 / 80%); overflow: hidden; }
    .bar { display: flex; align-items: center; gap: 16px; height: 40px; padding: 0 16px; border-bottom: 1px solid var(--color-line-night); }
    .dots { display: flex; gap: 6px; }
    .dots i { width: 10px; height: 10px; border-radius: 50%; background: rgb(233 236 243 / 14%); }
    .proj { flex: 1; color: var(--color-on-night-2); font-size: 0.6rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .state { display: inline-flex; align-items: center; gap: 8px; color: var(--color-on-night-2); font-size: 0.6rem; }
    .state i { width: 7px; height: 7px; border-radius: 50%; background: rgb(233 236 243 / 30%); }
    .state.live i { background: var(--color-accent-soft); box-shadow: 0 0 0 0 var(--color-accent-soft); animation: live 1.6s ease-out infinite; }
    @keyframes live { to { box-shadow: 0 0 0 8px rgb(226 167 160 / 0%); } }

    .top { display: grid; grid-template-columns: 220px 1fr; border-bottom: 1px solid var(--color-line-night); }
    .inspector { padding: 22px 20px; border-right: 1px solid var(--color-line-night); font-size: 0.82rem; color: var(--color-on-night-2); }
    .inspector .h { font-size: 0.58rem; color: var(--color-accent-soft); margin-bottom: 8px; }
    .clip-name { color: var(--color-on-night); font-family: var(--font-display); font-size: 1.35rem; line-height: 1.15; margin-bottom: 18px; min-height: 2.3em; }
    dl { display: grid; gap: 10px; margin-bottom: 22px; }
    dl div { display: grid; gap: 2px; }
    dt { font-size: 0.66rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.7; }
    dd { color: var(--color-on-night); font-variant-numeric: tabular-nums; }
    .cut { color: var(--color-on-night); font-variant-numeric: tabular-nums; }

    .monitor { display: grid; justify-items: center; padding: 18px 18px 0; }
    .screen { position: relative; height: clamp(200px, 44vh, 470px); max-width: 100%; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; background: #000; cursor: zoom-in; isolation: isolate; }
    .backdrop { position: absolute; inset: -10%; width: 120%; height: 120%; object-fit: cover; filter: blur(28px) brightness(0.5) saturate(1.2); transition: opacity 500ms ease; }
    .v { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 420ms ease; }
    .v.show { opacity: 1; }
    .safe { position: absolute; inset: 6% 5%; border: 1px dashed rgb(255 255 255 / 12%); border-radius: 2px; pointer-events: none; }
    .expand { position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--radius-pill); background: rgb(7 11 22 / 60%); backdrop-filter: blur(8px); color: var(--color-on-night); font-size: 0.58rem; opacity: 0; translate: 0 6px; transition: opacity 300ms ease, translate 400ms var(--ease-out); }
    @media (hover: hover) and (pointer: fine) { .screen:hover .expand { opacity: 1; translate: 0 0; } }
    .transport { width: 100%; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 58px; }
    .tc { font-variant-numeric: tabular-nums; font-size: 0.74rem; letter-spacing: 0.08em; color: var(--color-on-night); }
    .total { justify-self: end; color: var(--color-on-night-2); }
    .buttons { display: flex; align-items: center; gap: 6px; }
    .buttons button { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: var(--color-on-night-2); transition: color 250ms ease, background-color 250ms ease, scale 200ms var(--ease-out); }
    .buttons .play { width: 46px; height: 46px; background: var(--color-on-night); color: var(--color-night); }
    .buttons button:active { scale: 0.92; }
    @media (hover: hover) and (pointer: fine) { .buttons button:not(.play):hover { color: var(--color-on-night); background: rgb(233 236 243 / 8%); } .buttons .play:hover { background: var(--color-accent-soft); } }

    /* Línea de tiempo */
    .timeline { display: grid; grid-template-columns: 56px 1fr; cursor: ew-resize; -webkit-user-select: none; user-select: none; }
    .heads { display: grid; grid-template-rows: 28px 34px 74px 62px; border-right: 1px solid var(--color-line-night); background: rgb(0 0 0 / 18%); }
    .heads .label { display: grid; place-items: center; font-size: 0.6rem; color: var(--color-on-night-2); border-top: 1px solid var(--color-line-night); }
    .view { position: relative; overflow: hidden; }
    .lanes { position: relative; display: grid; grid-template-rows: 28px 34px 74px 62px; will-change: transform; }
    .lane { position: relative; border-top: 1px solid var(--color-line-night); }
    .ruler { position: relative; }
    .tick { position: absolute; bottom: 0; width: 1px; height: 6px; background: rgb(233 236 243 / 22%); }
    .tick.major { height: 12px; background: rgb(233 236 243 / 45%); }
    .tick i { position: absolute; left: 6px; bottom: 8px; font-style: normal; font-family: var(--font-label); font-size: 0.6rem; letter-spacing: 0.06em; color: var(--color-on-night-2); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .title-clip { position: absolute; top: 6px; bottom: 6px; display: flex; align-items: center; padding: 0 10px; border-radius: 4px; background: rgb(226 167 160 / 22%); box-shadow: inset 0 0 0 1px rgb(226 167 160 / 45%); color: var(--color-accent-wash); font-size: 0.66rem; white-space: nowrap; overflow: hidden; }
    .clip { position: absolute; top: 6px; bottom: 6px; }
    .clip button { position: relative; display: block; width: 100%; height: 100%; border-radius: 5px; background-size: auto 100%; background-repeat: repeat-x; background-color: #1a2236; box-shadow: inset 0 0 0 1px rgb(233 236 243 / 14%); overflow: hidden; cursor: pointer; transition: box-shadow 300ms ease, filter 300ms ease; filter: saturate(0.75) brightness(0.8); }
    .clip button::after { content: ''; position: absolute; inset: 0; background: linear-gradient(rgb(7 11 22 / 70%), transparent 55%); }
    .clip .name { position: absolute; left: 8px; top: 6px; z-index: 1; font-family: var(--font-label); font-size: 0.6rem; letter-spacing: 0.06em; color: var(--color-on-night); }
    .clip.on button { filter: none; box-shadow: inset 0 0 0 2px var(--color-accent-soft); }
    @media (hover: hover) and (pointer: fine) { .clip button:hover { filter: none; } }
    .xfade { position: absolute; left: -26px; bottom: -4px; z-index: 2; padding: 2px 6px; border-radius: 3px; background: #2a3350; color: var(--color-on-night-2); font-family: var(--font-label); font-size: 0.5rem; letter-spacing: 0.08em; text-transform: uppercase; pointer-events: none; }
    .a1 svg { position: absolute; left: 0; top: 4px; }
    .a1 path { fill: rgb(226 167 160 / 55%); }
    .track-name { position: absolute; left: 8px; top: 5px; padding: 2px 6px; border-radius: 3px; background: rgb(7 11 22 / 60%); font-size: 0.6rem; color: var(--color-on-night); opacity: 0.8; white-space: nowrap; }
    .playhead { position: absolute; top: 0; bottom: 0; left: 0; width: 2px; background: var(--color-accent-soft); pointer-events: none; will-change: transform; box-shadow: 0 0 12px rgb(226 167 160 / 60%); }
    .playhead i { position: absolute; left: -6px; top: 0; width: 14px; height: 16px; background: var(--color-accent-soft); clip-path: polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%); }

    @media (max-width: 900px) {
      .head { grid-template-columns: 1fr; }
      .top { grid-template-columns: 1fr; }
      .inspector { display: none; }
      .monitor { padding: 12px 12px 0; }
      .screen { height: auto; width: 100%; }
      .proj { font-size: 0.54rem; }
      .timeline { grid-template-columns: 40px 1fr; }
    }
  `,
})
export class EditSuite {
  protected readonly px = PX;
  protected readonly clips: Clip[] = [];
  protected readonly total: number;
  protected readonly ticks: number[];
  protected readonly titles: { label: string; start: number; dur: number }[];
  protected readonly wave: string;
  protected readonly current = signal(0);
  protected readonly playing = signal(false);
  protected readonly index = signal<number | null>(null);
  protected readonly items: ViewerItem[];

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private t = 0;
  private scrubbing = false;
  private userPaused = false;
  private visible = false;
  private seekTo?: (t: number, scrub: boolean) => void;

  constructor() {
    const known = new Map(ALL_VIDEOS.map((v) => [v.name, v]));
    let start = 0;
    for (const [name, dur, w, h] of CUT) {
      const v = known.get(name);
      if (!v) continue;
      this.clips.push({ name, alt: v.alt, start, dur, w, h });
      start += dur;
    }
    this.total = start;
    this.ticks = Array.from({ length: Math.ceil(start) + 6 }, (_, i) => i);
    this.titles = [
      { label: 'Título · Ana & Luis', start: 0.4, dur: 3.2 },
      { label: 'Texto · El vals', start: this.startOf('vals') + 0.3, dur: 2.6 },
      { label: 'Texto · Los XV de Sofía', start: this.startOf('xv-camina') + 0.2, dur: 3 },
      { label: 'Logo · Astor', start: start - 3.2, dur: 3 },
    ];
    this.wave = waveform(start * PX, 54);
    this.items = this.clips.map((c) => ({
      kind: 'video',
      src: videoSrc(c as never),
      alt: c.alt,
      caption: c.alt,
      meta: 'Clip del resumen',
      ratio: c.w / c.h,
    }));

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => this.start(destroyRef));
  }

  protected clip() {
    return this.clips[this.current()];
  }

  private startOf(name: string) {
    return this.clips.find((c) => c.name === name)?.start ?? 0;
  }

  protected poster(name: string) {
    return videoPoster({ name } as never);
  }

  /** Código de tiempo hh:mm:ss:ff (o mm:ss para la regla). */
  protected tc(s: number, frames = true) {
    const f = Math.floor((s % 1) * FPS);
    const sec = Math.floor(s) % 60;
    const min = Math.floor(s / 60) % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return frames ? `00:${p(min)}:${p(sec)}:${p(f)}` : `${p(min)}:${p(sec)}`;
  }

  private clipAt(t: number) {
    let i = this.clips.length - 1;
    while (i > 0 && this.clips[i].start > t) i--;
    return i;
  }

  private start(destroyRef: DestroyRef) {
    const view = this.host.querySelector<HTMLElement>('.view')!;
    const lanes = this.host.querySelector<HTMLElement>('.lanes')!;
    const head = this.host.querySelector<HTMLElement>('.playhead')!;
    const tcEl = this.host.querySelector<HTMLElement>('.tc')!;
    const vids = [...this.host.querySelectorAll<HTMLVideoElement>('video.v')];
    const reduced = prefersReducedMotion();
    let front = 0;
    let loaded = -1;

    // Muestra el clip i en el monitor (fundido corto entre los dos <video>), desde el segundo "offset".
    const show = (i: number, offset: number, play: boolean) => {
      const c = this.clips[i];
      if (loaded === i) {
        const v = vids[front];
        if (!play && Math.abs(v.currentTime - offset) > 0.08) v.currentTime = offset;
        if (play && v.paused) v.play().catch(() => {});
        if (!play && !v.paused) v.pause();
        return;
      }
      loaded = i;
      const next = vids[1 - front];
      const prev = vids[front];
      next.src = videoSrc(c as never);
      next.currentTime = offset;
      const reveal = () => {
        next.classList.add('show');
        prev.classList.remove('show');
        front = 1 - front;
        setTimeout(() => prev.pause(), 450);
      };
      next.addEventListener('loadeddata', reveal, { once: true });
      if (play) next.play().catch(() => {});
    };

    const place = () => {
      const w = view.clientWidth;
      const x = this.t * PX;
      // El cabezal camina hasta un tercio del ancho; de ahí en adelante se desplaza la línea.
      const anchor = w * 0.34;
      const max = Math.max(0, this.total * PX - w + 60);
      const off = Math.min(max, Math.max(0, x - anchor));
      lanes.style.transform = `translate3d(${-off}px,0,0)`;
      head.style.transform = `translate3d(${x - off}px,0,0)`;
      tcEl.textContent = this.tc(this.t);
    };

    this.seekTo = (t, scrub) => {
      this.t = Math.max(0, Math.min(this.total - 0.01, t));
      const i = this.clipAt(this.t);
      if (i !== this.current()) this.current.set(i);
      show(i, this.t - this.clips[i].start, !scrub && this.playing());
      place();
    };

    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      if (!this.visible || this.scrubbing || !this.playing()) return;
      let t = this.t + dt;
      if (t >= this.total) t = 0;
      const i = this.clipAt(t);
      this.t = t;
      if (i !== this.current()) {
        this.current.set(i);
        show(i, 0, true);
      }
      place();
    };

    const io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      const v = vids[front];
      if (!this.visible) v.pause();
      else if (this.playing() && !this.scrubbing) v.play().catch(() => {});
    }, { threshold: 0.15 });
    io.observe(this.host);

    this.playing.set(!reduced);
    show(0, 0, !reduced);
    place();
    raf = requestAnimationFrame(tick);
    destroyRef.onDestroy(() => {
      cancelAnimationFrame(raf);
      io.disconnect();
      for (const v of vids) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    });
  }

  protected toggle() {
    const next = !this.playing();
    this.playing.set(next);
    this.userPaused = !next;
    this.seekTo?.(this.t, false);
  }

  protected jump(dir: number) {
    const i = (this.current() + dir + this.clips.length) % this.clips.length;
    this.seekTo?.(this.clips[i].start, false);
  }

  /** Tiempo bajo el cursor en la línea de tiempo. */
  private timeAt(e: PointerEvent | MouseEvent) {
    const view = this.host.querySelector<HTMLElement>('.view')!;
    const lanes = this.host.querySelector<HTMLElement>('.lanes')!;
    const r = view.getBoundingClientRect();
    if (e.clientX < r.left) return null;
    const off = -new DOMMatrixReadOnly(getComputedStyle(lanes).transform).m41;
    return (e.clientX - r.left + off) / PX;
  }

  protected scrub(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const t = this.timeAt(e);
    if (t === null) return;
    this.scrubbing = true;
    this.seekTo?.(t, true);
  }

  protected release() {
    if (!this.scrubbing) return;
    this.scrubbing = false;
    if (!this.userPaused) this.seekTo?.(this.t, false);
  }

  protected pickAt(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.clip')) return;
    const t = this.timeAt(e);
    if (t !== null) this.index.set(this.clipAt(t));
  }

  protected open(i: number, e: Event) {
    e.stopPropagation();
    this.index.set(i);
  }

  protected openCurrent() {
    this.index.set(this.current());
  }
}

/** Forma de onda de la música: compases con golpes, respiración y un final que se apaga. */
function waveform(width: number, height: number) {
  const mid = height / 2;
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const top: string[] = [];
  const bottom: string[] = [];
  for (let x = 0; x <= width; x += 3) {
    const s = x / PX;
    const beat = Math.pow(Math.max(0, Math.cos(s * Math.PI * 2 * 1.2)), 6);
    const phrase = 0.55 + 0.35 * Math.sin(s * 0.35) + 0.1 * Math.sin(s * 1.7);
    const fade = Math.min(1, s / 2) * Math.min(1, (width / PX - s) / 3);
    const a = Math.max(0.04, (phrase * 0.55 + beat * 0.4 + rnd() * 0.18) * fade);
    top.push(`${x},${(mid - a * (mid - 2)).toFixed(1)}`);
    bottom.unshift(`${x},${(mid + a * (mid - 2)).toFixed(1)}`);
  }
  return `M0,${mid} L${top.join(' L')} L${bottom.join(' L')} Z`;
}
