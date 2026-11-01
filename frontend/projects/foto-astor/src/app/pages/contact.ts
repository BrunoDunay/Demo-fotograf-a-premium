import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { Booking } from '../core/booking';
import { BRAND } from '../core/content';
import { Motion } from '../core/motion';
import { Availability } from '../sections/availability';
import { BusinessCard } from '../sections/business-card';
import { ContactForm } from '../sections/contact-form';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';

/** Contacto: la tarjeta de presentación en 3D, el calendario de fechas y el formulario que abre WhatsApp. */
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BusinessCard, Availability, ContactForm, Icon, Reveal, Celestial],
  template: `
    <section class="hero">
      <div class="beams" aria-hidden="true"></div>
      <div class="container grid">
        <div class="copy">
          <p class="label kicker">Contacto</p>
          <h1 class="title">Hablemos de <em>tu fecha</em></h1>
          <p class="lead">Guárdate mi tarjeta, revisa si tu día sigue libre y mándame un mensaje. Respondo en menos de un día hábil.</p>
          <ul class="info">
            <li><app-icon name="phone" [size]="18" /><span>{{ brand.phone }}</span></li>
            <li><app-icon name="mail" [size]="18" /><span>{{ brand.email }}</span></li>
            <li><app-icon name="instagram" [size]="18" /><span>{{ brand.instagram }}</span></li>
            <li><app-icon name="pin" [size]="18" /><span>{{ brand.address }}, {{ brand.city }}</span></li>
            <li class="muted"><app-icon name="calendar" [size]="18" /><span>{{ brand.hours }} · estudio con cita</span></li>
          </ul>
          <div class="ctas">
            <button type="button" class="btn btn-ink" (click)="vcard()"><app-icon name="download" [size]="16" /> <span class="btn-t">Guardar contacto</span></button>
            <button type="button" class="btn btn-line" (click)="copy()">
              <app-icon [name]="copied() ? 'check' : 'copy'" [size]="16" /> <span class="btn-t">{{ copied() ? 'Correo copiado' : 'Copiar correo' }}</span>
            </button>
          </div>
        </div>
        <app-business-card />
      </div>
    </section>

    <section id="fechas" class="section book" aria-labelledby="book-title">
      <div class="container">
        <header class="head" data-reveal>
          <app-celestial class="deco twinkle" kind="orbit-star" />
          <p class="label kicker">Agenda</p>
          <h2 id="book-title" class="title-2">Elige tu día <em>y arma tu mensaje</em></h2>
        </header>
        <div class="book-grid">
          <app-availability data-reveal (picked)="toForm()" />
          <div id="formulario" class="form-wrap" data-reveal [revealDelay]="120">
            <app-contact-form />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; overflow: hidden; padding: 140px 0 90px; }
    .beams { position: absolute; inset: -20%; pointer-events: none; background: repeating-linear-gradient(118deg, transparent 0 160px, rgb(255 255 255 / 34%) 160px 250px, transparent 250px 330px); filter: blur(22px); }
    .grid { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 80px); align-items: center; }
    .copy { display: grid; gap: 20px; }
    .title { font-size: var(--text-3xl); }
    .title em { color: var(--color-accent); }
    .info { display: grid; gap: 12px; margin-top: 6px; }
    .info li { display: flex; align-items: center; gap: 12px; font-size: 1.02rem; }
    .info app-icon { color: var(--color-accent); }
    .info .muted { color: var(--color-muted); font-size: 0.92rem; }
    .ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }

    .book { background: linear-gradient(var(--color-paper), var(--color-paper-2)); scroll-margin-top: 70px; }
    .head { position: relative; display: grid; gap: 14px; margin-bottom: 56px; }
    .title-2 { font-size: var(--text-2xl); }
    .title-2 em { color: var(--color-accent); }
    .deco { position: absolute; right: 4%; top: -30px; --size: 90px; opacity: 0.3; }
    .book-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 80px); align-items: start; }
    .form-wrap { scroll-margin-top: 90px; }

    @media (max-width: 960px) {
      .grid, .book-grid { grid-template-columns: 1fr; }
      .hero { padding-top: 110px; }
    }
  `,
})
export default class Contact {
  protected readonly brand = BRAND;
  protected readonly copied = signal(false);
  private readonly motion = inject(Motion);
  private readonly booking = inject(Booking);
  private readonly calendar = viewChild(Availability);

  constructor() {
    afterNextRender(() => {
      const d = this.booking.date();
      if (d) this.calendar()?.showMonthOf(d);
    });
  }

  protected toForm() {
    // En celular el formulario queda abajo del calendario: se baja hasta él.
    if (innerWidth < 960) {
      const el = document.getElementById('formulario');
      if (el) setTimeout(() => this.motion.scrollTo(el), 250);
    }
  }

  /** Descarga la tarjeta como contacto (vCard). Sin teléfono: la marca es ficticia. */
  protected vcard() {
    const b = this.brand;
    const text = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Astor;Emilio;;;',
      `FN:${b.person}`,
      'ORG:Astor Fotografía',
      `TITLE:${b.role}`,
      `EMAIL;TYPE=WORK:${b.email}`,
      'URL:https://demo-foto-astor.vercel.app',
      `ADR;TYPE=WORK:;;${b.address};${b.city};Ags.;20000;México`,
      'NOTE:Contacto de un sitio demo con marca ficticia.',
      'END:VCARD',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/vcard' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emilio-astor.vcf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected async copy() {
    try {
      await navigator.clipboard.writeText(this.brand.email);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2200);
    } catch {}
  }
}
