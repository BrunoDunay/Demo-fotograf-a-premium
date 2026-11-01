import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Booking } from '../core/booking';
import { EXTRAS, FAQ, PACKAGES, PROCESS, Package } from '../core/content';
import { photo, photoSrc } from '../core/media';
import { BinderClip } from '../shared/binder-clip';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

const GROUPS: { id: string; name: Package['group']; script: string }[] = [
  { id: 'bodas', name: 'Bodas', script: 'el día entero' },
  { id: 'xv', name: 'XV años', script: 'su noche' },
  { id: 'social', name: 'Eventos sociales', script: 'lo que se celebra' },
];

/** Paquetes como boletos de evento (referencia), extras con puntos guía, el proceso y preguntas frecuentes. */
@Component({
  selector: 'app-packages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Reveal, BinderClip],
  template: `
    <section class="hero">
      <div class="container">
        <p class="label kicker">Paquetes y precios</p>
        <h1 class="title">Precios claros <em>desde el inicio</em></h1>
        <p class="lead">
          Todos incluyen edición foto por foto, galería privada en línea y un adelanto en 72 horas. Precios en pesos,
          más IVA si necesitas factura. Se aparta con el 30 %.
        </p>
        <nav class="chips" aria-label="Tipos de evento">
          @for (g of groups; track g.id) {
            <a [href]="'#' + g.id" class="chip">{{ g.name }}</a>
          }
        </nav>
      </div>
    </section>

    @for (g of groups; track g.id) {
      <section class="group" [id]="g.id" [attr.aria-labelledby]="'g-' + g.id">
        <div class="container">
          <header class="group-head" data-reveal>
            <h2 [id]="'g-' + g.id" class="group-title">{{ g.name }} <em>{{ g.script }}</em></h2>
          </header>
          <ul class="tickets">
            @for (p of byGroup(g.name); track p.id; let i = $index) {
              <li class="ticket" [class.featured]="p.featured" [class.open]="open() === p.id" data-reveal [revealDelay]="i * 80">
                <figure class="pic">
                  <img [src]="src(p.photo)" [alt]="alt(p.photo)" loading="lazy" />
                </figure>
                @if (p.featured) {
                  <p class="ribbon label"><span>★ Recomendado</span></p>
                }
                <div class="info">
                  <p class="hours">{{ p.hours }}</p>
                  <h3 class="name">{{ p.name }}</h3>
                  <p class="summary">{{ p.summary }}</p>
                  <div class="actions">
                    <button type="button" class="more" [attr.aria-expanded]="open() === p.id" [attr.aria-controls]="'inc-' + p.id" (click)="toggle(p.id)">
                      Qué incluye <app-icon name="chevron-down" [size]="16" />
                    </button>
                    <button type="button" class="btn want" [class.btn-ink]="!p.featured" [class.btn-accent]="p.featured" (click)="want(p)"><span class="btn-t">Me interesa</span></button>
                  </div>
                  <div class="includes" [id]="'inc-' + p.id" role="region">
                    <ul>
                      @for (it of p.includes; track it) {
                        <li><app-icon name="check" [size]="14" /> {{ it }}</li>
                      }
                    </ul>
                  </div>
                </div>
                <div class="price">
                  <span class="dots" aria-hidden="true"></span>
                  <span class="from script">desde</span>
                  <span class="amount">{{ money(p.price) }}</span>
                  <span class="label cur">MXN</span>
                  @if (p.featured) {
                    <span class="value">La mejor relación entre horas, entregables y precio</span>
                  }
                </div>
              </li>
            }
          </ul>
        </div>
      </section>
    }

    <section class="section extras" aria-labelledby="extras-title">
      <div class="container extras-grid">
        <div data-reveal>
          <p class="label kicker">Extras</p>
          <h2 id="extras-title" class="title-2">Súmale lo que <em>quieras</em></h2>
          <p class="lead">A cualquier paquete. Si no ves algo, pregúntame: casi todo se puede.</p>
        </div>
        <div class="menu paper" data-reveal>
          <app-binder-clip class="clip" />
          <ul>
            @for (x of extras; track x.name) {
              <li>
                <span class="x-name">{{ x.name }}<small>{{ x.note }}</small></span>
                <span class="leader" aria-hidden="true"></span>
                <span class="x-price">{{ money(x.price) }}</span>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>

    <section class="section process on-night" aria-labelledby="process-title">
      <div class="container">
        <p class="label kicker" data-reveal>Cómo trabajamos</p>
        <h2 id="process-title" class="title-2" data-reveal>De la primera plática <em>a la entrega</em></h2>
        <ol class="steps">
          @for (s of process; track s.n) {
            <li class="step" data-reveal>
              <span class="dot" aria-hidden="true"></span>
              <p class="label n">{{ s.n }}</p>
              <h3 class="step-title">{{ s.title }}</h3>
              <p class="step-text">{{ s.text }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section faq" aria-labelledby="faq-title">
      <div class="container faq-grid">
        <div data-reveal>
          <p class="label kicker">Preguntas frecuentes</p>
          <h2 id="faq-title" class="title-2">Lo que todos <em>me preguntan</em></h2>
          <a routerLink="/contacto" class="link">¿Otra duda? Escríbeme <app-icon name="arrow-right" [size]="16" /></a>
        </div>
        <ul class="qa">
          @for (f of faq; track f.q; let i = $index) {
            <li [class.open]="faqOpen() === i" data-reveal>
              <button type="button" [attr.aria-expanded]="faqOpen() === i" [attr.aria-controls]="'qa-' + i" (click)="faqOpen.set(faqOpen() === i ? null : i)">
                <span>{{ f.q }}</span>
                <span class="sign" aria-hidden="true"><app-icon name="plus" [size]="16" /></span>
              </button>
              <div class="a" [id]="'qa-' + i" role="region"><p>{{ f.a }}</p></div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .hero { padding: 150px 0 40px; }
    .hero .container { display: grid; gap: 20px; }
    .title { font-size: var(--text-3xl); }
    .title em { color: var(--color-accent); }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
    .chip { display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: var(--radius-pill); box-shadow: inset 0 0 0 1px var(--color-line-2); font-family: var(--font-label); font-size: 0.74rem; letter-spacing: 0.18em; text-transform: uppercase; transition: background-color 300ms ease, color 300ms ease; }
    .chip:active { scale: 0.96; }
    @media (hover: hover) and (pointer: fine) { .chip:hover { background: var(--color-ink); color: var(--color-paper); } }

    .group { padding-block: 56px; scroll-margin-top: 90px; }
    .group-head { margin-bottom: 28px; }
    .group-title { font-size: var(--text-2xl); display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 18px; }
    .group-title em { font-size: 0.9em; color: var(--color-accent); }
    .tickets { display: grid; gap: 22px; }
    .ticket {
      position: relative;
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr) 210px;
      gap: 0;
      background: var(--color-card);
      border-radius: 14px;
      box-shadow: var(--shadow-paper);
      transition: box-shadow 400ms ease, translate 400ms var(--ease-out);
    }
    /* El más pedido: boleto de noche, más grande, con halo de acento, sello que gira y listón. */
    .ticket.featured {
      background: radial-gradient(120% 140% at 0% 0%, #1c2742, var(--color-night) 70%);
      color: var(--color-on-night);
      scale: 1.025;
      margin-block: 18px;
      box-shadow: 0 0 0 1px rgb(226 167 160 / 55%), 0 30px 70px -28px rgb(164 81 79 / 70%), var(--shadow-lift);
    }
    .ticket.featured::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: conic-gradient(from var(--spin, 0deg), transparent 0 70%, var(--color-accent-soft) 85%, transparent 100%); mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); animation: halo 5s linear infinite; pointer-events: none; }
    @property --spin { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
    @keyframes halo { to { --spin: 360deg; } }
    .ticket.featured .hours, .ticket.featured .summary, .ticket.featured .cur, .ticket.featured .from { color: var(--color-on-night-2); }
    .ticket.featured .name { color: var(--color-accent-soft); }
    .ticket.featured .dots { border-color: rgb(233 236 243 / 18%); }
    .ticket.featured .includes app-icon { color: var(--color-accent-soft); }
    .ticket.featured .amount { font-size: clamp(2.4rem, 4vw, 3.4rem); }
    .value { margin-top: 10px; max-width: 18ch; text-align: center; font-size: 0.8rem; line-height: 1.4; color: var(--color-accent-soft); }
    .ribbon { position: absolute; z-index: 2; top: 22px; left: -8px; padding: 7px 14px 7px 16px; background: var(--color-accent); color: #fff; font-size: 0.6rem; box-shadow: 0 6px 14px -6px rgb(0 0 0 / 50%); }
    .ribbon::after { content: ''; position: absolute; left: 0; top: 100%; border: 4px solid transparent; border-top-color: #6e3231; border-right-color: #6e3231; }
    @media (hover: hover) and (pointer: fine) { .ticket:not(.featured):hover { translate: 0 -3px; box-shadow: var(--shadow-lift); } .ticket.featured:hover { translate: 0 -4px; } }
    .pic { position: relative; margin: 12px; border-radius: 10px; overflow: hidden; }
    .pic img { width: 100%; height: 100%; min-height: 200px; object-fit: cover; }

    .info { padding: 26px 24px 22px; }
    .hours { font-family: var(--font-label); font-size: 0.8rem; letter-spacing: 0.08em; color: var(--color-muted); }
    .name { font-family: var(--font-display); font-style: italic; font-size: clamp(2rem, 3.6vw, 2.8rem); margin-top: 6px; }
    .summary { margin-top: 8px; color: var(--color-ink-2); max-width: 46ch; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 18px; }
    .more { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-weight: 500; }
    .more app-icon { transition: rotate 400ms var(--ease-out); }
    .ticket.open .more app-icon { rotate: 180deg; }
    .want { min-height: 44px; padding: 0 20px; font-size: 0.68rem; }
    .includes { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 500ms var(--ease-out); }
    .ticket.open .includes { grid-template-rows: 1fr; }
    .includes ul { overflow: hidden; display: grid; gap: 8px; }
    .ticket.open .includes ul { padding-top: 16px; }
    .includes li { display: flex; gap: 10px; align-items: baseline; font-size: 0.95rem; }
    .includes app-icon { color: var(--color-accent); translate: 0 2px; }
    .price { position: relative; display: grid; align-content: center; justify-items: center; padding: 20px; }
    .dots { position: absolute; left: 0; top: 18%; bottom: 18%; border-left: 3px dotted var(--color-paper-3); }
    .from { font-size: 2rem; color: var(--color-muted); line-height: 0.8; }
    .amount { font-family: var(--font-display); font-size: clamp(2rem, 3.4vw, 2.9rem); line-height: 1.1; }
    .cur { color: var(--color-muted); }

    .extras-grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(32px, 6vw, 96px); align-items: start; }
    .title-2 { font-size: var(--text-2xl); margin: 14px 0; }
    .title-2 em { color: var(--color-accent); }
    .on-night .title-2 em { color: var(--color-accent-soft); }
    .menu { padding: 50px clamp(22px, 4vw, 44px) 30px; rotate: 0.6deg; }
    .menu .clip { position: absolute; left: 50%; top: -44px; translate: -50% 0; --clip-w: 60px; }
    .menu ul { display: grid; gap: 4px; }
    .menu li { display: grid; grid-template-columns: auto 1fr auto; align-items: baseline; gap: 10px; padding: 12px 0; }
    .x-name { display: grid; font-size: 1.02rem; }
    .x-name small { font-size: 0.8rem; color: var(--color-muted); }
    .leader { border-bottom: 2px dotted var(--color-paper-3); translate: 0 -6px; }
    .x-price { font-family: var(--font-display); font-size: 1.3rem; }

    .steps { position: relative; display: grid; gap: 0; margin-top: 48px; padding-left: 34px; }
    .steps::before { content: ''; position: absolute; left: 7px; top: 10px; bottom: 10px; width: 1px; background: var(--color-line-night); }
    .step { position: relative; padding-bottom: 40px; max-width: 640px; }
    .dot { position: absolute; left: -34px; top: 4px; width: 15px; height: 15px; border-radius: 50%; background: var(--color-on-night); box-shadow: 0 0 0 5px var(--color-night); }
    .step .n { color: var(--color-accent-soft); }
    .step-title { font-size: 1.9rem; font-style: italic; margin: 6px 0 8px; }
    .step-text { color: var(--color-on-night-2); }

    .faq-grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(32px, 6vw, 96px); }
    .faq-grid > div { display: grid; gap: 4px; align-content: start; justify-items: start; }
    .qa { border-top: 1px solid var(--color-line); }
    .qa li { border-bottom: 1px solid var(--color-line); }
    .qa button { display: flex; justify-content: space-between; align-items: center; gap: 16px; width: 100%; min-height: 64px; padding: 14px 0; text-align: left; font-size: 1.08rem; font-weight: 500; }
    .sign { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--color-line-2); transition: rotate 400ms var(--ease-out); }
    .qa li.open .sign { rotate: 45deg; }
    .a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 450ms var(--ease-out); }
    .qa li.open .a { grid-template-rows: 1fr; }
    .a p { overflow: hidden; color: var(--color-ink-2); }
    .qa li.open .a p { padding-bottom: 20px; }

    @media (max-width: 900px) {
      .ticket { grid-template-columns: 1fr; }
      .pic { margin: 10px 10px 0; aspect-ratio: 16 / 9; }
      .pic img { min-height: 0; }
      .price { grid-template-columns: auto auto auto; justify-content: start; align-items: baseline; gap: 10px; padding: 0 24px 22px; }
      .dots { left: 24px; right: 24px; top: -4px; bottom: auto; border-left: 0; border-top: 3px dotted var(--color-paper-3); }
      .price .from { font-size: 1.6rem; }
      .info { padding-bottom: 14px; }
      .extras-grid, .faq-grid { grid-template-columns: 1fr; }
      .ticket.featured { scale: 1; }
      .value { grid-column: 1 / -1; text-align: left; max-width: none; margin-top: 0; }
    }
  `,
})
export default class Packages {
  protected readonly groups = GROUPS;
  protected readonly extras = EXTRAS;
  protected readonly process = PROCESS;
  protected readonly faq = FAQ;
  protected readonly open = signal<string | null>(null);
  protected readonly faqOpen = signal<number | null>(0);
  private readonly booking = inject(Booking);
  private readonly router = inject(Router);

  protected byGroup(g: Package['group']) {
    return PACKAGES.filter((p) => p.group === g);
  }

  protected toggle(id: string) {
    this.open.update((v) => (v === id ? null : id));
  }

  protected want(p: Package) {
    this.booking.packageName.set(`${p.group} · ${p.name}`);
    this.booking.eventType.set(p.group === 'Bodas' ? 'Boda' : p.group === 'XV años' ? 'XV años' : 'Bautizo');
    this.router.navigate(['/contacto'], { fragment: 'formulario' });
  }

  protected src(name: string) {
    return photoSrc(photo(name), true);
  }

  protected alt(name: string) {
    return photo(name).alt;
  }

  protected money(n: number) {
    return '$' + n.toLocaleString('es-MX');
  }
}
