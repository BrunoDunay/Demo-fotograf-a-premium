import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, output, signal } from '@angular/core';
import { Booking, DayStatus, dayStatus, isoDate, longDate, monthName, today } from '../core/booking';
import { Icon } from '../shared/icon';

interface Cell {
  day: number;
  iso: string;
  status: DayStatus;
}

/**
 * Calendario de fechas disponibles en una hoja de papel con clip y orilla rasgada (referencia). Sin backend: la
 * disponibilidad es ficticia y repetible. Elegir un día libre lo manda al formulario.
 */
@Component({
  selector: 'app-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="sheet">
      <svg class="clip" viewBox="0 0 30 90" aria-hidden="true">
        <path d="M10 70 V16 a7 7 0 0 1 14 0 V78 a10 10 0 0 1 -20 0 V24" fill="none" stroke="#2b2b2b" stroke-width="2.2" stroke-linecap="round" />
      </svg>
      <header class="head">
        <p class="kind">Fechas disponibles</p>
        <div class="nav">
          <button type="button" class="arrow" (click)="step(-1)" [disabled]="offset() === 0" aria-label="Mes anterior"><app-icon name="chevron-left" [size]="18" /></button>
          <p class="month" aria-live="polite">{{ title() }}</p>
          <button type="button" class="arrow" (click)="step(1)" [disabled]="offset() >= 11" aria-label="Mes siguiente"><app-icon name="chevron-right" [size]="18" /></button>
        </div>
      </header>
      <div class="grid" role="grid" [attr.aria-label]="'Calendario de ' + title()">
        @for (d of dows; track $index) {
          <span class="dow" role="columnheader">{{ d }}</span>
        }
        @for (c of ready() ? cells() : []; track $index) {
          @if (c) {
            <button
              type="button"
              class="day"
              role="gridcell"
              [attr.data-status]="c.status"
              [class.selected]="booking.date() === c.iso"
              [disabled]="c.status === 'apartada' || c.status === 'pasada'"
              [attr.aria-label]="label(c)"
              [attr.aria-pressed]="booking.date() === c.iso"
              (click)="pick(c)"
            >
              {{ c.day }}
            </button>
          } @else {
            <span class="empty" aria-hidden="true"></span>
          }
        }
      </div>
      <ul class="legend">
        <li><span class="sw libre"></span> Disponible</li>
        <li><span class="sw ultima"></span> Última plaza del día</li>
        <li><span class="sw apartada"></span> Apartada</li>
      </ul>
      <p class="picked" aria-live="polite">
        @if (booking.date(); as d) {
          Elegiste el <b>{{ long(d) }}</b>. Ya está en tu mensaje.
        } @else {
          Toca un día libre para ponerlo en tu mensaje.
        }
      </p>
    </div>
  `,
  styles: `
    :host { display: block; }
    .sheet {
      position: relative;
      padding: 54px clamp(20px, 4vw, 40px) 64px;
      background-color: #ece6da;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' seed='5'/%3E%3CfeColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.36 0 0 0 0 0.3 0 0 0 0.3 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E");
      box-shadow: var(--shadow-lift);
      rotate: -0.6deg;
      /* Orilla de abajo rasgada. */
      mask: linear-gradient(#000, #000) top / 100% calc(100% - 18px) no-repeat,
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='20' preserveAspectRatio='none'%3E%3Cpath d='M0 0 H120 V9 L114 13 108 8 100 15 93 10 86 16 79 9 72 14 64 8 57 15 50 11 42 17 35 9 28 14 20 8 13 15 6 10 0 14 Z'/%3E%3C/svg%3E") bottom / 120px 20px repeat-x;
    }
    .clip { position: absolute; left: 34px; top: -26px; width: 26px; height: auto; rotate: -4deg; filter: drop-shadow(0 2px 2px rgb(0 0 0 / 25%)); }
    .head { display: grid; justify-items: end; gap: 4px; margin-bottom: 26px; text-align: right; }
    .kind { font-family: var(--font-display); font-variation-settings: 'opsz' 11; font-size: clamp(1.3rem, 2.6vw, 1.9rem); letter-spacing: 0.1em; text-transform: uppercase; color: #3a3631; }
    .nav { display: flex; align-items: center; gap: 6px; }
    .month { min-width: 11ch; font-family: var(--font-label); font-weight: 600; font-size: 1.15rem; letter-spacing: 0.14em; text-transform: uppercase; color: #3a3631; text-align: center; }
    .arrow { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: #3a3631; transition: background-color 200ms ease, scale 160ms var(--ease-out); }
    .arrow:disabled { opacity: 0.25; cursor: default; }
    .arrow:not(:disabled):active { scale: 0.9; }
    @media (hover: hover) and (pointer: fine) { .arrow:not(:disabled):hover { background: rgb(58 54 49 / 8%); } }
    .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px 2px; }
    .dow { padding-bottom: 10px; border-bottom: 1px solid #5b564f; margin-bottom: 8px; text-align: center; font-family: var(--font-display); font-size: 1.15rem; color: #3a3631; }
    .day, .empty { aspect-ratio: 1; }
    .day {
      display: grid;
      place-items: center;
      width: 100%;
      max-width: 52px;
      justify-self: center;
      border-radius: 50%;
      font-family: var(--font-display);
      font-variation-settings: 'opsz' 40;
      font-size: clamp(1.05rem, 2.2vw, 1.4rem);
      color: #3a3631;
      transition: background-color 250ms ease, color 250ms ease, scale 200ms var(--ease-spring), box-shadow 250ms ease;
    }
    .day[data-status='libre'] { box-shadow: inset 0 0 0 1px rgb(58 54 49 / 0%); }
    .day[data-status='ultima'] { box-shadow: inset 0 0 0 1.5px #a98b66; }
    .day[data-status='apartada'] { color: rgb(58 54 49 / 35%); text-decoration: line-through; text-decoration-thickness: 1px; cursor: not-allowed; }
    .day[data-status='pasada'] { color: rgb(58 54 49 / 22%); cursor: default; }
    .day.selected { background: #45403a; color: #f3eee5; box-shadow: none; }
    .day:not(:disabled):active { scale: 0.9; }
    @media (hover: hover) and (pointer: fine) {
      .day[data-status='libre']:not(.selected):hover, .day[data-status='ultima']:not(.selected):hover { box-shadow: inset 0 0 0 1.5px #45403a; }
    }
    .legend { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 24px; font-size: 0.82rem; color: #5b564f; }
    .legend li { display: inline-flex; align-items: center; gap: 8px; }
    .sw { width: 14px; height: 14px; border-radius: 50%; }
    .sw.libre { box-shadow: inset 0 0 0 1.5px #45403a; }
    .sw.ultima { box-shadow: inset 0 0 0 1.5px #a98b66; }
    .sw.apartada { background: rgb(58 54 49 / 18%); }
    .picked { margin-top: 18px; font-size: 0.95rem; color: #3a3631; }
  `,
})
export class Availability {
  readonly picked = output<string>();
  protected readonly booking = inject(Booking);
  protected readonly dows = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  protected readonly offset = signal(0);
  /** El calendario depende de la fecha de hoy: se dibuja solo en el navegador (no en el prerender). */
  protected readonly ready = signal(false);
  private readonly base = today();

  constructor() {
    afterNextRender(() => {
      // Si el mes ya casi termina, se empieza por el siguiente (con fechas por elegir).
      if (this.base.getDate() > 22 && this.offset() === 0) this.offset.set(1);
      this.ready.set(true);
    });
  }
  protected readonly view = computed(() => {
    const d = new Date(this.base.getFullYear(), this.base.getMonth() + this.offset(), 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  protected readonly title = computed(() => `${monthName(this.view().m)} ${this.view().y}`);
  protected readonly cells = computed<(Cell | null)[]>(() => {
    const { y, m } = this.view();
    const first = (new Date(y, m, 1).getDay() + 6) % 7; // lunes = 0
    const days = new Date(y, m + 1, 0).getDate();
    const out: (Cell | null)[] = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d++) out.push({ day: d, iso: isoDate(y, m, d), status: dayStatus(y, m, d, this.base) });
    return out;
  });

  protected step(dir: number) {
    this.offset.update((o) => Math.max(0, Math.min(11, o + dir)));
  }

  protected pick(c: Cell) {
    if (c.status === 'apartada' || c.status === 'pasada') return;
    this.booking.date.set(c.iso);
    this.picked.emit(c.iso);
  }

  protected label(c: Cell) {
    const st = c.status === 'libre' ? 'disponible' : c.status === 'ultima' ? 'última plaza' : c.status === 'apartada' ? 'apartada' : 'pasada';
    return `${longDate(c.iso)}, ${st}`;
  }

  protected long(iso: string) {
    return longDate(iso);
  }

  /** Muestra el mes de una fecha ya elegida (por ejemplo, desde los boletos del inicio). */
  showMonthOf(iso: string) {
    const [y, m] = iso.split('-').map(Number);
    const diff = (y - this.base.getFullYear()) * 12 + (m - 1 - this.base.getMonth());
    if (diff >= 0 && diff <= 11) this.offset.set(diff);
  }
}
