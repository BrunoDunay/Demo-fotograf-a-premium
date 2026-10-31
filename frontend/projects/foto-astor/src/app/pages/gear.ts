import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GEAR } from '../core/content';
import { cutout, cutoutSrc } from '../core/media';
import { prefersReducedMotion } from '../core/motion';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

/**
 * Mi equipo: la cámara cuelga de su correa como un péndulo. El cursor (o el dedo) la empuja si la roza y se
 * balancea hasta detenerse; nada brusco. Abajo, las fichas técnicas del equipo y un dron que esquiva el cursor.
 */
@Component({
  selector: 'app-gear',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Reveal, Celestial],
  template: `
    <section class="hero">
      <div class="hang-zone" (pointermove)="push($event)" (pointerdown)="tap($event)">
        <span class="rail" aria-hidden="true"></span>
        <div class="pendulum">
          <span class="strap left" aria-hidden="true"></span>
          <span class="strap right" aria-hidden="true"></span>
          <img
            class="camera"
            [src]="cameraSrc"
            alt="Cámara Fujifilm X100VI colgando de su correa"
            [attr.width]="camera.w"
            [attr.height]="camera.h"
            draggable="false"
          />
        </div>
        <p class="shadow" aria-hidden="true"></p>
      </div>
      <div class="container copy">
        <p class="label kicker">Mi equipo</p>
        <h1 class="title">Lo que cargo <span class="script">cada sábado</span></h1>
        <p class="lead">
          Cámaras, lentes, dron y luces, explicados sin rodeos. Y sí: esa cámara que cuelga es la que nunca se queda en
          casa. Pásale el cursor encima (o el dedo) y verás.
        </p>
        <p class="label hint"><app-icon name="drag" [size]="16" /> Empújala con cuidado</p>
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
                  @if (g.image && g.image !== 'camara-colgante') {
                    <img class="thumb" [class.drone]="g.image === 'dron'" [src]="cut(g.image)" [alt]="g.name" loading="lazy" />
                  }
                </div>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section sky on-night" aria-labelledby="sky-title" (pointermove)="dodge($event)" (pointerleave)="dodge(null)">
      <app-celestial class="sky-deco twinkle" kind="stars" />
      <div class="container sky-grid">
        <div class="copy-2">
          <p class="label kicker" data-reveal>Desde el aire</p>
          <h2 id="sky-title" class="title-2" data-reveal>La hacienda entera, <em>en una sola foto</em></h2>
          <p class="lead" data-reveal>
            El dron sube solo cuando el lugar lo permite y lejos de los invitados. Para la fila de bengalas, la salida de
            la iglesia y ese patio que nadie ve completo.
          </p>
        </div>
        <div class="drone-zone">
          <img class="drone" [src]="droneSrc" alt="Dron DJI visto desde arriba" [style.translate]="droneOffset()" draggable="false" />
          <span class="drone-shadow" aria-hidden="true" [style.translate]="droneShadow()"></span>
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
          <a routerLink="/paquetes" class="btn btn-ink">Ver paquetes</a>
          <a routerLink="/sobre-mi" class="btn btn-line">Quién soy</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; min-height: max(100svh, 760px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; overflow: hidden; padding-top: 70px; }
    .hang-zone { position: relative; align-self: stretch; display: grid; justify-items: center; grid-column: 2; grid-row: 1; touch-action: pan-y; }
    /* Riel corto de metal del que cuelga la correa. */
    .rail { position: absolute; top: 34px; left: 50%; z-index: 2; width: min(340px, 72%); height: 10px; translate: -50% 0; border-radius: 5px; background: linear-gradient(#3a3a3a, #121212 70%); box-shadow: 0 8px 12px -6px rgb(0 0 0 / 45%); }
    .pendulum { position: absolute; top: 38px; left: 50%; width: min(330px, 70%); margin-left: calc(min(330px, 70%) / -2); transform-origin: 44% 0; will-change: transform; }
    .strap { position: absolute; top: 0; height: var(--strap, 22vh); background: linear-gradient(90deg, #0b0b0b, #2a2a2a 45%, #0b0b0b); }
    .strap.left { left: 9.6%; width: 5%; }
    .strap.right { left: 70.4%; width: 11.6%; }
    .camera { position: relative; display: block; width: 100%; height: auto; margin-top: calc(var(--strap, 22vh) - 2px); filter: drop-shadow(0 26px 30px rgb(0 0 0 / 28%)); -webkit-user-drag: none; user-select: none; cursor: grab; }
    .shadow { position: absolute; bottom: 9%; left: 50%; width: 220px; height: 26px; margin-left: -110px; border-radius: 50%; background: radial-gradient(closest-side, rgb(0 0 0 / 22%), transparent); }
    .copy { grid-column: 1; grid-row: 1; position: relative; z-index: 2; display: grid; gap: 20px; max-width: 560px; padding-block: 60px; }
    .title { font-size: var(--text-3xl); }
    .title .script { display: block; font-size: 1.05em; color: var(--color-champagne); margin: 0.05em 0 0 0.5em; }
    .hint { display: inline-flex; align-items: center; gap: 10px; color: var(--color-muted); }

    .head { display: grid; gap: 14px; margin-bottom: 40px; }
    .title-2 { font-size: var(--text-2xl); }
    .title-2 em { color: var(--color-champagne); }
    .on-night .title-2 em { color: var(--color-champagne-soft); }
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
    .why .script { font-size: 1.8rem; color: var(--color-champagne); margin-right: 4px; }
    .sheet { display: grid; gap: 0; margin: 0; border-top: 1px solid var(--color-line); }
    .sheet div { display: grid; grid-template-columns: 130px 1fr; gap: 12px; padding: 10px 0; border-bottom: 1px dashed var(--color-line-2); }
    .sheet dt { color: var(--color-muted); }
    .sheet dd { margin: 0; font-size: 0.95rem; }
    .thumb { width: 160px; height: auto; align-self: center; filter: drop-shadow(0 12px 18px rgb(0 0 0 / 25%)); }
    .thumb.drone { width: 190px; animation: bob 4s ease-in-out infinite; }
    @keyframes bob { 50% { translate: 0 -8px; } }

    .sky { position: relative; overflow: hidden; }
    .sky-deco { position: absolute; left: 6%; top: 12%; --size: 120px; opacity: 0.2; }
    .sky-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; align-items: center; }
    .copy-2 { display: grid; gap: 18px; }
    .drone-zone { position: relative; height: 420px; display: grid; place-items: center; }
    .drone { position: relative; z-index: 1; width: min(420px, 90%); animation: hover 3.6s ease-in-out infinite; transition: translate 900ms var(--ease-out); filter: drop-shadow(0 30px 30px rgb(0 0 0 / 45%)); -webkit-user-drag: none; user-select: none; }
    @keyframes hover { 50% { margin-top: -18px; } }
    .drone-shadow { position: absolute; bottom: 10px; width: 260px; height: 40px; border-radius: 50%; background: radial-gradient(closest-side, rgb(0 0 0 / 50%), transparent); transition: translate 900ms var(--ease-out); }

    .flow { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; margin: 56px 0; }
    .flow::before { content: ''; position: absolute; left: 16%; right: 16%; top: 28px; border-top: 1px dashed var(--color-line-2); }
    .flow li { position: relative; display: grid; justify-items: center; gap: 8px; text-align: center; }
    .dot { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--color-card); box-shadow: var(--shadow-paper); }
    .flow .label { color: var(--color-champagne); margin-top: 8px; }
    .flow-title { font-family: var(--font-display); font-style: italic; font-size: 1.5rem; }
    .flow-text { color: var(--color-ink-2); max-width: 30ch; }
    .ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; grid-template-rows: auto auto; min-height: 0; padding-top: 70px; }
      .hang-zone { grid-column: 1; grid-row: 1; height: 600px; }
      .copy { grid-row: 2; padding-top: 10px; }
      .pendulum { --strap: 100px; width: 210px; margin-left: -105px; }
      .row { grid-template-columns: 36px minmax(0, 1fr) 44px; }
      .row .group { display: none; }
      .panel-inner { grid-template-columns: 1fr; padding-left: 0; gap: 18px; }
      .thumb { width: 130px; }
      .sky-grid { grid-template-columns: 1fr; }
      .drone-zone { height: 300px; }
      .flow { grid-template-columns: 1fr; }
      .flow::before { display: none; }
    }
  `,
})
export default class Gear {
  protected readonly gear = GEAR;
  protected readonly open = signal<number | null>(0);
  protected readonly camera = cutout('camara-colgante');
  protected readonly cameraSrc = cutoutSrc('camara-colgante');
  protected readonly droneSrc = cutoutSrc('dron');
  protected readonly droneOffset = signal('0 0');
  protected readonly droneShadow = signal('0 0');
  protected readonly backup = [
    { icon: 'camera' as const, when: 'En el evento', title: 'Doble tarjeta', text: 'Cada foto se graba en dos tarjetas al mismo tiempo, en cada cámara.' },
    { icon: 'download' as const, when: 'Esa misma noche', title: 'Discos en espejo', text: 'Al llegar al estudio, copio todo a un arreglo de discos que se respaldan entre sí.' },
    { icon: 'check' as const, when: 'Al día siguiente', title: 'Copia en la nube', text: 'Una tercera copia cifrada fuera del estudio. Las tarjetas no se borran hasta entregarte.' },
  ];

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // Péndulo: ángulo (rad), velocidad angular (rad/s).
  private theta = 0;
  private omega = 0;
  private last = { x: 0, t: 0 };

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.host.querySelector<HTMLElement>('.pendulum')!;
      const shadow = this.host.querySelector<HTMLElement>('.shadow')!;
      const reduced = prefersReducedMotion();
      let raf = 0;
      let prev = performance.now();
      let t = 0;
      // Correa: del riel a la cámara, según el alto disponible.
      const fit = () => {
        const zone = this.host.querySelector<HTMLElement>('.hang-zone')!;
        const camH = el.querySelector('img')!.getBoundingClientRect().height || 300;
        const strap = Math.max(60, zone.clientHeight - camH - 150);
        el.style.setProperty('--strap', `${innerWidth < 900 ? Math.min(90, strap) : strap}px`);
      };
      fit();
      addEventListener('resize', fit);
      // Un empujoncito al llegar, para que se note que cuelga.
      if (!reduced) this.omega = 0.55;
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.033, (now - prev) / 1000);
        prev = now;
        t += dt;
        const L = el.offsetHeight / 100; // metros "visuales"
        const g = 9.8;
        // θ'' = -(g/L)·sen θ − c·θ'  (amortiguado)
        const alpha = -(g / Math.max(2.5, L)) * Math.sin(this.theta) - 0.55 * this.omega;
        this.omega += alpha * dt;
        this.theta += this.omega * dt;
        this.theta = Math.max(-0.5, Math.min(0.5, this.theta));
        // Vaivén muy leve aunque nadie la toque.
        const idle = reduced ? 0 : Math.sin(t * 0.8) * 0.006;
        const a = this.theta + idle;
        el.style.transform = `rotate(${a.toFixed(4)}rad) rotateY(${(this.omega * 18).toFixed(2)}deg)`;
        shadow.style.transform = `translateX(${(Math.sin(a) * 260).toFixed(1)}px) scaleX(${(1 - Math.abs(a) * 0.6).toFixed(3)})`;
      };
      raf = requestAnimationFrame(tick);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        removeEventListener('resize', fit);
      });
    });
  }

  /** El cursor o el dedo empujan la cámara solo si la tocan, con la velocidad que traen. */
  protected push(e: PointerEvent) {
    const now = performance.now();
    const dt = Math.max(8, now - this.last.t);
    const vx = (e.clientX - this.last.x) / dt; // px/ms
    this.last = { x: e.clientX, t: now };
    if (!this.overCamera(e) || Math.abs(vx) > 6) return;
    this.omega += Math.max(-0.45, Math.min(0.45, vx * 0.22));
  }

  protected tap(e: PointerEvent) {
    if (e.pointerType === 'mouse' || !this.overCamera(e)) return;
    const img = this.host.querySelector('.camera')!.getBoundingClientRect();
    this.omega += (e.clientX < img.left + img.width / 2 ? 1 : -1) * 0.5;
  }

  private overCamera(e: PointerEvent) {
    const r = this.host.querySelector('.camera')!.getBoundingClientRect();
    return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top + r.height * 0.45 && e.clientY < r.bottom;
  }

  /** El dron se aparta del cursor, despacio. */
  protected dodge(e: PointerEvent | null) {
    if (!e || e.pointerType !== 'mouse') {
      this.droneOffset.set('0 0');
      this.droneShadow.set('0 0');
      return;
    }
    const zone = this.host.querySelector<HTMLElement>('.drone-zone')!.getBoundingClientRect();
    const cx = zone.left + zone.width / 2;
    const cy = zone.top + zone.height / 2;
    const dx = cx - e.clientX;
    const dy = cy - e.clientY;
    const d = Math.hypot(dx, dy);
    if (d > 420) {
      this.droneOffset.set('0 0');
      this.droneShadow.set('0 0');
      return;
    }
    const f = (1 - d / 420) * 70;
    const ox = (dx / (d || 1)) * f;
    const oy = (dy / (d || 1)) * f * 0.6;
    this.droneOffset.set(`${ox.toFixed(0)}px ${oy.toFixed(0)}px`);
    this.droneShadow.set(`${ox.toFixed(0)}px 0`);
  }

  protected toggle(i: number) {
    this.open.update((v) => (v === i ? null : i));
  }

  protected cut(name: string) {
    return cutoutSrc(name);
  }
}
