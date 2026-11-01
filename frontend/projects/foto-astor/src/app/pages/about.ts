import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND } from '../core/content';
import { photo, photoSrc, seeded } from '../core/media';
import { hasFinePointer, prefersReducedMotion, useGsap } from '../core/motion';
import { BinderClip } from '../shared/binder-clip';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { CountUp, Reveal } from '../shared/reveal';
import { Stick } from '../shared/stick';

const COLS = 4;
const ROWS = 5;

/**
 * Sobre mí: el retrato de Emilio partido en mosaicos (como la referencia del fotógrafo en cuadros) con notas
 * adhesivas, y su historia en hojas sujetas con clips, una copia impresa y cifras.
 */
@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Reveal, CountUp, BinderClip, Celestial, Icon, Stick],
  template: `
    <section class="hero" (pointermove)="parallax($event)" (pointerleave)="parallax(null)">
      <div class="container hero-grid">
        <div class="copy">
          <p class="label kicker">Sobre mí</p>
          <h1 class="title">Nueve años en primera fila <em>de las fiestas de otros.</em></h1>
          <p class="lead">
            Soy Emilio Astor, fotógrafo de bodas y eventos sociales en Aguascalientes. Me gusta llegar temprano,
            hablar poco y estar donde pasan las cosas, sin que nadie tenga que posar para mí.
          </p>
          <div class="ctas">
            <a routerLink="/equipo" class="btn btn-ink"><span class="btn-t">Ver mi equipo</span></a>
            <a routerLink="/contacto" class="btn btn-line"><span class="btn-t">Escríbeme</span></a>
          </div>
        </div>

        <div class="mosaic" aria-label="Retrato de Emilio Astor con su cámara" role="img">
          <p class="name script" aria-hidden="true">Emilio Astor</p>
          <div class="tiles">
            @for (t of tiles; track t.i) {
              <span
                class="tile"
                [style.--x]="t.c"
                [style.--y]="t.r"
                [style.--rot]="t.rot + 'deg'"
                [style.--dx]="t.dx + 'px'"
                [style.--dy]="t.dy + 'px'"
                [style.--depth]="t.depth"
                [style.background-image]="portrait"
              ></span>
            }
          </div>
          @for (n of notes; track n.text) {
            <span class="note" appStick [style.left.%]="n.x" [style.top.%]="n.y" [style.--rot]="n.rot + 'deg'">{{ n.text }}</span>
          }
        </div>
      </div>
    </section>

    <section class="section story" aria-labelledby="story-title">
      <div class="container">
        <h2 id="story-title" class="visually-hidden">Mi historia</h2>
        <div class="sheets">
          <article class="sheet white stacked" data-reveal style="--rot: -1.2deg">
            <app-binder-clip class="clip" />
            <h3 class="script st">Me llamo Emilio</h3>
            <p class="label sub">Formación · primeras bodas · camino</p>
            <p class="body">
              Estudié comunicación en la UAA y me quedé con la clase de fotografía. Mi primera boda fue la de mi prima
              Lucía, en 2017, con una cámara prestada y dos lentes. Esa noche entendí que lo que me gustaba no era la foto
              bonita, sino la gente: el tío que baila solo, la abuela que llora antes que nadie.
            </p>
            <p class="body">Desde entonces llevo más de 300 bodas y 140 XV años en Aguascalientes y los estados vecinos.</p>
          </article>

          <article class="sheet white tilt stacked-dark" data-reveal [revealDelay]="120" style="--rot: 1.6deg">
            <app-binder-clip class="clip" />
            <h3 class="script st">¿Por qué bodas?</h3>
            <p class="body">
              Porque es el único día en que toda la familia está junta y arreglada. Porque después del vals ya nadie posa.
              Y porque una foto de boda vale más cada año que pasa: en veinte años, esas fotos son lo único que queda de esa noche.
            </p>
            <p class="body">Me importa que tus nietos reconozcan cómo se sentía, no solo cómo se veía.</p>
          </article>

          <article class="sheet white has-photo" data-reveal style="--rot: 0.8deg">
            <app-binder-clip class="clip" />
            <h3 class="script st">Fuera de cámara</h3>
            <p class="label sub">Lo que hago cuando no hay boda</p>
            <p class="body">
              Me vas a encontrar en bicicleta por la Sierra Fría, formado por gorditas en el mercado o revelando rollos en el
              baño de mi casa. Viajo con una cámara de película y casi nunca la saco. Me gusta el café sin azúcar y las
              canciones de Juan Gabriel a las dos de la mañana.
            </p>
            <figure class="print-card" appStick style="--rot: -6deg">
              <span class="corners" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <span class="ph"><img [src]="src('emilio-camara')" alt="Emilio tomando una foto con luz de ventana" loading="lazy" draggable="false" /></span>
              <figcaption><span class="label">El estudio · 2024</span><svg class="stamp" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" /></svg></figcaption>
            </figure>
          </article>

          <article class="sheet ink stacked" data-reveal [revealDelay]="120" style="--rot: -1.6deg">
            <app-binder-clip class="clip" />
            <h3 class="script st">Cómo trabajo</h3>
            <p class="body">
              Llego una hora antes y conozco a tu coordinadora. Hablo poco y observo mucho. Solo doy indicaciones en los
              retratos, y aun así trato de que parezcan una plática. Nunca uso flash directo durante la ceremonia.
            </p>
            <p class="body">
              Edito cada foto a mano. Si algo no me gusta, no te lo entrego. Prefiero darte 600 fotos que te hagan llorar
              que 1,500 para llenar un disco.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="numbers on-night" aria-label="En números">
      <div class="container nums">
        @for (n of numbers; track n.label) {
          <div class="num" data-reveal>
            <span class="big"><span [countUp]="n.value">{{ n.value }}</span>{{ n.suffix }}</span>
            <span class="label">{{ n.label }}</span>
          </div>
        }
      </div>
    </section>

    <section class="section moves" aria-labelledby="moves-title">
      <div class="container moves-grid">
        <div class="copy" data-reveal>
          <p class="label kicker">Lo que me mueve</p>
          <h2 id="moves-title" class="title-2">La luz de las cinco de la tarde, <em>los abrazos que nadie planeó</em></h2>
          <p class="lead">
            Busco lo que pasa entre las fotos que todos esperan: la mano que acomoda el velo, la mirada del papá antes del
            vals, el primo que se trepa a la silla. Ahí está la boda de verdad.
          </p>
          <a routerLink="/galeria" class="link">Recorrer la galería <app-icon name="arrow-right" [size]="16" /></a>
        </div>
        <div class="collage" data-reveal="scale">
          <span class="board" aria-hidden="true"></span>
          <app-binder-clip class="clip big" />
          @for (p of collage; track p.name; let i = $index) {
            <figure class="pol" appStick [style.--rot]="p.rot + 'deg'" [style.left.%]="p.x" [style.top.%]="p.y" [style.--w]="p.w + '%'" [style.z-index]="i + 1">
              @if (i % 2 === 0) {
                <span class="corners" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              }
              <span class="ph"><img [src]="src(p.name)" [alt]="alt(p.name)" loading="lazy" draggable="false" /></span>
            </figure>
          }
        </div>
      </div>
    </section>

    <section class="section sign" aria-label="Firma">
      <div class="container sign-wrap" data-reveal>
        <app-celestial class="sign-deco twinkle" kind="moon" />
        <p class="script signature">Emilio</p>
        <p class="lead center">Si llegaste hasta aquí, ya nos caímos bien. Cuéntame de tu fecha.</p>
        <div class="ctas center">
          <a routerLink="/contacto" fragment="fechas" class="btn btn-ink"><span class="btn-t">Ver fechas disponibles</span></a>
          <a routerLink="/paquetes" class="btn btn-line"><span class="btn-t">Paquetes</span></a>
        </div>
        <p class="label muted">{{ brand.instagram }} · {{ brand.email }}</p>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; overflow: hidden; padding: 140px 0 80px; }
    .hero-grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(32px, 5vw, 80px); align-items: center; }
    .copy { display: grid; gap: 22px; align-content: center; }
    .title { font-size: var(--text-3xl); }
    .title em { display: block; color: var(--color-accent); }
    .ctas { display: flex; flex-wrap: wrap; gap: 12px; }
    .ctas.center { justify-content: center; }

    .mosaic { position: relative; aspect-ratio: 4 / 5; max-width: 560px; width: 100%; justify-self: center; }
    .name { position: absolute; left: -18%; right: -18%; top: 41%; z-index: 2; text-align: center; font-size: clamp(3.8rem, 9vw, 7.4rem); color: var(--color-ink); white-space: nowrap; pointer-events: none; text-shadow: 0 0 18px rgb(239 236 230 / 70%); }
    .tiles { position: absolute; inset: 0; z-index: 1; }
    .tile {
      position: absolute;
      left: calc(var(--x) * 25%);
      top: calc(var(--y) * 20%);
      width: 25%;
      height: 20%;
      background-size: 400% 500%;
      background-position: calc(var(--x) * 33.333%) calc(var(--y) * 25%);
      box-shadow: 0 1px 2px rgb(0 0 0 / 18%), 0 8px 16px -8px rgb(0 0 0 / 35%);
      border: 2px solid #f4f5f8;
      transform: translate(calc(var(--dx) + var(--px, 0px) * var(--depth)), calc(var(--dy) + var(--py, 0px) * var(--depth))) rotate(var(--rot));
      transition: transform 900ms var(--ease-out);
    }
    .note {
      position: absolute;
      z-index: 3;
      display: grid;
      place-items: center;
      width: 23%;
      aspect-ratio: 1;
      padding: 8px;
      background: #f2d9d4;
      box-shadow: 0 2px 3px rgb(0 0 0 / 12%), 0 12px 18px -10px rgb(0 0 0 / 35%);
      font-family: 'Courier New', ui-monospace, monospace;
      font-size: clamp(0.72rem, 1.3vw, 1rem);
      color: #2d2a24;
      text-align: center;
      rotate: var(--rot);
    }

    .story { background: linear-gradient(var(--color-paper), var(--color-paper-2)); }
    .sheets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(48px, 6vw, 96px) clamp(28px, 4vw, 64px); align-items: start; }
    .sheet { position: relative; padding: clamp(48px, 6vw, 72px) clamp(26px, 4vw, 52px) clamp(30px, 4vw, 48px); rotate: var(--rot); box-shadow: var(--shadow-paper); }
    .sheet.white { background: var(--color-card); color: var(--color-ink); }
    .sheet.ink { background: #1a2133; color: #e9ecf3; margin-top: 60px; }
    .sheet.tilt { margin-top: 90px; }
    .stacked { box-shadow: 14px 16px 0 0 #dfe3ea, 14px 16px 22px 0 rgb(10 16 34 / 22%), var(--shadow-paper); }
    .stacked-dark { box-shadow: -14px 16px 0 0 #1d2538, -14px 16px 22px 0 rgb(10 16 34 / 25%), var(--shadow-paper); }
    .clip { position: absolute; left: 34px; top: -46px; z-index: 2; --clip-w: 58px; rotate: -8deg; }
    .st { font-size: clamp(2.6rem, 4.4vw, 3.6rem); margin-bottom: 14px; text-align: center; }
    .sub { margin-bottom: 18px; color: inherit; opacity: 0.75; }
    .body { font-family: var(--font-label); font-size: 0.98rem; font-weight: 400; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.6; }
    .body + .body { margin-top: 14px; }
    /* La copia queda en una esquina libre (abajo, fuera del texto), sujeta con esquineros de álbum; se puede sacar y mover. */
    .sheet.has-photo { padding-bottom: clamp(150px, 16vw, 210px); }
    .print-card { position: absolute; right: -26px; bottom: -90px; width: 40%; padding: 9px 9px 0; rotate: var(--rot); }
    .print-card figcaption { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 34px; color: rgb(36 33 28 / 60%); font-size: 0.56rem; }
    .print-card .stamp { width: 17px; height: 17px; }

    /* Copias de cuarto oscuro (no instantáneas): papel de fibra con margen parejo, filo negro del portanegativos,
       sello de la estrella en seco y esquineros de álbum en lugar de cinta. */
    .print-card, .pol { background: radial-gradient(120% 90% at 30% 10%, #f7f4ee, #ebe5d8); box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 8%), var(--shadow-lift); border-radius: 1px; }
    .ph { position: relative; display: block; overflow: hidden; border-radius: 1px; box-shadow: 0 0 0 2.5px #14110d, 0 0 0 3.5px rgb(20 17 13 / 30%); }
    .ph::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 14px rgb(0 0 0 / 28%); pointer-events: none; }
    .ph img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
    .stamp { color: #ece7dc; filter: drop-shadow(-0.7px -0.7px 0 rgb(255 255 255 / 95%)) drop-shadow(0.8px 0.9px 0.5px rgb(60 48 30 / 35%)); }
    .corners i { position: absolute; z-index: 2; width: 26px; height: 26px; pointer-events: none; background: linear-gradient(135deg, #8f4543 0 50%, transparent 50%); filter: drop-shadow(1px 2px 1.5px rgb(10 16 34 / 40%)); }
    .corners i::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 46%, rgb(255 255 255 / 18%) 47% 50%, transparent 51%); }
    .corners i:nth-child(1) { left: -5px; top: -5px; }
    .corners i:nth-child(2) { right: -5px; top: -5px; rotate: 90deg; }
    .corners i:nth-child(3) { right: -5px; bottom: -5px; rotate: 180deg; }
    .corners i:nth-child(4) { left: -5px; bottom: -5px; rotate: 270deg; }

    .numbers { padding-block: 72px; }
    .nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
    .num { display: grid; gap: 6px; justify-items: center; text-align: center; }
    .big { font-family: var(--font-display); font-size: clamp(2.8rem, 6vw, 5rem); line-height: 1; }
    .num .label { color: var(--color-on-night-2); }

    .moves-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(40px, 6vw, 100px); align-items: center; }
    .title-2 { font-size: var(--text-2xl); }
    .title-2 em { color: var(--color-accent); }
    .moves .copy { gap: 20px; justify-items: start; }
    .collage { position: relative; aspect-ratio: 1 / 1.1; }
    .board { position: absolute; inset: 8% 6% 4% 10%; background: #f7f5f0; box-shadow: var(--shadow-paper); rotate: -2deg; }
    .board::after { content: ''; position: absolute; inset: 4% -5% -5% 6%; z-index: -1; background: #1a2133; rotate: 3deg; }
    .clip.big { left: 12%; top: 0; --clip-w: 82px; }
    .pol { position: absolute; width: var(--w); padding: 8px; rotate: var(--rot); transition: rotate 500ms var(--ease-out), scale 500ms var(--ease-out), box-shadow 300ms ease; }
    .pol .ph img { aspect-ratio: 4 / 4.6; }
    .pol .corners i { width: 20px; height: 20px; }
    @media (hover: hover) and (pointer: fine) {
      .pol:hover { rotate: 0deg; scale: 1.06; z-index: 10 !important; }
    }

    .sign-wrap { position: relative; display: grid; justify-items: center; gap: 18px; text-align: center; }
    .signature { font-size: clamp(5rem, 14vw, 9rem); line-height: 0.9; }
    .center { text-align: center; }
    .muted { color: var(--color-muted); }
    .sign-deco { position: absolute; top: -20px; right: 16%; --size: 80px; opacity: 0.3; }

    @media (max-width: 900px) {
      .hero { padding-top: 110px; }
      .hero-grid, .moves-grid { grid-template-columns: 1fr; }
      .mosaic { order: -1; max-width: 420px; }
      .sheets { grid-template-columns: 1fr; gap: 80px; }
      .sheet.tilt, .sheet.ink { margin-top: 0; }
      .print-card { right: -8px; bottom: -80px; width: 46%; }
      .nums { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 40px; }
    }
  `,
})
export default class About {
  protected readonly brand = BRAND;
  protected readonly portrait = `url(${photoSrc(photo('emilio'))})`;
  protected readonly tiles = (() => {
    const rnd = seeded(41);
    return Array.from({ length: COLS * ROWS }, (_, i) => ({
      i,
      c: i % COLS,
      r: Math.floor(i / COLS),
      rot: (rnd() - 0.5) * 7,
      dx: (rnd() - 0.5) * 10,
      dy: (rnd() - 0.5) * 10,
      depth: 0.4 + rnd() * 1.2,
    }));
  })();
  protected readonly notes = [
    { text: 'Busco', x: 74, y: 8, rot: 4 },
    { text: 'lo que', x: -6, y: 30, rot: -5 },
    { text: 'nadie', x: 78, y: 56, rot: -3 },
    { text: 'está mirando', x: 2, y: 78, rot: 5 },
  ];
  protected readonly numbers = [
    { value: 9, suffix: '', label: 'años fotografiando' },
    { value: 312, suffix: '', label: 'bodas' },
    { value: 140, suffix: '+', label: 'XV años' },
    { value: 72, suffix: ' h', label: 'para tu adelanto' },
  ];
  protected readonly collage = [
    { name: 'confeti-beso-bn', x: 14, y: 14, w: 40, rot: -8 },
    { name: 'xv-corona', x: 50, y: 10, w: 36, rot: 6 },
    { name: 'abuelo-bn', x: 20, y: 48, w: 40, rot: 4 },
    { name: 'giro-luces', x: 54, y: 46, w: 38, rot: -5 },
  ];

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (prefersReducedMotion()) return;
      const { gsap } = useGsap();
      const q = gsap.utils.selector(this.host);
      // Los mosaicos llegan desordenados y se acomodan desde el centro; luego caen las notas.
      const ctx = gsap.context(() => {
        gsap.from(q('.tile'), {
          opacity: 0,
          x: () => (Math.random() - 0.5) * 260,
          y: () => (Math.random() - 0.5) * 260,
          rotation: () => (Math.random() - 0.5) * 50,
          scale: 0.8,
          duration: 1.3,
          ease: 'expo.out',
          stagger: { each: 0.025, from: 'center', grid: [ROWS, COLS] },
          clearProps: 'transform,opacity',
        });
        gsap.from(q('.note'), { opacity: 0, y: -30, scale: 1.2, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.12, delay: 0.9 });
        gsap.from(q('.name'), { opacity: 0, x: -60, duration: 1.4, ease: 'expo.out', delay: 0.4 });
        gsap.from(q('.hero .copy > *'), { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.2 });
      }, this.host);
      destroyRef.onDestroy(() => ctx.revert());
    });
  }

  /** Los mosaicos se mueven un poco con el cursor, cada uno a su profundidad. */
  protected parallax(e: PointerEvent | null) {
    if (!hasFinePointer()) return;
    const mosaic = this.host.querySelector<HTMLElement>('.mosaic');
    if (!mosaic) return;
    if (!e) {
      mosaic.style.setProperty('--px', '0px');
      mosaic.style.setProperty('--py', '0px');
      return;
    }
    const r = mosaic.getBoundingClientRect();
    mosaic.style.setProperty('--px', `${((e.clientX - (r.left + r.width / 2)) / r.width) * 14}px`);
    mosaic.style.setProperty('--py', `${((e.clientY - (r.top + r.height / 2)) / r.height) * 14}px`);
  }

  protected src(name: string) {
    return photoSrc(photo(name), true);
  }

  protected alt(name: string) {
    return photo(name).alt;
  }
}
