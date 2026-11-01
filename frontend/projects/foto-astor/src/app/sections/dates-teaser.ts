import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Booking, isoDate, monthName, today } from '../core/booking';
import { photoSrc } from '../core/media';
import { hasFinePointer, prefersReducedMotion } from '../core/motion';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

const KINDS = [
  { id: 'Boda', label: 'Boda', title: 'Nos casamos', photo: 'beso-luces', names: 'Ana & Luis' },
  { id: 'XV años', label: 'XV años', title: 'Mis XV años', photo: 'xv-vals', names: 'Valentina' },
  { id: 'Bautizo', label: 'Bautizo', title: 'Mi bautizo', photo: 'bautizo', names: 'Mateo' },
  { id: 'Graduación', label: 'Graduación', title: 'Me gradúo', photo: 'graduacion', names: 'Generación 2027' },
  { id: 'Otro', label: 'Otra celebración', title: 'Celebramos', photo: 'brindis-bengalas', names: 'Familia Ruiz' },
] as const;

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Cierre del inicio: "¿Ya tienen fecha?". El visitante elige qué celebra, escribe los nombres y toca su día
 * en un calendario; a un lado se arma su tarjeta "Save the date" con la cuenta regresiva. "Apartar esta fecha"
 * lleva la fecha y el tipo de evento al formulario de contacto. No muestra fechas ocupadas.
 */
