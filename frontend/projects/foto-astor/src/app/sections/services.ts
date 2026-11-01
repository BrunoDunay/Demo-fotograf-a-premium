import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../core/content';
import { photo, photoSrc } from '../core/media';
import { Celestial } from '../shared/celestial';
import { Reveal } from '../shared/reveal';

/**
 * Lo que fotografía: tres renglones editoriales. Al pasar el cursor (o tocar) un renglón, sus fotos se
 * abren en abanico como una mano de cartas; las del anterior se cierran y bajan.
 */
@Component({
  selector: 'app-services',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Reveal, Celestial],
  template: `
    <section class="section services" aria-labelledby="services-title">
      <div class="container grid">
        <header class="head">
          <p class="label kicker" data-reveal>Lo que fotografío</p>
          <h2 id="services-title" class="title" data-reveal>Tres tipos de noche, <em>un mismo cuidado</em></h2>
        </header>

        <div class="fan" aria-hidden="true">
          <app-celestial class="fan-deco" kind="ring" />
          @for (s of services; track s.id; let si = $index) {
            <div class="set" [class.on]="active() === si">
              @for (p of s.photos; track p; let i = $index) {
                <figure class="print" [style.--i]="i - 2" [style.--a]="i < 2 ? 2 - i : i - 2" [style.--d]="i">
                  <img [src]="src(p)" [alt]="''" loading="lazy" />
                </figure>
              }
            </div>
          }
        </div>

        <ol class="list">
          @for (s of services; track s.id; let i = $index) {
            <li
              class="row"
              [class.on]="active() === i"
              (pointerenter)="active.set(i)"
              (focusin)="active.set(i)"
              (click)="active.set(i)"
              data-reveal
              [revealDelay]="i * 90"
            >
              <span class="n label">0{{ i + 1 }}</span>
              <div class="body">
                <h3 class="name">
                  {{ s.title }}
                  <em class="sub">{{ s.script }}</em>
                </h3>
                <p class="text">{{ s.text }}</p>
                <ul class="tags">
                  @for (t of s.tags; track t) {
                    <li>{{ t }}</li>
                  }
                </ul>
              </div>
              <a class="price" routerLink="/paquetes" [fragment]="s.id">
                <span class="label">Desde</span>
                <span class="amount">{{ money(s.from) }}</span>
              </a>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); grid-template-areas: 'head head' 'fan list'; column-gap: clamp(32px, 6vw, 96px); row-gap: 56px; align-items: center; }
    .head { grid-area: head; display: grid; gap: 18px; max-width: 760px; }
    .title { font-size: var(--text-2xl); }
    .title em { color: var(--color-accent); }

    .fan { grid-area: fan; position: sticky; top: 110px; align-self: start; height: clamp(360px, 40vw, 520px); }
    .fan-deco { position: absolute; left: 50%; top: 40%; --size: clamp(220px, 28vw, 360px); translate: -50% -50%; opacity: 0.12; }
    .set { position: absolute; inset: 0; }
    .print {
      position: absolute;
      left: 50%;
      bottom: 6%;
      width: clamp(150px, 15vw, 210px);
      margin: 0 0 0 calc(clamp(150px, 15vw, 210px) / -2);
      padding: 7px 7px 26px;
      background: #fbfaf6;
      box-shadow: var(--shadow-paper);
      transform-origin: 50% 140%;
      transform: rotate(0deg) translateY(60px);
      opacity: 0;
      transition: transform 700ms var(--ease-out), opacity 400ms ease;
      transition-delay: calc((4 - var(--d)) * 30ms);
    }
    .print img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
    .set.on .print { opacity: 1; transform: rotate(calc(var(--i) * 13deg)) translateY(calc(var(--a) * 10px)); transition-delay: calc(var(--d) * 60ms + 120ms); }

    .list { grid-area: list; border-top: 1px solid var(--color-line); }
    .row { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 18px; padding-block: 34px; border-bottom: 1px solid var(--color-line); cursor: default; }
    .n { color: var(--color-muted); padding-top: 14px; }
    .name { font-size: clamp(2.2rem, 4.4vw, 3.6rem); font-style: italic; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 18px; transition: translate 600ms var(--ease-out); }
    .name .sub { font-size: 0.6em; color: var(--color-accent); opacity: 0.5; transition: opacity 400ms ease; }
    .row.on .name { translate: 10px 0; }
    .row.on .name .sub { opacity: 1; }
    .text { margin-top: 12px; max-width: 46ch; color: var(--color-ink-2); }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .tags li { padding: 5px 12px; border-radius: var(--radius-pill); box-shadow: inset 0 0 0 1px var(--color-line-2); font-family: var(--font-label); font-size: 0.64rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-ink-2); }
    .price { display: grid; justify-items: end; align-content: start; gap: 2px; padding-top: 12px; min-height: 44px; }
    .price .label { color: var(--color-muted); }
    .amount { font-family: var(--font-display); font-size: 1.5rem; }
    @media (hover: hover) and (pointer: fine) { .price:hover .amount { text-decoration: underline; text-underline-offset: 4px; } }

    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; grid-template-areas: 'head' 'fan' 'list'; row-gap: 32px; }
      .fan { position: relative; top: 0; height: 330px; }
      .print { width: 140px; margin-left: -70px; }
      .row { grid-template-columns: 34px minmax(0, 1fr); }
      .price { grid-column: 2; justify-items: start; padding-top: 4px; }
    }
  `,
})
export class Services {
  protected readonly services = SERVICES;
  protected readonly active = signal(0);
  protected src(name: string) {
    return photoSrc(photo(name), true);
  }
  protected money(n: number) {
    return '$' + n.toLocaleString('es-MX');
  }
}
