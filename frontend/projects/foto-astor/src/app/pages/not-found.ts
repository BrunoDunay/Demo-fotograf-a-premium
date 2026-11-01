import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { photo, photoSrc } from '../core/media';

/** 404: una instantánea que "no se reveló" (velada) y el camino de regreso. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="nf">
      <figure class="pol" aria-hidden="true">
        <img [src]="src" alt="" />
        <figcaption class="script">esta no salió</figcaption>
      </figure>
      <div class="copy">
        <p class="label kicker">Error 404</p>
        <h1 class="title">Esta foto <em>se veló</em></h1>
        <p class="lead">La página que buscas no existe o cambió de lugar. Pasa, la mesa sigue llena de fotos.</p>
        <div class="ctas">
          <a routerLink="/" class="btn btn-ink"><span class="btn-t">Volver al inicio</span></a>
          <a routerLink="/galeria" class="btn btn-line"><span class="btn-t">Ir a la galería</span></a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .nf { min-height: 100svh; display: grid; grid-template-columns: auto minmax(0, 520px); place-content: center; align-items: center; gap: clamp(32px, 6vw, 90px); padding: 120px var(--gutter) 80px; }
    .pol { width: min(300px, 70vw); padding: 14px 14px 64px; background: #fbfaf6; box-shadow: var(--shadow-lift); rotate: -5deg; position: relative; }
    .pol img { width: 100%; aspect-ratio: 1; object-fit: cover; filter: blur(14px) brightness(1.6) sepia(0.4); }
    .pol figcaption { position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-size: 2rem; color: #333; }
    .copy { display: grid; gap: 18px; }
    .title { font-size: var(--text-3xl); }
    .title em { color: var(--color-accent); }
    .ctas { display: flex; flex-wrap: wrap; gap: 12px; }
    @media (max-width: 760px) { .nf { grid-template-columns: 1fr; justify-items: center; text-align: center; } .ctas { justify-content: center; } }
  `,
})
export default class NotFound {
  protected readonly src = photoSrc(photo('chispas-frias'), true);
}
