import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Clip de oficina (pinza negra con alambres plateados), como en las referencias de "Sobre mí" y del calendario. */
@Component({
  selector: 'app-binder-clip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 90 110">
      <defs>
        <linearGradient id="clip-wire" x1="0" x2="1">
          <stop offset="0" stop-color="#6d6c69" />
          <stop offset="0.45" stop-color="#f1f0ec" />
          <stop offset="1" stop-color="#8a8986" />
        </linearGradient>
        <linearGradient id="clip-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a3a3a" />
          <stop offset="0.5" stop-color="#151515" />
          <stop offset="1" stop-color="#0b0b0b" />
        </linearGradient>
      </defs>
      <path d="M30 62 C 22 30, 18 8, 34 6 C 46 4, 44 30, 40 62" fill="none" stroke="url(#clip-wire)" stroke-width="3.2" stroke-linecap="round" />
      <path d="M60 62 C 68 30, 72 8, 56 6 C 44 4, 46 30, 50 62" fill="none" stroke="url(#clip-wire)" stroke-width="3.2" stroke-linecap="round" />
      <path d="M14 60 H76 L84 104 H6 Z" fill="url(#clip-body)" />
      <path d="M14 60 H76 L77.5 68 H12.5 Z" fill="#4a4a4a" />
      <path d="M10 98 H80" stroke="#2c2c2c" stroke-width="1" />
    </svg>
  `,
  styles: `
    :host { display: block; width: var(--clip-w, 64px); filter: drop-shadow(0 6px 6px rgb(0 0 0 / 28%)); }
    svg { width: 100%; height: auto; overflow: visible; }
  `,
})
export class BinderClip {}
