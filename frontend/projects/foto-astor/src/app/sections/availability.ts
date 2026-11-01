import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Booking, dayStatus, isoDate, longDate, monthName, today } from '../core/booking';
import { Icon } from '../shared/icon';

interface Cell {
  day: number;
  iso: string;
  /** Sin fechas "ocupadas": solo se marca lo que tiene mucha demanda. */
  status: 'libre' | 'alta' | 'pasada';
}
interface View {
  y: number;
  m: number;
}

/**
 * Calendario de pared con argollas: hojas apiladas detrás y, al cambiar de mes, la hoja se voltea sobre las
 * argollas. No muestra fechas ocupadas; solo marca con un punto los días de alta demanda (ficticio y repetible).
 * Elegir un día lo manda al formulario.
 */
@Component({
  selector: 'app-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, NgTemplateOutlet],
  template: `
    <div class="cal">
      <div class="rings" aria-hidden="true">
        @for (i of [0, 1, 2, 3, 4, 5]; track i) {
          <span class="ring"></span>
        }
      </div>
      <span class="under u2" aria-hidden="true"></span>
      <span class="under u1" aria-hidden="true"></span>
      <div class="page">
        <ng-container *ngTemplateOutlet="sheet; context: { $implicit: view(), live: true }" />
      </div>
      @if (leaf(); as l) {
        <div class="page leaf" [class.fwd]="l.dir > 0" [class.back]="l.dir < 0" aria-hidden="true" (animationend)="leaf.set(null)">
          <ng-container *ngTemplateOutlet="sheet; context: { $implicit: l.view, live: false }" />
        </div>
      }
    </div>
    <p class="picked" aria-live="polite">
      @if (booking.date(); as d) {
        <app-icon name="check" [size]="16" /> Elegiste el <b>{{ long(d) }}</b>. Ya está en tu mensaje.
      } @else {
        Toca tu día para ponerlo en tu mensaje.
      }
    </p>

    <ng-template #sheet let-v let-live="live">
      <header class="head">
        <button type="button" class="arrow" (click)="step(-1)" [disabled]="!live || offset() === 0" aria-label="Mes anterior"><app-icon name="chevron-left" [size]="18" /></button>
        <div class="title">
          <p class="m">{{ monthOf(v.m) }}</p>
          <p class="y label">{{ v.y }}</p>
        </div>
        <button type="button" class="arrow" (click)="step(1)" [disabled]="!live || offset() >= 11" aria-label="Mes siguiente"><app-icon name="chevron-right" [size]="18" /></button>
      </header>
      <div class="grid" role="grid" [attr.aria-label]="'Calendario de ' + monthOf(v.m) + ' ' + v.y">
        @for (d of dows; track $index) {
          <span class="dow" role="columnheader">{{ d }}</span>
        }
        @for (c of ready() ? cellsOf(v) : []; track $index) {
          @if (c) {
            <button
              type="button"
              class="day"
              role="gridcell"
              [attr.data-status]="c.status"
              [class.selected]="booking.date() === c.iso"
              [disabled]="!live || c.status === 'pasada'"
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
      <p class="legend"><span class="sw"></span> Alta demanda: conviene apartar pronto</p>
    </ng-template>
  `,
  styles: `
    :host { display: block; }
    .cal { position: relative; padding-top: 18px; perspective: 1600px; }
    /* Argollas metálicas que atraviesan las hojas. */
    .rings { position: absolute; z-index: 5; left: 10%; right: 10%; top: 0; display: flex; justify-content: space-between; pointer-events: none; }
    .ring { width: 12px; height: 38px; border-radius: 7px; background: linear-gradient(90deg, #5c6170, #e9ecf2 35%, #8d93a3 60%, #3c404b); box-shadow: 0 3px 4px rgb(0 0 0 / 30%); }
    .page, .under { border-radius: 4px 4px 14px 14px; }
    .under { position: absolute; left: 0; right: 0; top: 18px; bottom: 0; background: var(--color-card); }
    .u1 { translate: 0 7px; scale: 0.985 1; box-shadow: 0 2px 4px rgb(10 16 34 / 10%); background: #eef0f4; }
    .u2 { translate: 0 14px; scale: 0.97 1; box-shadow: 0 20px 40px -20px rgb(10 16 34 / 50%); background: #e3e7ee; }
    .page {
      position: relative;
      z-index: 2;
      padding: 40px clamp(18px, 3.4vw, 34px) 26px;
      background: var(--color-card);
      box-shadow: 0 1px 2px rgb(10 16 34 / 12%), 0 10px 20px -12px rgb(10 16 34 / 30%);
      transform-origin: 50% 0;
    }
    /* Perforaciones de las argollas en la hoja. */
    .page::before { content: ''; position: absolute; left: 10%; right: 10%; top: 12px; height: 8px; background: radial-gradient(circle at 6px 4px, rgb(10 16 34 / 55%) 3.4px, transparent 4px) 0 0 / calc((100% - 12px) / 5) 8px repeat-x; }
    .leaf { position: absolute; left: 0; right: 0; top: 18px; z-index: 4; backface-visibility: hidden; pointer-events: none; }
    .leaf.fwd { animation: leaf-up 720ms cubic-bezier(0.55, 0, 0.3, 1) forwards; }
    .leaf.back { animation: leaf-down 720ms cubic-bezier(0.3, 0, 0.2, 1) forwards; }
    @keyframes leaf-up {
      0% { transform: rotateX(0); box-shadow: 0 10px 20px -12px rgb(10 16 34 / 30%); }
      100% { transform: rotateX(-118deg); opacity: 0.2; box-shadow: 0 40px 60px -10px rgb(10 16 34 / 40%); }
    }
    @keyframes leaf-down {
      0% { transform: rotateX(0); }
      100% { transform: rotateX(100deg) translateY(10px); opacity: 0; }
    }
    .head { display: grid; grid-template-columns: auto 1fr auto; align-items: center; margin-bottom: 18px; }
    .title { text-align: center; }
    .m { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1; text-transform: capitalize; }
    .y { color: var(--color-accent); margin-top: 4px; }
    .arrow { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--color-line); transition: background-color 200ms ease, scale 160ms var(--ease-out), color 200ms ease; }
    .arrow:disabled { opacity: 0.25; cursor: default; }
    .arrow:not(:disabled):active { scale: 0.9; }
    @media (hover: hover) and (pointer: fine) { .arrow:not(:disabled):hover { background: var(--color-ink); color: var(--color-paper); } }
    .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .dow { padding-bottom: 8px; margin-bottom: 4px; border-bottom: 1px solid var(--color-line); text-align: center; font-family: var(--font-label); font-size: 0.66rem; letter-spacing: 0.16em; color: var(--color-muted); }
    .day, .empty { aspect-ratio: 1; }
    .day {
      position: relative; display: grid; place-items: center; width: 100%; max-width: 50px; justify-self: center; border-radius: 50%;
      font-size: clamp(0.95rem, 2vw, 1.1rem); font-variant-numeric: tabular-nums;
      transition: background-color 250ms ease, color 250ms ease, scale 300ms var(--ease-spring), box-shadow 250ms ease;
    }
    .day[data-status='alta']::after { content: ''; position: absolute; bottom: 14%; left: 50%; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--color-accent); }
    .day[data-status='pasada'] { color: rgb(20 27 45 / 22%); cursor: default; }
    .day.selected { background: var(--color-accent); color: #fff; scale: 1.06; box-shadow: 0 8px 18px -8px rgb(164 81 79 / 80%); }
    .day.selected::after { background: #fff; }
    .day:not(:disabled):active { scale: 0.9; }
    @media (hover: hover) and (pointer: fine) { .day:not(:disabled):not(.selected):hover { background: var(--color-accent-wash); } }
    .legend { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 0.82rem; color: var(--color-muted); }
    .sw { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); }
    .picked { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 30px; font-size: 0.95rem; }
    .picked app-icon { color: var(--color-accent); }
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
  protected readonly view = computed<View>(() => this.viewAt(this.offset()));
  /** Hoja que se voltea al cambiar de mes (copia del mes anterior encima de la nueva). */
  protected readonly leaf = signal<{ view: View; dir: number } | null>(null);
  protected readonly monthOf = monthName;

  private viewAt(offset: number): View {
    const d = new Date(this.base.getFullYear(), this.base.getMonth() + offset, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  protected cellsOf({ y, m }: View): (Cell | null)[] {
    const first = (new Date(y, m, 1).getDay() + 6) % 7; // lunes = 0
    const days = new Date(y, m + 1, 0).getDate();
    const out: (Cell | null)[] = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d++) {
      const st = dayStatus(y, m, d, this.base);
      out.push({ day: d, iso: isoDate(y, m, d), status: st === 'pasada' ? 'pasada' : st === 'libre' ? 'libre' : 'alta' });
    }
    return out;
  }

  protected step(dir: number) {
    const next = Math.max(0, Math.min(11, this.offset() + dir));
    if (next === this.offset()) return;
    if (!document.documentElement.classList.contains('reduce-motion')) this.leaf.set({ view: this.view(), dir });
    this.offset.set(next);
  }

  protected pick(c: Cell) {
    if (c.status === 'pasada') return;
    this.booking.date.set(c.iso);
    this.picked.emit(c.iso);
  }

  protected label(c: Cell) {
    const st = c.status === 'libre' ? 'disponible' : c.status === 'alta' ? 'disponible, alta demanda' : 'pasada';
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
