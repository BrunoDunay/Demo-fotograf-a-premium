import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo de Astor: la palabra en Bodoni con una estrella de cuatro puntas que corta la A y una órbita fina
 * que la rodea (de la referencia de elementos gráficos). La órbita y la estrella se mueven al pasar el cursor.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [class.compact]="compact()">
      <svg class="orbit" viewBox="0 0 200 60" aria-hidden="true">
        <ellipse cx="100" cy="30" rx="96" ry="17" transform="rotate(-8 100 30)" />
        <circle class="moon" cx="187" cy="16" r="2.4" />
      </svg>
      <span class="word">Ast<span class="o">o</span>r</span>
      <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0c.7 6.3 5 10.9 12 12-7 1.1-11.3 5.7-12 12-.7-6.3-5-10.9-12-12 7-1.1 11.3-5.7 12-12Z" />
      </svg>
    </span>
  `,
  styles: `
    :host { display: inline-flex; }
    .logo { position: relative; display: inline-flex; align-items: center; padding: 0.15em 0.2em; color: inherit; }
    .word {
      font-family: var(--font-display);
      font-size: 1.6em;
      font-weight: 400;
      font-variation-settings: 'opsz' 96;
      letter-spacing: 0.04em;
      line-height: 1;
      text-transform: uppercase;
    }
    .orbit {
      position: absolute;
      left: -8%;
      top: 50%;
      width: 116%;
      translate: 0 -50%;
      overflow: visible;
      fill: none;
      stroke: currentColor;
      stroke-width: 0.8;
      opacity: 0.55;
      transition: rotate 1200ms var(--ease-out);
    }
    .moon { fill: currentColor; stroke: none; }
    .star {
      position: absolute;
      top: -0.08em;
      left: 0.06em;
      width: 0.62em;
      height: 0.62em;
      fill: currentColor;
      transition: rotate 900ms var(--ease-out), scale 600ms var(--ease-spring);
    }
    .compact .word { font-size: 1.25em; }
    @media (hover: hover) and (pointer: fine) {
      :host(:hover) .orbit { rotate: -10deg; }
      :host(:hover) .star { rotate: 90deg; scale: 1.25; }
    }
  `,
})
export class Logo {
  readonly compact = input(false);
}
