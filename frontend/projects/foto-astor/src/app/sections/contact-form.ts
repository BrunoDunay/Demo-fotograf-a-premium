import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Booking, longDate } from '../core/booking';
import { BRAND, PACKAGES } from '../core/content';
import { Icon } from '../shared/icon';

const EVENTS = ['Boda', 'XV años', 'Bautizo', 'Primera comunión', 'Graduación', 'Aniversario', 'Otro'];
const GUESTS = ['Menos de 80', '80 a 150', '150 a 300', 'Más de 300'];

/**
 * Formulario que arma el mensaje y abre WhatsApp. La vista previa del chat se escribe mientras llenas los campos.
 * En la demo el enlace no lleva número (wa.me/?text=), para no escribirle a nadie real.
 */
@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon],
  template: `
    <form class="form" (ngSubmit)="send()" #f="ngForm" novalidate>
      <div class="row two">
        <label class="field">
          <span class="label">Tu nombre</span>
          <input name="name" [(ngModel)]="name" required autocomplete="name" placeholder="Ana López" (ngModelChange)="touch()" />
        </label>
        <label class="field">
          <span class="label">Tipo de evento</span>
          <select name="event" [(ngModel)]="event" (ngModelChange)="touch()">
            @for (e of events; track e) {
              <option [value]="e">{{ e }}</option>
            }
          </select>
        </label>
      </div>
      <div class="row two">
        <label class="field">
          <span class="label">Fecha</span>
          <input name="date" type="date" [ngModel]="booking.date() ?? ''" (ngModelChange)="booking.date.set($event || null); touch()" />
        </label>
        <label class="field">
          <span class="label">Invitados</span>
          <select name="guests" [(ngModel)]="guests" (ngModelChange)="touch()">
            @for (g of guestsList; track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>
        </label>
      </div>
      <label class="field">
        <span class="label">Lugar (si ya lo tienes)</span>
        <input name="place" [(ngModel)]="place" placeholder="Hacienda, salón, jardín o iglesia" (ngModelChange)="touch()" />
      </label>
      <label class="field">
        <span class="label">Paquete que te interesa</span>
        <select name="pack" [(ngModel)]="pack" (ngModelChange)="touch()">
          <option value="">Aún no sé, quiero que me recomiendes</option>
          @for (p of packages; track p.id) {
            <option [value]="p.group + ' · ' + p.name">{{ p.group }} · {{ p.name }}</option>
          }
        </select>
      </label>
      <label class="field">
        <span class="label">Cuéntame algo más</span>
        <textarea name="note" [(ngModel)]="note" rows="3" maxlength="500" placeholder="¿Cómo te imaginas ese día?" (ngModelChange)="touch()"></textarea>
      </label>
      @if (tried() && !name.trim()) {
        <p class="error" role="alert">Escribe tu nombre para armar el mensaje.</p>
      }

      <div class="preview" aria-label="Vista previa del mensaje">
        <div class="phone-head">
          <span class="avatar" aria-hidden="true">A</span>
          <span class="who"><b>Astor · Fotografía</b><small>suele responder en una hora</small></span>
          <app-icon name="whatsapp" [size]="20" />
        </div>
        <div class="chat">
          <p class="bubble">
            @for (line of lines(); track $index) {
              <span>{{ line }}</span>
            }
            <small class="time">{{ time }} <span class="ticks">✓✓</span></small>
          </p>
        </div>
      </div>

      <button type="submit" class="btn btn-ink send">
        <app-icon name="whatsapp" [size]="18" /> Enviar por WhatsApp
      </button>
      <p class="fine">Se abre WhatsApp con tu mensaje listo; tú decides si lo envías. Respondo de lunes a viernes de 10 a 19 h.</p>
    </form>
  `,
  styles: `
    .form { display: grid; gap: 14px; }
    .row.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .field { display: grid; gap: 6px; }
    .field .label { color: var(--color-muted); font-size: 0.64rem; }
    input, select, textarea { width: 100%; min-height: 50px; padding: 12px 14px; border: 1px solid var(--color-line-2); border-radius: 10px; background: rgb(255 255 255 / 45%); color: var(--color-ink); transition: border-color 200ms ease, background-color 200ms ease; }
    textarea { resize: vertical; min-height: 90px; line-height: 1.5; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--color-ink); background: rgb(255 255 255 / 75%); }
    .error { color: var(--color-danger); font-size: 0.9rem; }

    .preview { margin-top: 10px; border-radius: 18px; overflow: hidden; box-shadow: var(--shadow-paper); background: #ece5dd; }
    .phone-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #1f2c33; color: #e9edef; }
    .avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--color-paper); color: var(--color-ink); font-family: var(--font-display); }
    .who { display: grid; flex: 1; line-height: 1.25; font-size: 0.92rem; }
    .who small { color: #8696a0; font-size: 0.74rem; }
    .chat { padding: 18px 16px 20px; background-color: #e9e2d9; background-image: radial-gradient(rgb(0 0 0 / 4%) 1px, transparent 1px); background-size: 14px 14px; }
    .bubble { position: relative; display: grid; gap: 2px; max-width: 92%; margin-left: auto; padding: 10px 12px 22px; border-radius: 10px 0 10px 10px; background: #d9fdd3; color: #111b21; font-size: 0.92rem; line-height: 1.45; box-shadow: 0 1px 1px rgb(0 0 0 / 10%); white-space: pre-wrap; animation: pop 300ms var(--ease-out); }
    .bubble::after { content: ''; position: absolute; right: -8px; top: 0; border-left: 8px solid #d9fdd3; border-bottom: 10px solid transparent; }
    @keyframes pop { from { opacity: 0.6; } }
    .time { position: absolute; right: 10px; bottom: 5px; font-size: 0.68rem; color: #667781; }
    .ticks { color: #53bdeb; }
    .send { margin-top: 6px; background: var(--color-whatsapp); }
    .fine { font-size: 0.82rem; color: var(--color-muted); }
    @media (max-width: 520px) {
      .row.two { grid-template-columns: 1fr; }
    }
  `,
})
export class ContactForm {
  protected readonly booking = inject(Booking);
  protected readonly events = EVENTS;
  protected readonly guestsList = GUESTS;
  protected readonly packages = PACKAGES;
  protected readonly tried = signal(false);
  protected readonly time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  private readonly version = signal(0);
  protected name = '';
  protected event = EVENTS[0];
  protected guests = GUESTS[1];
  protected place = '';
  protected pack = '';
  protected note = '';

