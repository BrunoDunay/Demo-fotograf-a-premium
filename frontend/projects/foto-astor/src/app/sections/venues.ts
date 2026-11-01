import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VENUES } from '../core/content';

/**
 * Lugares y proveedores con los que ha trabajado, como un muro de logotipos. Los que tienen logo lo muestran
 * (arriba del nombre, a un lado o como sello circular); los demás van solo con su tipografía.
 * La franja corre sola y nunca se detiene; con el cursor encima, el logo bajo el cursor se ilumina.
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
              <li class="venue" [attr.data-style]="v.style" [attr.data-layout]="v.layout ?? 'text'">
                @if (v.layout === 'seal') {
                  <svg class="seal" viewBox="0 0 120 120" aria-hidden="true">
                    <defs><path [attr.id]="'ring-' + copy" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
                    <circle cx="60" cy="60" r="56" class="o" />
                    <circle cx="60" cy="60" r="33" class="o thin" />
                    <text class="ring-text"><textPath [attr.href]="'#ring-' + copy" startOffset="0">JARDÍN · EL MEZQUITE · AGUASCALIENTES ·</textPath></text>
                    <g transform="translate(36 34) scale(1)">
                      <path class="o" d="M24 52V30M24 34c-6-2-10-6-12-11M24 30c5-3 8-7 9-12M24 40c4 0 8-2 11-5" />
                      <path class="f" d="M4 22c2-8 10-12 16-10 3-6 13-7 17-1 7-1 11 6 8 12 3 5-2 11-8 9-3 5-12 5-15 0-5 3-13 1-14-4-4-1-6-4-4-6Z" />
                    </g>
                  </svg>
                } @else {
                  @if (v.logo) {
                    <svg class="mark" viewBox="0 0 48 48" aria-hidden="true">
                      @switch (v.logo) {
                        @case ('arches') {
                          <path class="o" d="M4 42V27a6 6 0 0 1 12 0v15M18 42V23a6 6 0 0 1 12 0v19M32 42V27a6 6 0 0 1 12 0v15M2 42h44M5 46h38M2 17h44" />
                          <path class="f" d="M24 3l1.2 3.6 3.6 1.2-3.6 1.2L24 12.6l-1.2-3.6-3.6-1.2 3.6-1.2z" />
                        }
                        @case ('vine') {
                          <path class="o" d="M24 4c0 6 4 8 8 8M24 4v8" />
                          <circle class="f" cx="18" cy="16" r="4" /><circle class="f" cx="27" cy="16" r="4" />
                          <circle class="f" cx="22.5" cy="23" r="4" /><circle class="f" cx="31" cy="23" r="3.6" />
                          <circle class="f" cx="14" cy="23" r="3.6" /><circle class="f" cx="18" cy="30" r="3.8" />
                          <circle class="f" cx="27" cy="30" r="3.8" /><circle class="f" cx="22.5" cy="37" r="3.6" />
                          <path class="o" d="M10 44c6-3 22-3 28 0" />
                        }
                        @case ('moons') {
                          <path class="f" d="M9 30a8 8 0 1 0 6-11 6.4 6.4 0 0 1-6 11Z" />
                          <path class="f" d="M21 22a9 9 0 1 0 7-13 7.2 7.2 0 0 1-7 13Z" transform="translate(1 -3)" />
                          <path class="f" d="M33 30a8 8 0 1 0 6-11 6.4 6.4 0 0 1-6 11Z" />
                          <path class="o" d="M6 42h36" />
                        }
                        @case ('flower') {
                          <g transform="translate(24 22)">
                            @for (a of [0, 72, 144, 216, 288]; track a) {
                              <path class="f soft" [attr.transform]="'rotate(' + a + ')'" d="M0 0C-7-4-7-15 0-18C7-15 7-4 0 0Z" />
                            }
                            <circle class="f" r="3" />
                          </g>
                          <path class="o" d="M24 40c0 4 0 6-3 8M24 42c3-2 6-2 8 0" />
                        }
                        @case ('monogram') {
                          <circle class="o" cx="24" cy="24" r="21.5" />
                          <circle class="o thin" cx="24" cy="24" r="18.5" />
                          <text class="mono" x="24" y="30.5" text-anchor="middle">QA</text>
                        }
                        @case ('flame') {
                          <path class="f" d="M24 6c5 7 9 11 9 17a9 9 0 0 1-18 0c0-5 4-8 5-12 2 3 3 5 4 6 1-3 1-7 0-11Z" />
                          <path class="o" d="M24 32v4M17 38h14v8H17z" />
                        }
                      }
                    </svg>
                  }
                  <div class="txt">
                    <span class="name">{{ v.name }}</span>
                    <span class="kind">{{ v.kind }}</span>
                  </div>
                }
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
    .venues { position: relative; z-index: 2; padding-block: 52px 60px; border-block: 1px solid var(--color-line); background: var(--color-paper); overflow: hidden; }
    .venues::before, .venues::after { content: ''; position: absolute; top: 0; bottom: 0; z-index: 1; width: min(14vw, 160px); pointer-events: none; }
    .venues::before { left: 0; background: linear-gradient(90deg, var(--color-paper), transparent); }
    .venues::after { right: 0; background: linear-gradient(-90deg, var(--color-paper), transparent); }
    .head { display: flex; justify-content: center; margin-bottom: 30px; }
    .track { display: flex; width: max-content; animation: run 70s linear infinite; }
    @keyframes run { to { transform: translateX(-50%); } }
    .row { display: flex; align-items: center; flex: none; }
    .venue { display: flex; align-items: center; gap: 14px; min-height: 96px; padding-inline: clamp(24px, 3vw, 46px); color: var(--color-ink-2); opacity: 0.82; transition: color 300ms ease, opacity 300ms ease; }
    .venue[data-layout='stack'], .venue[data-layout='text'] { flex-direction: column; justify-content: center; gap: 8px; }
    .txt { display: grid; justify-items: center; gap: 4px; }
    .venue[data-layout='inline'] .txt { justify-items: start; }
    .mark { width: 46px; height: 46px; flex: none; transition: rotate 700ms var(--ease-spring), scale 500ms var(--ease-spring); }
    .venue[data-layout='stack'] .mark { width: 40px; height: 40px; }
    .seal { width: 96px; height: 96px; transition: rotate 1400ms var(--ease-out); }
    .o { fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
    .o.thin { stroke-width: 0.7; }
    .f { fill: currentColor; }
    .f.soft { opacity: 0.85; }
    .ring-text { font-family: var(--font-label); font-size: 9.4px; letter-spacing: 2.4px; fill: currentColor; }
    .mono { font-family: var(--font-display); font-style: italic; font-size: 18px; fill: currentColor; }
    @media (hover: hover) and (pointer: fine) {
      .venue:hover { color: var(--color-accent); opacity: 1; }
      .venue:hover .mark { rotate: -8deg; scale: 1.12; }
      .venue:hover .seal { rotate: 120deg; }
    }
    .name { font-size: clamp(1.4rem, 2.4vw, 2.1rem); line-height: 1.1; white-space: nowrap; }
    .kind { font-family: var(--font-label); font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--color-muted); }
    [data-style='serif'] .name { font-family: var(--font-display); letter-spacing: 0.02em; }
    [data-style='italic'] .name { font-family: var(--font-display); font-style: italic; }
    [data-style='script'] .name { font-family: var(--font-script); font-size: clamp(2.2rem, 3.6vw, 3.2rem); }
    [data-style='caps'] .name { font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.22em; font-size: clamp(1rem, 1.7vw, 1.45rem); }
    [data-style='condensed'] .name { font-family: var(--font-label); font-weight: 300; font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.12em; font-size: clamp(1.2rem, 2vw, 1.75rem); }
    .sep svg { width: 10px; height: 10px; fill: var(--color-accent); opacity: 0.7; }
  `,
})
export class Venues {
  protected readonly venues = VENUES;
}
