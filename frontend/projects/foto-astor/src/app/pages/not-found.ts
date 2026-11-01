import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { photo, photoSrc } from '../core/media';

/** 404: una tira de prueba de cuarto oscuro donde ninguna exposición salió bien, y el camino de regreso. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="nf">
      <figure class="strip" aria-hidden="true">
        <span class="ph">
          <img [src]="src" alt="" />
          <span class="bands">
            @for (b of bands; track b.t) {
              <span class="band" [style.--fog]="b.fog" [style.--burn]="b.burn"><b class="label">{{ b.t }}</b></span>
            }
          </span>
        </span>
        <figcaption>
          <span class="label">Prueba Nº 404</span>
          <span class="label miss">Ninguna salió</span>
        </figcaption>
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
    /* Tira de prueba: la misma foto con cinco tiempos de exposición; de velada a quemada. */
    .strip { position: relative; width: min(340px, 74vw); padding: 14px 14px 0; rotate: -4deg; background: radial-gradient(120% 90% at 30% 10%, #f7f4ee, #ebe5d8); box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 8%), var(--shadow-lift); border-radius: 1px; }
    .ph { position: relative; display: block; overflow: hidden; box-shadow: 0 0 0 2.5px #14110d; }
    .ph img { display: block; width: 100%; aspect-ratio: 4 / 4.6; object-fit: cover; filter: blur(3px) grayscale(0.5) sepia(0.35); scale: 1.05; }
    .bands { position: absolute; inset: 0; display: flex; }
    .band { position: relative; flex: 1; background: rgb(250 246 238 / var(--fog)); backdrop-filter: brightness(calc(1 - var(--burn))); border-right: 1px solid rgb(20 17 13 / 25%); }
    .band:last-child { border-right: 0; }
    .band b { position: absolute; left: 50%; bottom: 10px; translate: -50% 0; font-size: 0.6rem; font-weight: 500; color: #fff; mix-blend-mode: difference; }
    figcaption { display: flex; justify-content: space-between; align-items: center; gap: 12px; height: 46px; font-size: 0.56rem; color: rgb(36 33 28 / 60%); }
    .miss { color: var(--color-accent); }
    .copy { display: grid; gap: 18px; }
    .title { font-size: var(--text-3xl); }
    .title em { color: var(--color-accent); }
    .ctas { display: flex; flex-wrap: wrap; gap: 12px; }
    @media (max-width: 760px) { .nf { grid-template-columns: 1fr; justify-items: center; text-align: center; } .ctas { justify-content: center; } }
  `,
})
export default class NotFound {
  protected readonly src = photoSrc(photo('chispas-frias'), true);
  protected readonly bands = [
    { t: '2 s', fog: 0.86, burn: 0 },
    { t: '4 s', fog: 0.6, burn: 0 },
    { t: '8 s', fog: 0.28, burn: 0.08 },
    { t: '16 s', fog: 0, burn: 0.5 },
    { t: '32 s', fog: 0, burn: 0.82 },
  ];
}
