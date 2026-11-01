import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, output, signal } from '@angular/core';
import { EVENT_PHOTOS, PhotoData, photoSrc, photoSrcset, shuffle } from '../../core/media';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'boda', label: 'Bodas' },
  { id: 'xv', label: 'XV años' },
  { id: 'social', label: 'Eventos sociales' },
] as const;
type FilterId = (typeof FILTERS)[number]['id'];
const PAGE = 24;

/**
 * Archivo: después del recorrido en 3D, todas las fotos en una cuadrícula tipo mosaico, para verlas con calma.
 * Filtros por tipo de evento (con una pastilla que se desliza), carga por tandas y visor al tocar una foto.
 */
@Component({
  selector: 'app-gallery-archive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <header class="head">
        <div>
          <p class="label kicker">Archivo</p>
          <h2 class="title">Todas las fotos, <em>sin recorrido</em></h2>
        </div>
        <p class="lead">Si prefieres verlas con calma, aquí están en orden. Toca cualquiera para verla en grande.</p>
      </header>

      <div class="filters" role="tablist" aria-label="Filtrar por tipo de evento">
        <span class="pill" [style.translate]="pill().x + 'px 0'" [style.width.px]="pill().w"></span>
        @for (f of filters; track f.id) {
          <button type="button" role="tab" [attr.aria-selected]="filter() === f.id" (click)="setFilter(f.id, $event)">
            {{ f.label }} <span class="count">{{ countOf(f.id) }}</span>
          </button>
        }
      </div>

      <ul class="grid" [attr.data-filter]="filter()">
        @for (p of shown(); track p.name; let i = $index) {
          <li class="cell" [style.--i]="i % pageSize" [style.aspect-ratio]="p.w + ' / ' + p.h" [style.background]="p.tone">
            <button type="button" (click)="pick(i)" [attr.aria-label]="'Ver foto: ' + p.alt">
              <img [src]="small(p)" [srcset]="set(p)" sizes="(max-width: 760px) 50vw, 25vw" [alt]="p.alt" loading="lazy" decoding="async" />
              <span class="cap">
                <span class="label kind">{{ kindOf(p) }}</span>
                <span class="alt">{{ p.alt }}</span>
              </span>
            </button>
          </li>
        }
      </ul>

      @if (shown().length < list().length) {
        <div class="more">
          <button type="button" class="btn btn-line" (click)="more()"><span class="btn-t">Ver más fotos ({{ list().length - shown().length }})</span></button>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; position: relative; padding-block: clamp(80px, 12vw, 140px); background: var(--color-paper); color: var(--color-ink); }
    :host::before { content: ''; position: absolute; inset: 0 0 auto; height: 120px; translate: 0 -100%; background: linear-gradient(to bottom, transparent, var(--color-paper)); pointer-events: none; }
    .head { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px 64px; align-items: end; margin-bottom: 40px; }
    .kicker { color: var(--color-muted); }
    .title { font-size: var(--text-2xl, clamp(2.6rem, 5vw, 4.4rem)); line-height: 1; margin-top: 12px; }
    .title em { color: var(--color-accent); }
    .lead { color: var(--color-ink-2); max-width: 38ch; }

    .filters { position: relative; display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 5px; border-radius: var(--radius-pill); background: var(--color-paper-2); margin-bottom: 32px; }
    .pill { position: absolute; left: 0; top: 5px; bottom: 5px; border-radius: var(--radius-pill); background: var(--color-ink); transition: translate 520ms var(--ease-out), width 520ms var(--ease-out); }
    .filters button { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 18px; border-radius: var(--radius-pill); font-size: 0.9rem; color: var(--color-ink-2); transition: color 380ms ease; }
    .filters button[aria-selected='true'] { color: var(--color-on-night); }
    .count { font-family: var(--font-label); font-size: 0.68rem; opacity: 0.6; }
    @media (hover: hover) and (pointer: fine) { .filters button:not([aria-selected='true']):hover { color: var(--color-ink); } }

    /* Mosaico: columnas de alto natural (cada foto conserva su proporción). */
    .grid { columns: 4 240px; column-gap: 12px; }
    .cell { position: relative; break-inside: avoid; margin-bottom: 12px; overflow: hidden; border-radius: 4px; animation: rise 700ms var(--ease-out) both; animation-delay: calc(var(--i) * 35ms); }
    @keyframes rise { from { opacity: 0; translate: 0 22px; } }
    .cell button { position: relative; display: block; width: 100%; height: 100%; cursor: zoom-in; }
    .cell img { display: block; width: 100%; height: 100%; object-fit: cover; transition: scale 900ms var(--ease-out), filter 600ms ease; }
    .cap { position: absolute; inset: auto 0 0; display: grid; gap: 4px; padding: 40px 16px 14px; color: #fff; background: linear-gradient(to top, rgb(7 11 22 / 78%), transparent); text-align: left; opacity: 0; translate: 0 12px; transition: opacity 400ms ease, translate 500ms var(--ease-out); }
    .kind { color: var(--color-accent-soft); font-size: 0.6rem; }
    .alt { font-size: 0.86rem; line-height: 1.35; }
    @media (hover: hover) and (pointer: fine) {
      .cell:hover img { scale: 1.045; }
      .cell:hover .cap { opacity: 1; translate: 0 0; }
      .grid:has(.cell:hover) .cell:not(:hover) img { filter: saturate(0.6) brightness(0.92); }
    }
    .cell button:focus-visible .cap { opacity: 1; translate: 0 0; }

    .more { display: flex; justify-content: center; margin-top: 36px; }

    @media (max-width: 760px) {
      .head { grid-template-columns: 1fr; }
      .filters { display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; max-width: 100%; }
      .filters button { white-space: nowrap; padding: 0 14px; }
      .grid { columns: 2; column-gap: 8px; }
      .cell { margin-bottom: 8px; }
    }
    @media (prefers-reduced-motion: reduce) { .cell { animation: none; } }
  `,
})
export class GalleryArchive {
  readonly open = output<{ photos: string[]; index: number }>();
  protected readonly filters = FILTERS;
  protected readonly pageSize = PAGE;
  protected readonly filter = signal<FilterId>('todas');
  protected readonly limit = signal(PAGE);
  protected readonly pill = signal({ x: 0, w: 0 });

  // Orden fijo (con semilla) para que el prerender y el navegador coincidan; mezcla bodas, XV y eventos.
  private readonly all = shuffle(EVENT_PHOTOS, 7);
  protected readonly list = computed(() => (this.filter() === 'todas' ? this.all : this.all.filter((p) => p.cat === this.filter())));
  protected readonly shown = computed(() => this.list().slice(0, this.limit()));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // La pastilla arranca debajo del primer filtro en cuanto hay medidas (y se reacomoda si cambia el ancho).
    afterNextRender(() => {
      this.placePill();
      document.fonts?.ready.then(() => this.placePill());
      const onResize = () => this.placePill();
      addEventListener('resize', onResize, { passive: true });
      destroyRef.onDestroy(() => removeEventListener('resize', onResize));
    });
  }

  protected countOf(id: FilterId) {
    return id === 'todas' ? this.all.length : this.all.filter((p) => p.cat === id).length;
  }

  protected kindOf(p: PhotoData) {
    return p.cat === 'boda' ? 'Boda' : p.cat === 'xv' ? 'XV años' : 'Evento social';
  }

  protected setFilter(id: FilterId, e: Event) {
    if (id === this.filter()) return;
    this.filter.set(id);
    this.limit.set(PAGE);
    this.placePill(e.currentTarget as HTMLElement);
  }

  private placePill(btn?: HTMLElement) {
    if (typeof document === 'undefined') return;
    const b = btn ?? this.host.querySelector<HTMLElement>('.filters button[aria-selected="true"]');
    if (b) this.pill.set({ x: b.offsetLeft, w: b.offsetWidth });
  }

  protected more() {
    this.limit.update((n) => n + PAGE);
  }

  protected pick(i: number) {
    this.open.emit({ photos: this.list().map((p) => p.name), index: i });
  }

  protected small(p: PhotoData) {
    return photoSrc(p, true);
  }

  protected set(p: PhotoData) {
    return photoSrcset(p);
  }
}
