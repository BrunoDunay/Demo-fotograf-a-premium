import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GEAR } from '../core/content';
import { cutoutSrc } from '../core/media';
import { prefersReducedMotion } from '../core/motion';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { HangingCamera } from '../sections/hanging-camera';

/**
 * Mi equipo: una cámara réflex en 3D cuelga de su correa (con física); el cursor la roza y se mece. Abajo, las fichas
 * técnicas del equipo y la pantalla del dron con una toma aérea que se mueve con el cursor.
 */
@Component({
  selector: 'app-gear',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Reveal, Celestial, HangingCamera],
  template: `
    <section class="hero">
      <app-hanging-camera class="hang-zone" />
      <div class="container copy">
        <p class="label kicker">Mi equipo</p>
        <h1 class="title">Lo que cargo <em>en cada evento</em></h1>
        <p class="lead">
          Cámaras, lentes, dron y luces, explicados sin rodeos. Y sí: esa cámara que cuelga es la que nunca se queda en
          casa. <span class="fine">Pásale el cursor encima</span><span class="touch">Tócala</span> y mira cómo se mece.
        </p>
        <p class="label hint"><app-icon name="drag" [size]="16" /> <span class="fine">Pasa el cursor para mecerla</span><span class="touch">Toca para mecerla</span></p>
      </div>
    </section>

    <section class="section specs" aria-labelledby="specs-title">
      <div class="container">
        <header class="head">
          <h2 id="specs-title" class="title-2" data-reveal>Ficha técnica, <em>sin tecnicismos de más</em></h2>
          <p class="lead" data-reveal>Toca cada pieza para ver por qué la uso y qué hace por tus fotos.</p>
        </header>
        <ol class="list">
          @for (g of gear; track g.id; let i = $index) {
            <li class="item" [class.open]="open() === i" data-reveal [revealDelay]="(i % 3) * 70">
              <button type="button" class="row" [attr.aria-expanded]="open() === i" [attr.aria-controls]="'gear-' + g.id" (click)="toggle(i)">
                <span class="n label">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <span class="group label">{{ g.group }}</span>
                <span class="name">{{ g.name }}</span>
                <span class="plus" aria-hidden="true"><app-icon name="plus" [size]="18" /></span>
              </button>
              <div class="panel" [id]="'gear-' + g.id" role="region">
                <div class="panel-inner">
                  <div class="text">
                    <p class="short">{{ g.short }}</p>
                    <p class="why"><span class="script">por qué</span> {{ g.why }}</p>
                  </div>
                  <dl class="sheet">
                    @for (s of g.specs; track s[0]) {
                      <div><dt class="label">{{ s[0] }}</dt><dd>{{ s[1] }}</dd></div>
                    }
                  </dl>
                  @if (g.image === 'lente') {
                    <img class="thumb" [src]="cut(g.image)" [alt]="g.name" loading="lazy" />
                  }
                </div>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section sky on-night" aria-labelledby="sky-title">
      <app-celestial class="sky-deco twinkle" kind="stars" />
      <div class="container sky-grid">
        <div class="copy-2">
          <p class="label kicker" data-reveal>Desde el aire</p>
          <h2 id="sky-title" class="title-2" data-reveal>La hacienda entera, <em>en una sola foto</em></h2>
          <p class="lead" data-reveal>
            El dron sube solo cuando el lugar lo permite y lejos de los invitados. Para la fila de bengalas, la salida de
            la iglesia y ese patio que nadie ve completo. Mueve el cursor sobre la pantalla para mover la cámara del dron.
          </p>
        </div>
        <div class="fpv" data-reveal="scale" (pointermove)="aim($event)" (pointerleave)="aim(null)">
          <div class="feed" [style.translate]="gimbal().t" [style.scale]="gimbal().s">
            <video [src]="aerial" [poster]="aerialPoster" muted loop playsinline autoplay preload="metadata" aria-label="Toma aérea de una pareja de novios en un jardín"></video>
          </div>
          <div class="hud" aria-hidden="true">
            <span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>
            <span class="thirds"></span>
            <span class="focus"></span>
            <p class="top-l"><i class="rec"></i> REC 00:{{ clock() }}</p>
            <p class="top-r">4K · 30 · ND16 <span class="bat"><i></i></span> 82%</p>
            <p class="bot-l">ALT {{ hud().alt }} m<br />DIST {{ hud().dist }} m</p>
            <p class="bot-r">GIMBAL {{ hud().tilt }}°<br />ISO 100 · 1/120</p>
            <span class="horizon" [style.rotate]="hud().roll + 'deg'"></span>
          </div>
        </div>
      </div>
    </section>

    <section class="section backup" aria-labelledby="backup-title">
      <div class="container">
        <h2 id="backup-title" class="title-2 center" data-reveal>Tus fotos viven <em>en tres lugares</em></h2>
        <ol class="flow">
          @for (s of backup; track s.title; let i = $index) {
            <li data-reveal [revealDelay]="i * 120">
              <span class="dot"><app-icon [name]="s.icon" [size]="22" /></span>
              <p class="label">{{ s.when }}</p>
              <p class="flow-title">{{ s.title }}</p>
              <p class="flow-text">{{ s.text }}</p>
            </li>
          }
        </ol>
        <div class="ctas" data-reveal>
          <a routerLink="/paquetes" class="btn btn-ink"><span class="btn-t">Ver paquetes</span></a>
          <a routerLink="/sobre-mi" class="btn btn-line"><span class="btn-t">Quién soy</span></a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; min-height: max(100svh, 760px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; overflow: hidden; padding-top: 70px; }
    .hang-zone { position: relative; align-self: stretch; grid-column: 2; grid-row: 1; min-height: 640px; }
    .copy { grid-column: 1; grid-row: 1; position: relative; z-index: 2; display: grid; gap: 20px; max-width: 560px; padding-block: 60px; }
    .title { font-size: var(--text-3xl); }
    .title em { display: block; color: var(--color-accent); margin: 0.02em 0 0 0.6em; }
    .touch { display: none; }
    @media (hover: none), (pointer: coarse) { .fine { display: none; } .touch { display: inline; } }
    .hint { display: inline-flex; align-items: center; gap: 10px; color: var(--color-muted); }

    .head { display: grid; gap: 14px; margin-bottom: 40px; }
    .title-2 { font-size: var(--text-2xl); }
    .title-2 em { color: var(--color-accent); }
    .on-night .title-2 em { color: var(--color-accent-soft); }
    .center { text-align: center; }
    .list { border-top: 1px solid var(--color-line); }
    .item { border-bottom: 1px solid var(--color-line); }
    .row { display: grid; grid-template-columns: 52px 220px minmax(0, 1fr) 44px; align-items: center; gap: 16px; width: 100%; min-height: 84px; text-align: left; }
    .row .n, .row .group { color: var(--color-muted); }
    .name { font-family: var(--font-display); font-size: clamp(1.4rem, 2.6vw, 2.2rem); line-height: 1.1; transition: translate 500ms var(--ease-out); }
    .plus { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--color-line-2); transition: rotate 400ms var(--ease-out), background-color 300ms ease, color 300ms ease; }
    .item.open .plus { rotate: 45deg; background: var(--color-ink); color: var(--color-paper); }
    .item.open .name { translate: 8px 0; }
    @media (hover: hover) and (pointer: fine) {
      .row:hover .name { translate: 8px 0; }
    }
    .panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 500ms var(--ease-out); }
    .item.open .panel { grid-template-rows: 1fr; }
    .panel-inner { overflow: hidden; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) auto; gap: 32px; padding-left: 68px; }
    .item.open .panel-inner { padding-bottom: 34px; }
    .short { font-size: 1.05rem; color: var(--color-ink); }
    .why { margin-top: 12px; color: var(--color-ink-2); }
    .why .script { font-size: 1.8rem; color: var(--color-accent); margin-right: 4px; }
    .sheet { display: grid; gap: 0; margin: 0; border-top: 1px solid var(--color-line); }
    .sheet div { display: grid; grid-template-columns: 130px 1fr; gap: 12px; padding: 10px 0; border-bottom: 1px dashed var(--color-line-2); }
    .sheet dt { color: var(--color-muted); }
    .sheet dd { margin: 0; font-size: 0.95rem; }
    .thumb { width: 160px; height: auto; align-self: center; filter: drop-shadow(0 12px 18px rgb(0 0 0 / 25%)); }

    .sky { position: relative; overflow: hidden; }
    .sky-deco { position: absolute; left: 6%; top: 12%; --size: 120px; opacity: 0.2; }
    .sky-grid { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: clamp(32px, 5vw, 72px); align-items: center; }
    .copy-2 { display: grid; gap: 18px; }
    /* Pantalla del dron: el video se mueve como el gimbal y encima va la interfaz de vuelo. */
    .fpv { position: relative; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 18px; background: #000; box-shadow: 0 0 0 1px var(--color-line-night), 0 40px 80px -40px rgb(0 0 0 / 90%); cursor: crosshair; }
    .feed { position: absolute; inset: -6%; transition: translate 1200ms var(--ease-out), scale 1200ms var(--ease-out); }
    .feed video { width: 100%; height: 100%; object-fit: cover; filter: saturate(1.05) contrast(1.04); }
    .hud { position: absolute; inset: 0; pointer-events: none; font-family: var(--font-label); font-size: clamp(0.56rem, 1vw, 0.7rem); letter-spacing: 0.14em; color: #fff; text-shadow: 0 1px 3px rgb(0 0 0 / 70%); }
    .hud p { position: absolute; margin: 0; line-height: 1.6; }
    .top-l { left: 22px; top: 18px; display: flex; align-items: center; gap: 8px; }
    .top-r { right: 22px; top: 18px; display: flex; align-items: center; gap: 8px; }
    .bot-l { left: 22px; bottom: 18px; }
    .bot-r { right: 22px; bottom: 18px; text-align: right; }
    .rec { width: 8px; height: 8px; border-radius: 50%; background: #ff4b3e; animation: rec 1.2s steps(1) infinite; }
    @keyframes rec { 50% { opacity: 0.2; } }
    .bat { display: inline-block; width: 22px; height: 10px; border: 1px solid #fff; border-radius: 2px; padding: 1px; }
    .bat i { display: block; width: 80%; height: 100%; background: #fff; }
    .c { position: absolute; width: 22px; height: 22px; border: 0 solid rgb(255 255 255 / 80%); }
    .tl { left: 12px; top: 12px; border-width: 1.5px 0 0 1.5px; }
    .tr { right: 12px; top: 12px; border-width: 1.5px 1.5px 0 0; }
    .bl { left: 12px; bottom: 12px; border-width: 0 0 1.5px 1.5px; }
    .br { right: 12px; bottom: 12px; border-width: 0 1.5px 1.5px 0; }
    .thirds { position: absolute; inset: 0; background:
      linear-gradient(90deg, transparent calc(33.33% - 0.5px), rgb(255 255 255 / 18%) 0 calc(33.33% + 0.5px), transparent 0 calc(66.66% - 0.5px), rgb(255 255 255 / 18%) 0 calc(66.66% + 0.5px), transparent 0),
      linear-gradient(transparent calc(33.33% - 0.5px), rgb(255 255 255 / 18%) 0 calc(33.33% + 0.5px), transparent 0 calc(66.66% - 0.5px), rgb(255 255 255 / 18%) 0 calc(66.66% + 0.5px), transparent 0); }
    .focus { position: absolute; left: 50%; top: 50%; width: 64px; height: 44px; translate: -50% -50%; border: 1px solid rgb(255 255 255 / 85%); border-radius: 4px; animation: focus 3s var(--ease-out) infinite; }
    @keyframes focus { 0%, 100% { scale: 1; } 8% { scale: 1.25; } 16% { scale: 1; border-color: #9ff2a6; } 40% { border-color: rgb(255 255 255 / 85%); } }
    .horizon { position: absolute; left: 50%; top: 50%; width: 160px; height: 1px; margin-left: -80px; background: linear-gradient(90deg, rgb(255 255 255 / 80%) 0 30%, transparent 30% 70%, rgb(255 255 255 / 80%) 70%); transition: rotate 800ms var(--ease-out); }

    .flow { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; margin: 56px 0; }
    .flow::before { content: ''; position: absolute; left: 16%; right: 16%; top: 28px; border-top: 1px dashed var(--color-line-2); }
    .flow li { position: relative; display: grid; justify-items: center; gap: 8px; text-align: center; }
    .dot { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--color-card); box-shadow: var(--shadow-paper); }
    .flow .label { color: var(--color-accent); margin-top: 8px; }
    .flow-title { font-family: var(--font-display); font-style: italic; font-size: 1.5rem; }
    .flow-text { color: var(--color-ink-2); max-width: 30ch; }
    .ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; grid-template-rows: auto auto; min-height: 0; padding-top: 70px; }
      .hang-zone { grid-column: 1; grid-row: 1; height: 520px; min-height: 0; }
      .copy { grid-row: 2; padding-top: 10px; }
      .row { grid-template-columns: 36px minmax(0, 1fr) 44px; }
      .row .group { display: none; }
      .panel-inner { grid-template-columns: 1fr; padding-left: 0; gap: 18px; }
      .thumb { width: 130px; }
      .sky-grid { grid-template-columns: 1fr; }
      .flow { grid-template-columns: 1fr; }
      .flow::before { display: none; }
    }
  `,
})
export default class Gear {
  protected readonly gear = GEAR;
  protected readonly open = signal<number | null>(0);
  protected readonly aerial = '/media/videos/aereo-jardin.mp4';
  protected readonly aerialPoster = '/media/videos/aereo-jardin.jpg';
  protected readonly gimbal = signal({ t: '0 0', s: '1' });
  protected readonly hud = signal({ alt: 38, dist: 64, tilt: -42, roll: 0 });
  protected readonly clock = signal('00');
  protected readonly backup = [
    { icon: 'camera' as const, when: 'En el evento', title: 'Doble tarjeta', text: 'Cada foto se graba en dos tarjetas al mismo tiempo, en cada cámara.' },
    { icon: 'download' as const, when: 'Esa misma noche', title: 'Discos en espejo', text: 'Al llegar al estudio, copio todo a un arreglo de discos que se respaldan entre sí.' },
    { icon: 'check' as const, when: 'Al día siguiente', title: 'Copia en la nube', text: 'Una tercera copia cifrada fuera del estudio. Las tarjetas no se borran hasta entregarte.' },
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Reloj de grabación de la pantalla del dron.
      const t0 = performance.now();
      const id = setInterval(() => this.clock.set(String(Math.floor((performance.now() - t0) / 1000) % 60).padStart(2, '0')), 1000);
      destroyRef.onDestroy(() => clearInterval(id));
    });
  }

  /** El cursor mueve el gimbal: el video se desplaza y la telemetría cambia con él. */
  protected aim(e: PointerEvent | null) {
    if (!e || e.pointerType !== 'mouse' || prefersReducedMotion()) {
      this.gimbal.set({ t: '0 0', s: '1' });
      this.hud.set({ alt: 38, dist: 64, tilt: -42, roll: 0 });
      return;
    }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    this.gimbal.set({ t: `${(-x * 5).toFixed(2)}% ${(-y * 5).toFixed(2)}%`, s: (1.02 + Math.abs(y) * 0.04).toFixed(3) });
    this.hud.set({ alt: Math.round(38 - y * 14), dist: Math.round(64 + x * 20), tilt: Math.round(-42 - y * 20), roll: +(x * 6).toFixed(1) });
  }

  protected toggle(i: number) {
    this.open.update((v) => (v === i ? null : i));
  }

  protected cut(name: string) {
    return cutoutSrc(name);
  }
}