@Component({
  selector: 'app-dates-teaser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Icon, Reveal, Celestial],
  template: `
    <section class="section dates" aria-labelledby="dates-title">
      <div class="container grid">
        <div class="builder">
          <header class="head">
            <p class="label kicker" data-reveal>Tu fecha</p>
            <h2 id="dates-title" class="title" data-reveal>¿Ya tienen <em>fecha?</em></h2>
            <p class="lead" data-reveal>
              Arma tu "save the date" y apártala conmigo. Las fechas de temporada se van con seis a diez meses de
              anticipación, así que entre antes me escribas, mejor.
            </p>
          </header>

          <div class="step" data-reveal>
            <p class="label n">01 · Qué celebran</p>
            <div class="chips" role="radiogroup" aria-label="Tipo de evento">
              @for (k of kinds; track k.id) {
                <button type="button" class="chip" role="radio" [attr.aria-checked]="kind().id === k.id" (click)="setKind(k)">{{ k.label }}</button>
              }
            </div>
          </div>

          <div class="step" data-reveal>
            <label class="label n" for="std-names">02 · Quiénes</label>
            <input id="std-names" class="names-in" type="text" maxlength="32" autocomplete="off" [placeholder]="kind().names" [ngModel]="names()" (ngModelChange)="names.set($event)" />
          </div>

          <div class="step" data-reveal>
            <p class="label n">03 · Cuándo</p>
            <div class="cal">
              <div class="cal-head">
                <button type="button" class="nav" aria-label="Mes anterior" [disabled]="offset() <= minOffset()" (click)="move(-1)"><app-icon name="chevron-left" [size]="18" /></button>
                <p class="cal-title" aria-live="polite">{{ ready() ? monthLabel() : '' }}</p>
                <button type="button" class="nav" aria-label="Mes siguiente" [disabled]="offset() >= 23" (click)="move(1)"><app-icon name="chevron-right" [size]="18" /></button>
              </div>
              <div class="week" aria-hidden="true">
                @for (w of week; track $index) {
                  <span>{{ w }}</span>
                }
              </div>
              <div class="days" role="grid" [attr.aria-label]="monthLabel()">
                @for (d of ready() ? days() : []; track $index) {
                  @if (d) {
                    <button type="button" class="day" [class.on]="d.iso === date()" [class.weekend]="d.weekend" [disabled]="d.past" [attr.aria-pressed]="d.iso === date()" [attr.aria-label]="d.aria" (click)="date.set(d.iso)">{{ d.n }}</button>
                  } @else {
                    <span></span>
                  }
                }
              </div>
            </div>
          </div>
        </div>

        <div class="preview" data-reveal="scale">
          <app-celestial class="deco twinkle" kind="orbit-star" />
          <div class="card-wrap" (pointermove)="tilt($event)" (pointerleave)="untilt()">
            <article class="std paper" [style.--rx.deg]="rx()" [style.--ry.deg]="ry()" aria-live="polite">
              <div class="photo">
                @for (k of kinds; track k.id) {
                  <img [src]="src(k.photo)" alt="" [class.on]="kind().id === k.id" loading="lazy" />
                }
                <span class="script over">save the date</span>
              </div>
              <div class="body">
                <p class="label kind-t">{{ kind().title }}</p>
                <p class="who">{{ names().trim() || kind().names }}</p>
                @if (picked(); as p) {
                  <div class="when">
                    <span class="dow">{{ p.dow }}</span>
                    <span class="big">{{ p.day }}</span>
                    <span class="my">{{ p.month }}<br />{{ p.year }}</span>
                  </div>
                  <p class="count label">Faltan {{ p.left }} días · Aguascalientes</p>
                } @else {
                  <p class="pick">Toca tu día en el calendario</p>
                }
                <p class="sig">Fotografía · Emilio Astor</p>
              </div>
            </article>
            <span class="shadow" aria-hidden="true"></span>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-accent" [disabled]="!date()" (click)="reserve()">
              <app-icon name="calendar" [size]="16" /> <span class="btn-t">Apartar esta fecha</span>
            </button>
            <a routerLink="/paquetes" class="link">Ver paquetes y precios</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(40px, 6vw, 96px); align-items: center; }
    .builder { display: grid; gap: 30px; }
    .head { display: grid; gap: 16px; }
    .title { font-size: var(--text-3xl); }
    .title em { color: var(--color-accent); }
    .step { display: grid; gap: 12px; }
    .n { color: var(--color-muted); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      min-height: 42px; padding: 0 18px; border-radius: var(--radius-pill); font-size: 0.92rem;
      box-shadow: inset 0 0 0 1px var(--color-line-2);
      transition: background-color 300ms ease, color 300ms ease, box-shadow 300ms ease, scale 160ms var(--ease-out);
    }
    .chip:active { scale: 0.95; }
    .chip[aria-checked='true'] { background: var(--color-ink); color: var(--color-paper); box-shadow: none; }
    @media (hover: hover) and (pointer: fine) { .chip:not([aria-checked='true']):hover { box-shadow: inset 0 0 0 1px var(--color-ink); } }
    .names-in {
      width: 100%; max-width: 420px; padding: 10px 0; border: 0; border-bottom: 1px solid var(--color-line-2); background: none;
      font-family: var(--font-display); font-style: italic; font-size: 1.8rem; outline: none; transition: border-color 300ms ease;
    }
    .names-in:focus { border-color: var(--color-accent); }
    .names-in::placeholder { color: var(--color-muted); opacity: 0.55; }

    .cal { max-width: 420px; padding: 18px 18px 14px; border-radius: 14px; background: var(--color-card); box-shadow: var(--shadow-paper); }
    .cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .cal-title { font-family: var(--font-display); font-size: 1.45rem; text-transform: capitalize; }
    .nav { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; transition: background-color 200ms ease, scale 160ms var(--ease-out); }
    .nav:disabled { opacity: 0.25; cursor: default; }
    .nav:not(:disabled):active { scale: 0.9; }
    @media (hover: hover) and (pointer: fine) { .nav:not(:disabled):hover { background: var(--color-paper-2); } }
    .week, .days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
    .week span { font-family: var(--font-label); font-size: 0.62rem; letter-spacing: 0.14em; color: var(--color-muted); padding-bottom: 6px; }
    .day { position: relative; aspect-ratio: 1; border-radius: 50%; font-size: 0.92rem; font-variant-numeric: tabular-nums; transition: background-color 250ms ease, color 250ms ease, scale 300ms var(--ease-spring); }
    .day.weekend { font-weight: 600; }
    .day:disabled { opacity: 0.25; cursor: default; }
    .day.on { background: var(--color-accent); color: #fff; scale: 1.08; }
    .day:not(:disabled):active { scale: 0.9; }
    @media (hover: hover) and (pointer: fine) { .day:not(:disabled):not(.on):hover { background: var(--color-accent-wash); } }

    .preview { position: relative; display: grid; justify-items: center; gap: 30px; }
    .deco { position: absolute; top: -40px; right: 4%; --size: 110px; opacity: 0.35; }
    .card-wrap { position: relative; width: min(100%, 400px); perspective: 1100px; }
    .std {
      position: relative; z-index: 1; overflow: hidden; border-radius: 4px; transform-style: preserve-3d;
      rotate: x var(--rx, 0deg); transform: rotateY(var(--ry, 0deg)) rotateZ(-2deg);
      transition: transform 700ms var(--ease-out), rotate 700ms var(--ease-out);
      box-shadow: 0 1px 1px rgb(10 16 34 / 10%), 0 30px 60px -30px rgb(10 16 34 / 55%);
    }
    .photo { position: relative; aspect-ratio: 4 / 3.1; overflow: hidden; margin: 14px 14px 0; background: var(--color-paper-3); }
    .photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; scale: 1.08; transition: opacity 700ms ease, scale 1400ms var(--ease-out); }
    .photo img.on { opacity: 1; scale: 1; }
    .over { position: absolute; left: 50%; bottom: 10px; translate: -50% 0; font-size: clamp(2.4rem, 5vw, 3.2rem); color: #fff; text-shadow: 0 2px 20px rgb(0 0 0 / 50%); white-space: nowrap; }
    .body { display: grid; justify-items: center; gap: 8px; padding: 22px 22px 26px; text-align: center; }
    .kind-t { color: var(--color-accent); }
    .who { font-family: var(--font-display); font-style: italic; font-size: clamp(1.9rem, 3.4vw, 2.6rem); line-height: 1.05; overflow-wrap: anywhere; }
    .when { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 14px; width: 100%; margin-top: 6px; padding-block: 8px; border-block: 1px solid var(--color-line-2); }
    .dow { font-family: var(--font-label); font-size: 0.66rem; letter-spacing: 0.2em; text-transform: uppercase; text-align: right; }
    .big { font-family: var(--font-display); font-size: 3.8rem; line-height: 1; animation: pop 600ms var(--ease-spring); }
    .my { font-family: var(--font-label); font-size: 0.66rem; letter-spacing: 0.2em; text-transform: uppercase; text-align: left; line-height: 1.5; }
    @keyframes pop { from { scale: 0.6; opacity: 0; filter: blur(4px); } }
    .count { color: var(--color-muted); font-size: 0.6rem; }
    .pick { color: var(--color-muted); padding-block: 22px; font-style: italic; }
    .sig { margin-top: 6px; font-family: var(--font-script); font-size: 1.6rem; color: var(--color-ink-2); }
    .shadow { position: absolute; left: 10%; right: 10%; bottom: -18px; height: 30px; border-radius: 50%; background: rgb(10 16 34 / 30%); filter: blur(18px); }
    .actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px 26px; }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }

    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
      .cal, .names-in { max-width: none; }
    }
  `,
})
export class DatesTeaser {
  private readonly booking = inject(Booking);
  private readonly router = inject(Router);
  protected readonly kinds = KINDS;
  protected readonly week = WEEK;
  protected readonly kind = signal<(typeof KINDS)[number]>(KINDS[0]);
  protected readonly names = signal('');
  protected readonly date = signal<string | null>(null);
  protected readonly offset = signal(0);
  protected readonly rx = signal(0);
  protected readonly ry = signal(0);
  protected readonly src = (name: string) => photoSrc(name, true);
  /** Depende de la fecha de hoy: el calendario se dibuja solo en el navegador (no en el prerender). */
  protected readonly ready = signal(false);

