import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Booking, dayStatus, isoDate, monthName, today } from '../core/booking';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

interface Sat {
  iso: string;
  day: number;
  month: string;
  year: number;
  status: 'libre' | 'ultima' | 'apartada';
}

/** Cierre del inicio: los próximos sábados como boletos, con su disponibilidad. Uno libre te lleva al formulario. */
@Component({
  selector: 'app-dates-teaser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Reveal, Celestial],
  template: `
    <section class="section dates" aria-labelledby="dates-title">
      <div class="container">
        <header class="head">
          <app-celestial class="deco twinkle" kind="orbit-star" />
          <p class="label kicker" data-reveal>Agenda</p>
          <h2 id="dates-title" class="title" data-reveal>¿Tu sábado <em>sigue libre?</em></h2>
          <p class="lead" data-reveal>
            Tomo una boda o XV años por día para llegar con calma y entregar a tiempo. Estos son los próximos sábados.
          </p>
        </header>
        <ol class="tickets">
          @for (s of saturdays; track s.iso; let i = $index) {
            <li data-reveal [revealDelay]="i * 50">
              <button type="button" class="ticket" [attr.data-status]="s.status" [disabled]="s.status === 'apartada'" (click)="pick(s)">
                <span class="month">{{ s.month }}</span>
                <span class="day">{{ s.day }}</span>
                <span class="status label">
                  {{ s.status === 'libre' ? 'Disponible' : s.status === 'ultima' ? 'Última plaza' : 'Apartada' }}
                </span>
              </button>
            </li>
          }
        </ol>
        <div class="actions" data-reveal>
          <a routerLink="/contacto" fragment="fechas" class="btn btn-ink">
            <app-icon name="calendar" [size]="16" /> Ver el calendario completo
          </a>
          <a routerLink="/paquetes" class="link">Ver paquetes y precios</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .head { position: relative; display: grid; justify-items: center; gap: 16px; text-align: center; max-width: 720px; margin: 0 auto 56px; }
    .title { font-size: var(--text-3xl); }
    .title em { color: var(--color-champagne); }
    .deco { position: absolute; top: -50px; right: -10px; --size: 96px; opacity: 0.3; }
    .tickets { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 12px; }
    .ticket {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 2px;
      width: 100%;
      padding: 18px 8px 16px;
      background: var(--color-card);
      border-radius: 10px;
      box-shadow: var(--shadow-paper);
      transition: translate 400ms var(--ease-out), box-shadow 400ms ease, scale 160ms var(--ease-out);
    }
    /* Muescas de boleto a los lados. */
    .ticket::before, .ticket::after { content: ''; position: absolute; top: 58%; width: 14px; height: 14px; border-radius: 50%; background: var(--color-paper); }
    .ticket::before { left: -7px; }
    .ticket::after { right: -7px; }
    .month { font-family: var(--font-display); font-style: italic; font-size: 1.05rem; text-transform: capitalize; color: var(--color-muted); }
    .day { font-family: var(--font-display); font-size: clamp(2.2rem, 3.6vw, 3.2rem); line-height: 1; font-variation-settings: 'opsz' 96; }
    .status { margin-top: 10px; padding-top: 10px; width: 80%; border-top: 1px dashed var(--color-line-2); font-size: 0.58rem; letter-spacing: 0.16em; color: #3d6b4f; }
    [data-status='ultima'] .status { color: #a8641f; }
    [data-status='apartada'] { opacity: 0.45; cursor: not-allowed; box-shadow: none; background: transparent; outline: 1px dashed var(--color-line-2); }
    [data-status='apartada'] .day { text-decoration: line-through; text-decoration-thickness: 1px; }
    [data-status='apartada'] .status { color: var(--color-muted); }
    .ticket:not(:disabled):active { scale: 0.96; }
    @media (hover: hover) and (pointer: fine) {
      .ticket:not(:disabled):hover { translate: 0 -6px; box-shadow: var(--shadow-lift); }
    }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 18px 28px; margin-top: 48px; }
    @media (max-width: 900px) {
      .tickets { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `,
})
export class DatesTeaser {
  private readonly booking = inject(Booking);
  private readonly router = inject(Router);
  protected readonly saturdays = nextSaturdays(8);

  protected pick(s: Sat) {
    if (s.status === 'apartada') return;
    this.booking.date.set(s.iso);
    this.router.navigate(['/contacto'], { fragment: 'formulario' });
  }
}

function nextSaturdays(count: number): Sat[] {
  const out: Sat[] = [];
  const d = today();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  while (out.length < count) {
    const st = dayStatus(d.getFullYear(), d.getMonth(), d.getDate());
    out.push({
      iso: isoDate(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      month: monthName(d.getMonth()).slice(0, 3),
      year: d.getFullYear(),
      status: st === 'pasada' ? 'apartada' : st,
    });
    d.setDate(d.getDate() + 7);
  }
  return out;
}
