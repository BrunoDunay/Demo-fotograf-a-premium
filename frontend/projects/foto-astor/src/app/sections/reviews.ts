import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BRAND, REVIEWS, Review } from '../core/content';
import { photo, photoSrc } from '../core/media';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

interface FeedItem extends Review {
  liked: boolean;
  pending?: boolean;
}

const EVENTS = ['Boda', 'XV años', 'Bautizo', 'Primera comunión', 'Graduación', 'Otro evento'];

/**
 * Reseñas al estilo de los comentarios de Instagram: a la izquierda la caja para dejar la tuya (como la
 * pregunta de historias de la referencia, con su sello redondo y la cinta), a la derecha lo que otros escribieron
 * con "me gusta" y las respuestas de Emilio. Sin backend: lo que se publica se queda en esta página (vista previa).
 */
@Component({
  selector: 'app-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, Reveal, Celestial],
  template: `
    <section id="resenas" class="section reviews" aria-labelledby="reviews-title">
      <div class="container">
        <header class="head">
          <p class="label kicker" data-reveal>Reseñas</p>
          <h2 id="reviews-title" class="title" data-reveal>
            Lo que dicen <em>quienes ya brillaron</em>
          </h2>
          <p class="score" data-reveal>
            <span class="stars" aria-hidden="true">@for (s of [1, 2, 3, 4, 5]; track s) {<app-icon name="star" [size]="14" />}</span>
            <b>4.9</b> de 5 · {{ 128 + extra() }} reseñas en Google y en el sitio
          </p>
        </header>

        <div class="layout">
          <!-- Caja para escribir: la pregunta de historias de la referencia. -->
          <div class="compose-wrap" data-reveal>
            <span class="tape" aria-hidden="true"></span>
            <form class="compose" (ngSubmit)="publish()" #f="ngForm">
              <span class="seal" aria-hidden="true"><app-icon name="heart" [size]="26" [stroke]="1.4" /></span>
              <p class="label ask">Déjame tu reseña</p>
              <label class="visually-hidden" for="rv-text">Tu reseña</label>
              <textarea
                id="rv-text"
                name="text"
                [(ngModel)]="text"
                required
                maxlength="280"
                rows="3"
                placeholder="Escribe algo…"
              ></textarea>
              <div class="rate" role="radiogroup" aria-label="Calificación">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <button type="button" role="radio" [attr.aria-checked]="stars() === s" [attr.aria-label]="s + ' de 5'" [class.on]="s <= stars()" (click)="stars.set(s)">
                    <app-icon name="star" [size]="20" />
                  </button>
                }
              </div>
              <div class="fields">
                <label>
                  <span class="label">Tu nombre</span>
                  <input name="name" [(ngModel)]="name" required maxlength="40" autocomplete="name" placeholder="Ana López" />
                </label>
                <label>
                  <span class="label">Tu evento</span>
                  <select name="event" [(ngModel)]="eventType">
                    @for (e of events; track e) {
                      <option [value]="e">{{ e }}</option>
                    }
                  </select>
                </label>
              </div>
              <div class="send-row">
                <span class="chars label">{{ text.length }}/280</span>
                <button type="submit" class="btn btn-ink" [disabled]="!text.trim() || !name.trim()">
                  <span class="btn-t">Publicar</span> <app-icon name="send" [size]="16" />
                </button>
              </div>
              @if (sent()) {
                <p class="note" role="status">Gracias. En el sitio real tu reseña pasaría por revisión antes de publicarse.</p>
              }
            </form>
            <p class="script sign">Te leo, siempre.</p>
            <app-celestial class="deco" kind="moon" />
          </div>

          <!-- Comentarios -->
          <ul class="feed" aria-label="Reseñas publicadas">
            @for (r of visible(); track r.user + r.when) {
              <li class="item" [class.pending]="r.pending">
                <img class="avatar" [src]="avatar(r.photo)" alt="" loading="lazy" />
                <div class="bubble">
                  <p class="meta">
                    <b>{{ r.user }}</b>
                    <span class="event">{{ r.event }}</span>
                  </p>
                  <p class="stars-row" [attr.aria-label]="r.stars + ' de 5 estrellas'">
                    @for (s of [1, 2, 3, 4, 5]; track s) {
                      <app-icon name="star" [size]="11" [class.off]="s > r.stars" />
                    }
                  </p>
                  <p class="text">{{ r.text }}</p>
                  <p class="actions">
                    <span>{{ r.when }}</span>
                    <span>{{ r.likes + (r.liked ? 1 : 0) }} me gusta</span>
                    @if (r.pending) {
                      <span class="tag">En revisión</span>
                    }
                  </p>
                  @if (r.reply) {
                    <div class="reply">
                      <span class="avatar me" aria-hidden="true">A</span>
                      <div>
                        <p class="meta"><b>{{ brand.instagram.slice(1) }}</b> <app-icon class="check" name="verified" [size]="13" /></p>
                        <p class="text">{{ r.reply }}</p>
                      </div>
                    </div>
                  }
                </div>
                <button type="button" class="like" [class.on]="r.liked" [attr.aria-pressed]="r.liked" [attr.aria-label]="'Me gusta la reseña de ' + r.name" (click)="like(r)">
                  <app-icon [name]="r.liked ? 'heart-fill' : 'heart'" [size]="18" />
                </button>
              </li>
            }
            @if (!all()) {
              <li class="more-row">
                <button type="button" class="more link" (click)="all.set(true)">Ver {{ feed().length - 4 }} reseñas más</button>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: `
    .head { display: grid; justify-items: center; gap: 16px; text-align: center; margin-bottom: 64px; }
    .title { font-size: var(--text-2xl); display: grid; justify-items: center; }
    .title em { color: var(--color-accent); }
    .score { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px; color: var(--color-muted); font-size: 0.92rem; }
    .score b { color: var(--color-ink); font-weight: 600; }
    .stars { display: inline-flex; gap: 2px; color: var(--color-accent); }

    .layout { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(32px, 6vw, 96px); align-items: start; }

    .compose-wrap { position: sticky; top: 110px; padding-top: 40px; }
    .tape { left: -8%; right: -8%; top: 128px; height: 74px; rotate: -2deg; }
    .compose {
      position: relative;
      display: grid;
      gap: 16px;
      padding: 54px clamp(20px, 3vw, 34px) 26px;
      background: #f7f8fa;
      border-radius: 22px;
      box-shadow: var(--shadow-lift);
    }
    .seal { position: absolute; top: -34px; left: 50%; translate: -50% 0; display: grid; place-items: center; width: 68px; height: 68px; border-radius: 50%; background: #a4514f; color: #fbf6ee; box-shadow: 0 10px 20px -8px rgb(60 40 20 / 50%); }
    .ask { text-align: center; font-size: 0.86rem; letter-spacing: 0.24em; color: var(--color-ink); }
    textarea {
      width: 100%;
      min-height: 96px;
      padding: 16px 18px;
      border: 0;
      border-radius: 14px;
      resize: vertical;
      background: #e6e2e4;
      color: var(--color-ink);
      text-align: center;
      line-height: 1.5;
      transition: box-shadow 200ms ease;
    }
    textarea::placeholder { color: rgb(20 27 45 / 50%); }
    textarea:focus { outline: none; box-shadow: inset 0 0 0 1.5px #a4514f; }
    .rate { display: flex; justify-content: center; gap: 4px; }
    .rate button { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-paper-3); transition: color 200ms ease, scale 200ms var(--ease-spring); }
    .rate button.on { color: var(--color-accent); }
    .rate button:active { scale: 0.85; }
    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fields label { display: grid; gap: 6px; }
    .fields .label { color: var(--color-muted); font-size: 0.62rem; }
    input, select { width: 100%; min-height: 46px; padding: 0 14px; border: 1px solid var(--color-line-2); border-radius: 12px; background: transparent; }
    input:focus, select:focus { outline: none; border-color: #a4514f; }
    .send-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .chars { color: var(--color-muted); }
    .send-row .btn { min-height: 46px; }
    .send-row .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .note { font-size: 0.86rem; color: var(--color-muted); text-align: center; animation: in 500ms var(--ease-out); }
    @keyframes in { from { opacity: 0; translate: 0 6px; } }
    .sign { margin-top: 26px; text-align: center; font-size: 2.6rem; color: #a4514f; }
    .deco { position: absolute; right: 0; bottom: 10px; --size: 64px; opacity: 0.35; color: #a4514f; }

    .feed { display: grid; gap: 4px; }
    .item { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; gap: 14px; padding: 18px 0; border-bottom: 1px solid var(--color-line); animation: in 600ms var(--ease-out) both; }
    .item.pending { background: linear-gradient(90deg, rgb(164 81 79 / 10%), transparent); border-radius: 12px; padding-inline: 10px; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 2px var(--color-paper), 0 0 0 3.5px var(--color-accent-soft); }
    .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 0.92rem; }
    .meta b { font-weight: 600; }
    .event { font-size: 0.82rem; color: var(--color-muted); }
    .stars-row { display: flex; gap: 1px; margin-top: 3px; color: var(--color-accent); }
    .stars-row .off { color: var(--color-paper-3); }
    .text { margin-top: 6px; font-size: 0.98rem; line-height: 1.55; color: var(--color-ink-2); }
    .actions { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; font-size: 0.78rem; color: var(--color-muted); font-weight: 500; }
    .tag { color: #a4514f; }
    .reply { display: grid; grid-template-columns: 30px 1fr; gap: 10px; margin-top: 14px; padding-left: 4px; }
    .reply .me { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--color-ink); color: var(--color-paper); font-family: var(--font-display); font-size: 0.9rem; box-shadow: none; }
    .reply .text { margin-top: 2px; font-size: 0.92rem; }
    .check { color: #3b82c4; }
    .like { display: grid; place-items: center; width: 44px; height: 44px; color: var(--color-muted); transition: color 200ms ease, scale 260ms var(--ease-spring); }
    .like.on { color: #c2410c; animation: pop 400ms var(--ease-spring); }
    .like:active { scale: 0.85; }
    @keyframes pop { 40% { scale: 1.3; } }
    .more-row { padding-top: 18px; }
    .more { font-size: 0.92rem; font-weight: 500; }

    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .compose-wrap { position: relative; top: 0; max-width: 520px; margin-inline: auto; width: 100%; }
    }
    @media (max-width: 480px) {
      .fields { grid-template-columns: 1fr; }
      .tape { left: -4%; right: -4%; }
    }
  `,
})
export class Reviews {
  protected readonly brand = BRAND;
  protected readonly events = EVENTS;
  protected readonly feed = signal<FeedItem[]>(REVIEWS.map((r) => ({ ...r, liked: false })));
  protected readonly all = signal(false);
  protected readonly visible = computed(() => (this.all() ? this.feed() : this.feed().slice(0, 4)));
  protected readonly extra = signal(0);
  protected readonly stars = signal(5);
  protected readonly sent = signal(false);
  protected text = '';
  protected name = '';
  protected eventType = EVENTS[0];

  protected avatar(name: string) {
    return photoSrc(photo(name), true);
  }

  protected like(r: FeedItem) {
    this.feed.update((list) => list.map((x) => (x === r ? { ...x, liked: !x.liked } : x)));
  }

  protected publish() {
    const text = this.text.trim();
    const name = this.name.trim();
    if (!text || !name) return;
    const user = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
    const item: FeedItem = {
      name,
      user: user || 'invitado',
      event: this.eventType,
      when: 'ahora',
      stars: this.stars(),
      text,
      likes: 0,
      photo: 'brindis-confeti',
      liked: false,
      pending: true,
    };
    this.feed.update((list) => [item, ...list]);
    this.extra.update((n) => n + 1);
    this.text = '';
    this.sent.set(true);
    setTimeout(() => this.sent.set(false), 6000);
  }
}
