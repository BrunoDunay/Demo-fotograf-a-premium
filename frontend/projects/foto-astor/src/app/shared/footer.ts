import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND } from '../core/content';
import { Celestial } from './celestial';
import { Icon } from './icon';
import { Logo } from './logo';
import { MotionToggle } from './motion-toggle';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo, Icon, MotionToggle, Celestial],
  template: `
    <footer class="foot on-night">
      <div class="container top">
        <div class="sign">
          <app-logo />
          <p class="script line">Hasta la última canción.</p>
          <p class="small">{{ brand.role }} · {{ brand.city }}, desde {{ brand.since }}.</p>
        </div>
        <nav class="col" aria-label="Sitio">
          <p class="label head">Sitio</p>
          <a routerLink="/galeria">Galería</a>
          <a routerLink="/sobre-mi">Sobre mí</a>
          <a routerLink="/equipo">Mi equipo</a>
          <a routerLink="/paquetes">Paquetes</a>
          <a routerLink="/contacto">Contacto</a>
        </nav>
        <div class="col">
          <p class="label head">Estudio</p>
          <span class="row"><app-icon name="pin" [size]="16" />{{ brand.address }}</span>
          <span class="row"><app-icon name="phone" [size]="16" />{{ brand.phone }}</span>
          <span class="row"><app-icon name="mail" [size]="16" />{{ brand.email }}</span>
          <span class="row"><app-icon name="instagram" [size]="16" />{{ brand.instagram }}</span>
          <span class="row muted">{{ brand.hours }}</span>
        </div>
        <app-celestial class="mark twinkle" kind="orbit-star" />
      </div>
      <div class="container bottom">
        <nav class="legal" aria-label="Legal">
          <a routerLink="/aviso-de-privacidad">Aviso de privacidad</a>
          <a routerLink="/terminos-y-condiciones">Términos y condiciones</a>
          <a routerLink="/cookies">Cookies</a>
        </nav>
        <app-motion-toggle />
        <p class="demo">
          Sitio demo con marca ficticia · Diseño y desarrollo:
          <a [href]="brand.portfolio" target="_blank" rel="noopener">Bruno Dunay</a>
        </p>
      </div>
    </footer>
  `,
  styles: `
    .foot { position: relative; overflow: hidden; padding-block: 96px 28px; }
    .top { position: relative; display: grid; grid-template-columns: 1.4fr 1fr 1.3fr; gap: 48px; }
    .sign { display: grid; gap: 14px; align-content: start; font-size: 22px; }
    .line { font-size: clamp(2.6rem, 5vw, 3.6rem); color: var(--color-accent-soft); margin-top: 6px; }
    .small { font-size: 0.92rem; color: var(--color-on-night-2); max-width: 30ch; }
    .col { display: grid; gap: 10px; align-content: start; font-size: 0.95rem; }
    .head { color: var(--color-on-night-2); margin-bottom: 6px; }
    .col a { width: fit-content; opacity: 0.85; transition: opacity 200ms ease, translate 300ms var(--ease-out); }
    @media (hover: hover) and (pointer: fine) { .col a:hover { opacity: 1; translate: 4px 0; } }
    .row { display: inline-flex; align-items: center; gap: 10px; }
    .row app-icon { opacity: 0.6; }
    .muted { color: var(--color-on-night-2); padding-left: 26px; }
    .mark { position: absolute; right: var(--gutter); top: -60px; --size: 150px; opacity: 0.18; }
    .bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px 28px; margin-top: 72px; padding-top: 22px; border-top: 1px solid var(--color-line-night); font-size: 0.84rem; color: var(--color-on-night-2); }
    .legal { display: flex; flex-wrap: wrap; gap: 6px 22px; }
    .legal a { min-height: 44px; display: inline-flex; align-items: center; transition: color 200ms ease; }
    @media (hover: hover) and (pointer: fine) { .legal a:hover, .demo a:hover { color: var(--color-on-night); } }
    .demo a { text-decoration: underline; text-underline-offset: 3px; }
    @media (max-width: 860px) {
      .top { grid-template-columns: 1fr 1fr; }
      .sign { grid-column: 1 / -1; }
    }
    @media (max-width: 520px) {
      .top { grid-template-columns: 1fr; gap: 36px; }
      .mark { --size: 100px; top: -30px; }
    }
  `,
})
export class Footer {
  protected readonly brand = BRAND;
}
