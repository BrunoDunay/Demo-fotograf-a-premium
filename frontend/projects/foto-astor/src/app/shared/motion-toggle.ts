import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';

/** Interruptor accesible para apagar animaciones. Se guarda en el navegador y recarga la página. */
@Component({
  selector: 'app-motion-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" role="switch" [attr.aria-checked]="reduced()" (click)="toggle()">
      <span class="track"><span class="thumb"></span></span>
      Reducir movimiento
    </button>
  `,
  styles: `
    button { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; font-size: 0.84rem; color: inherit; opacity: 0.75; transition: opacity 200ms ease; }
    @media (hover: hover) and (pointer: fine) { button:hover { opacity: 1; } }
    .track { position: relative; width: 34px; height: 20px; border-radius: 999px; box-shadow: inset 0 0 0 1px currentColor; }
    .thumb { position: absolute; top: 4px; left: 4px; width: 12px; height: 12px; border-radius: 50%; background: currentColor; transition: translate 250ms var(--ease-out); }
    [aria-checked='true'] .thumb { translate: 14px 0; }
  `,
})
export class MotionToggle {
  protected readonly reduced = signal(false);

  constructor() {
    afterNextRender(() => this.reduced.set(document.documentElement.classList.contains('reduce-motion')));
  }

  protected toggle() {
    try {
      localStorage.setItem('reduce-motion', this.reduced() ? '0' : '1');
    } catch {}
    location.reload();
  }
}
