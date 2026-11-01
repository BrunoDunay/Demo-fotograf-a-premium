import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Motion } from './core/motion';
import { Seo } from './core/seo';
import { CookieBanner } from './shared/cookie-banner';
import { Footer } from './shared/footer';
import { Header } from './shared/header';
import { Intro } from './shared/intro';
import { PageCurtain } from './shared/page-curtain';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, Intro, CookieBanner, PageCurtain],
  template: `
    <a class="skip" href="#contenido">Saltar al contenido</a>
    <app-intro />
    <app-page-curtain />
    <app-header [theme]="theme()" />
    <main id="contenido">
      <router-outlet />
    </main>
    <app-footer />
    <app-cookie-banner />
  `,
  styles: `
    :host { display: block; }
    /* Sin z-index: los visores (z-index alto) de las páginas deben quedar por encima del encabezado. */
    main { position: relative; }
    .skip { position: fixed; left: 16px; top: -60px; z-index: 200; padding: 12px 18px; background: var(--color-ink); color: var(--color-paper); border-radius: var(--radius-pill); transition: top 200ms ease; }
    .skip:focus { top: 16px; }
  `,
})
export class App {
  protected readonly theme = signal<'paper' | 'night'>('paper');

  constructor() {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    inject(Seo).start();
    const motion = inject(Motion);
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let r = route;
      while (r.firstChild) r = r.firstChild;
      this.theme.set(r.snapshot.data['theme'] === 'night' ? 'night' : 'paper');
    });
    afterNextRender(() => motion.start());
  }
}
