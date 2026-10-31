import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CelestialKind = 'orbit-star' | 'stars' | 'moon' | 'ring' | 'planet';

/**
 * Elementos gráficos de la marca (estrellas de cuatro puntas, órbitas y lunas en línea fina), tomados de la
 * referencia "Elementos gráficos". Son decoración: se dibujan con trazo fino y heredan el color del texto.
 */
@Component({
  selector: 'app-celestial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 120" [class]="kind()">
      @switch (kind()) {
        @case ('orbit-star') {
          <ellipse class="line" cx="60" cy="60" rx="56" ry="20" transform="rotate(-18 60 60)" />
          <circle cx="110" cy="40" r="2.6" />
          <path class="spark" d="M60 26c.9 18 6 27 20 34-14 1-19.1 10-20 34-.9-24-6-33-20-34 14-7 19.1-16 20-34Z" />
          <path class="spark small" d="M86 66c.4 7 2.4 10.8 8 13.3-5.6.5-7.6 4.3-8 13.3-.4-9-2.4-12.8-8-13.3 5.6-2.5 7.6-6.3 8-13.3Z" />
        }
        @case ('stars') {
          <path class="spark" d="M44 14c1 22 7 33 24 41-17 1-23 12-24 41-1-29-7-40-24-41 17-8 23-19 24-41Z" />
          <path class="spark small" d="M86 50c.5 10 3.3 15 11 19-7.7.6-10.5 5.5-11 19-.5-13.5-3.3-18.4-11-19 7.7-4 10.5-9 11-19Z" />
          <ellipse class="line" cx="60" cy="64" rx="54" ry="13" transform="rotate(-14 60 64)" />
          <circle cx="12" cy="74" r="2.2" />
        }
        @case ('moon') {
          <path d="M72 18a42 42 0 1 0 30 56 34 34 0 0 1-30-56Z" class="fill" />
          <path class="spark" d="M48 40c.6 12 4 18 13 22-9 .7-12.4 6.6-13 22-.6-15.4-4-21.3-13-22 9-4 12.4-10 13-22Z" />
        }
        @case ('ring') {
          <circle class="line" cx="60" cy="60" r="34" />
          <path class="fill" d="M90 44c6 10 6 22 0 32-2-6-6-8-10-9 5-4 8-11 10-23Z" />
          <circle cx="86" cy="32" r="3" />
          <path class="spark" d="M60 38c.6 11 3.6 16.6 12 22-8.4.6-11.4 6-12 22-.6-16-3.6-21.4-12-22 8.4-5.4 11.4-11 12-22Z" />
        }
        @case ('planet') {
          <circle class="line" cx="60" cy="60" r="26" />
          <ellipse class="line soft" cx="60" cy="62" rx="56" ry="12" transform="rotate(-16 60 62)" />
          <circle cx="112" cy="46" r="2.4" />
        }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-block; width: var(--size, 120px); aspect-ratio: 1; color: inherit; pointer-events: none; }
    svg { width: 100%; height: 100%; overflow: visible; fill: currentColor; }
    .line { fill: none; stroke: currentColor; stroke-width: 0.9; }
    .soft { opacity: 0.6; }
    .fill { fill: currentColor; }
    .spark { transform-box: fill-box; transform-origin: center; }
    :host(.twinkle) .spark { animation: twinkle 4.8s var(--ease-in-out) infinite; }
    :host(.twinkle) .spark.small { animation-delay: -1.8s; animation-duration: 3.6s; }
    @keyframes twinkle {
      0%, 100% { scale: 1; opacity: 1; }
      45% { scale: 0.72; opacity: 0.55; }
      55% { scale: 1.08; opacity: 1; }
    }
  `,
})
export class Celestial {
  readonly kind = input<CelestialKind>('orbit-star');
}
