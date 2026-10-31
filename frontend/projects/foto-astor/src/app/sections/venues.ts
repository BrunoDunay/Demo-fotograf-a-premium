import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VENUES } from '../core/content';

/**
 * Lugares y proveedores con los que ha trabajado, como un muro de logotipos: cada nombre con su propia
 * tipografía de lujo (serif, itálica, manuscrita, versales, condensada). La franja corre sola y se detiene
 * al pasar el cursor para leerla.
 */
@Component({
  selector: 'app-venues',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="venues" aria-label="Lugares y proveedores con los que he trabajado">
      <p class="label kicker head">Haciendas, jardines y planners con los que trabajo</p>
      <div class="track">
        @for (copy of [0, 1]; track copy) {
          <ul class="row" [attr.aria-hidden]="copy === 1 ? 'true' : null">
            @for (v of venues; track v.name) {
              <li class="venue" [attr.data-style]="v.style">
                <span class="name">{{ v.name }}</span>
                <span class="kind">{{ v.kind }}</span>
              </li>
              <li class="sep" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" /></svg>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
  styles: `
    .venues { position: relative; z-index: 2; padding-block: 56px 64px; border-block: 1px solid var(--color-line); background: var(--color-paper); overflow: hidden; }
    .head { display: flex; justify-content: center; margin-bottom: 30px; }
    .track { display: flex; width: max-content; animation: run 60s linear infinite; }
    @media (hover: hover) and (pointer: fine) { .venues:hover .track { animation-play-state: paused; } }
    @keyframes run { to { transform: translateX(-50%); } }
    .row { display: flex; align-items: center; flex: none; }
    .venue { display: grid; justify-items: center; gap: 4px; padding-inline: clamp(22px, 3vw, 44px); color: var(--color-ink-2); transition: color 300ms ease; }
    @media (hover: hover) and (pointer: fine) { .venue:hover { color: var(--color-ink); } }
    .name { font-size: clamp(1.4rem, 2.4vw, 2.1rem); line-height: 1.1; white-space: nowrap; }
    .kind { font-family: var(--font-label); font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--color-muted); }
    [data-style='serif'] .name { font-family: var(--font-display); font-variation-settings: 'opsz' 40; letter-spacing: 0.02em; }
    [data-style='italic'] .name { font-family: var(--font-display); font-style: italic; font-variation-settings: 'opsz' 96; }
    [data-style='script'] .name { font-family: var(--font-script); font-size: clamp(2.2rem, 3.6vw, 3.2rem); }
    [data-style='caps'] .name { font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.22em; font-size: clamp(1rem, 1.7vw, 1.45rem); font-variation-settings: 'opsz' 11; }
    [data-style='condensed'] .name { font-family: var(--font-label); font-weight: 300; text-transform: uppercase; letter-spacing: 0.12em; font-size: clamp(1.2rem, 2vw, 1.75rem); }
    .sep svg { width: 10px; height: 10px; fill: var(--color-champagne); opacity: 0.7; }
  `,
})
export class Venues {
  protected readonly venues = VENUES;
}