  constructor() {
    afterNextRender(() => {
      // Si el mes ya casi termina, empieza en el siguiente.
      if (today().getDate() > 22) this.offset.set(1);
      this.ready.set(true);
    });
  }

  private readonly month = computed(() => {
    const t = today();
    return new Date(t.getFullYear(), t.getMonth() + this.offset(), 1);
  });

  protected readonly monthLabel = computed(() => `${monthName(this.month().getMonth())} ${this.month().getFullYear()}`);

  protected readonly days = computed(() => {
    const first = this.month();
    const y = first.getFullYear();
    const m = first.getMonth();
    const total = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const t = today();
    const out: ({ n: number; iso: string; past: boolean; weekend: boolean; aria: string } | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      out.push({
        n: d,
        iso: isoDate(y, m, d),
        past: date <= t,
        weekend: dow === 5 || dow === 6,
        aria: `${DAY_NAMES[dow]} ${d} de ${monthName(m)}`,
      });
    }
    return out;
  });

  protected readonly picked = computed(() => {
    const iso = this.date();
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const left = Math.round((date.getTime() - today().getTime()) / 86400000);
    return { day: d, dow: DAY_NAMES[date.getDay()], month: monthName(m - 1), year: y, left };
  });

  protected setKind(k: (typeof KINDS)[number]) {
    this.kind.set(k);
  }

  protected readonly minOffset = computed(() => (this.ready() && today().getDate() > 22 ? 1 : 0));

  protected move(step: number) {
    this.offset.update((o) => Math.max(this.minOffset(), Math.min(23, o + step)));
  }

  protected tilt(e: PointerEvent) {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    this.ry.set(x * 14);
    this.rx.set(-y * 10);
  }

  protected untilt() {
    this.rx.set(0);
    this.ry.set(0);
  }

  protected reserve() {
    const iso = this.date();
    if (!iso) return;
    this.booking.date.set(iso);
    this.booking.eventType.set(this.kind().id);
    this.router.navigate(['/contacto'], { fragment: 'formulario' });
  }
}
