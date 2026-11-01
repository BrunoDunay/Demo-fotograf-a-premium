import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const KEY = 'astor-cookies';

/**
 * Aviso de cookies. "Solo necesarias" deja el sitio igual; "Aceptar todas" permitiría cargar Google Analytics
 * y el pixel de Meta (en la demo no se carga ninguno). Se guarda la elección en el navegador.
 */
@Component({
  selector: 'app-cookie-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (show()) {
      <aside class="banner" [class.closing]="closing()" role="region" aria-label="Aviso de cookies">
        <p class="script title">Una galleta, ¿no?</p>
        <p class="text">
          Uso cookies necesarias para que el sitio funcione y, si aceptas, de medición para saber qué fotos te gustan más.
          <a routerLink="/cookies">Leer la política</a>.
        </p>
        <div class="actions">
          <button type="button" class="btn btn-line" (click)="choose('necesarias')"><span class="btn-t">Solo necesarias</span></button>
          <button type="button" class="btn btn-ink" (click)="choose('todas')"><span class="btn-t">Aceptar todas</span></button>
        </div>
      </aside>
    }
  `,
  styles: `
    .banner {
      position: fixed;
      left: max(16px, var(--gutter));
      bottom: 16px;
      z-index: var(--z-banner);
      width: min(400px, calc(100vw - 32px));
      padding: 22px 22px 20px;
      background: var(--color-card);
      color: var(--color-ink);
      border-radius: var(--radius-2);
      box-shadow: var(--shadow-lift);
      animation: in 700ms var(--ease-out) 1.2s both;
    }
    .banner.closing { animation: out 240ms ease-in both; }
    @keyframes in { from { opacity: 0; translate: 0 24px; } }
    @keyframes out { to { opacity: 0; translate: 0 16px; } }
    .title { font-size: 2.2rem; margin-bottom: 6px; }
    .text { font-size: 0.88rem; color: var(--color-ink-2); line-height: 1.55; }
    .text a { text-decoration: underline; text-underline-offset: 3px; }
    .actions { display: flex; gap: 10px; margin-top: 16px; }
    .actions .btn { flex: 1; min-height: 44px; padding: 0 14px; font-size: 0.66rem; letter-spacing: 0.14em; }
  `,
})
export class CookieBanner {
  protected readonly show = signal(false);
  protected readonly closing = signal(false);

  constructor() {
    afterNextRender(() => {
      try {
        this.show.set(!localStorage.getItem(KEY));
      } catch {
        this.show.set(true);
      }
    });
  }

  protected choose(value: 'necesarias' | 'todas') {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    this.closing.set(true);
    setTimeout(() => this.show.set(false), 240);
  }
}