  constructor() {
    // Lo que se eligió en otras páginas (paquete, tipo de evento) llega al formulario.
    effect(() => {
      const p = this.booking.packageName();
      const e = this.booking.eventType();
      if (p) this.pack = p;
      if (e && EVENTS.includes(e)) this.event = e;
      this.touch();
    });
  }

  protected readonly lines = computed(() => {
    this.version();
    const date = this.booking.date();
    const out = [`¡Hola, Emilio! Soy ${this.name.trim() || '…'}.`];
    out.push(`Me interesa fotografía para ${this.event === 'Otro' ? 'un evento' : article(this.event)}${date ? ` el ${longDate(date)}` : ''}.`);
    if (this.place.trim()) out.push(`Será en ${this.place.trim()}, con ${this.guests.toLowerCase()} invitados.`);
    else out.push(`Seremos ${this.guests.toLowerCase()} invitados.`);
    out.push(this.pack ? `Me llamó la atención el paquete ${this.pack}.` : '¿Qué paquete me recomiendas?');
    if (this.note.trim()) out.push(this.note.trim());
    return out;
  });

  protected touch() {
    this.version.update((v) => v + 1);
  }

  protected send() {
    this.tried.set(true);
    if (!this.name.trim()) return;
    const text = this.lines().join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  protected readonly brand = BRAND;
}

function article(event: string) {
  const map: Record<string, string> = {
    Boda: 'mi boda',
    'XV años': 'unos XV años',
    Bautizo: 'un bautizo',
    'Primera comunión': 'una primera comunión',
    Graduación: 'una graduación',
    Aniversario: 'un aniversario',
  };
  return map[event] ?? 'un evento';
}
