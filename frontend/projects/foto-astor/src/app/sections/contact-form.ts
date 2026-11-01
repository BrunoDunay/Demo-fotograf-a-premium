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
    <form class="form" (ngSubmit)="send()" novalidate>
      <span class="under" aria-hidden="true"></span>
      <div class="sheet">
        <header class="f-head">
          <p class="label kicker">Tu mensaje</p>
          <p class="f-title">Cuéntame de <em>tu día</em></p>
        </header>

        <fieldset class="step">
          <legend class="label"><span class="n">01</span> Qué celebras</legend>
          <div class="chips">
            @for (e of events; track e) {
              <label class="chip" [class.on]="event === e">
                <input type="radio" name="event" [value]="e" [(ngModel)]="event" (ngModelChange)="touch()" />
                {{ e }}
              </label>
            }
          </div>
        </fieldset>

        <div class="step two">
          <label class="field">
            <input name="name" [(ngModel)]="name" required autocomplete="name" placeholder=" " (ngModelChange)="touch()" />
            <span class="fl">Tu nombre</span>
            <i class="bar"></i>
          </label>
          <label class="field">
            <input name="date" type="date" [ngModel]="booking.date() ?? ''" (ngModelChange)="booking.date.set($event || null); touch()" />
            <span class="fl up">Fecha</span>
            <i class="bar"></i>
          </label>
        </div>

        <fieldset class="step">
          <legend class="label"><span class="n">02</span> Invitados</legend>
          <div class="seg" role="presentation">
            @for (g of guestsList; track g; let i = $index) {
              <label class="seg-i" [class.on]="guests === g">
                <input type="radio" name="guests" [value]="g" [(ngModel)]="guests" (ngModelChange)="touch()" />
                {{ g }}
              </label>
            }
            <span class="seg-thumb" [style.--i]="guestIndex()" aria-hidden="true"></span>
          </div>
        </fieldset>

        <div class="step">
          <label class="field">
            <input name="place" [(ngModel)]="place" placeholder=" " (ngModelChange)="touch()" />
            <span class="fl">Lugar (si ya lo tienes)</span>
            <i class="bar"></i>
          </label>
        </div>

        <div class="step">
          <label class="field select">
            <select name="pack" [(ngModel)]="pack" (ngModelChange)="touch()">
              <option value="">Aún no sé, quiero que me recomiendes</option>
              @for (p of packages; track p.id) {
                <option [value]="p.group + ' · ' + p.name">{{ p.group }} · {{ p.name }}</option>
              }
            </select>
            <span class="fl up">Paquete que te interesa</span>
            <app-icon class="chev" name="chevron-down" [size]="16" />
            <i class="bar"></i>
          </label>
        </div>

        <div class="step">
          <label class="field">
            <textarea name="note" [(ngModel)]="note" rows="2" maxlength="500" placeholder=" " (ngModelChange)="touch()"></textarea>
            <span class="fl">¿Cómo te imaginas ese día?</span>
            <i class="bar"></i>
          </label>
        </div>
        @if (tried() && !name.trim()) {
          <p class="error" role="alert">Escribe tu nombre para armar el mensaje.</p>
        }
      </div>

      <div class="phone" aria-label="Vista previa del mensaje">
        <div class="screen">
          <div class="phone-head">
            <span class="avatar" aria-hidden="true">A</span>
            <span class="who"><b>Astor · Fotografía</b><small>{{ typing() ? 'escribiendo…' : 'en línea' }}</small></span>
            <app-icon name="whatsapp" [size]="20" />
          </div>
          <div class="chat">
            <p class="bubble">
              @for (line of lines(); track $index) {
                <span>{{ line }}</span>
              }
              <small class="time">{{ time }} <span class="ticks">✓✓</span></small>
            </p>
            @if (typing()) {
              <p class="dots" aria-hidden="true"><i></i><i></i><i></i></p>
            }
          </div>
        </div>
      </div>

      <button type="submit" class="btn send">
        <app-icon name="whatsapp" [size]="18" /> <span class="btn-t">Enviar por WhatsApp</span>
      </button>
      <p class="fine">Se abre WhatsApp con tu mensaje listo; tú decides si lo envías. Respondo de lunes a viernes de 10 a 19 h.</p>
    </form>
  `,
  styles: `
    .form { position: relative; display: grid; gap: 22px; }
    .under { position: absolute; left: 10px; right: -10px; top: 12px; height: 60%; border-radius: 16px; background: var(--color-paper-3); rotate: 1.4deg; z-index: 0; }
    .sheet { position: relative; z-index: 1; display: grid; gap: 22px; padding: clamp(24px, 4vw, 40px); border-radius: 16px; background: var(--color-card); box-shadow: 0 1px 2px rgb(10 16 34 / 10%), 0 30px 60px -30px rgb(10 16 34 / 45%); }
    .f-head { display: grid; gap: 6px; }
    .f-title { font-family: var(--font-display); font-size: clamp(1.9rem, 3.4vw, 2.5rem); line-height: 1; }
    .f-title em { color: var(--color-accent); }
    fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
    legend { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: var(--color-muted); }
    .n { color: var(--color-accent); }
    .step.two { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { position: relative; display: inline-flex; align-items: center; min-height: 40px; padding: 0 16px; border-radius: var(--radius-pill); font-size: 0.9rem; cursor: pointer; box-shadow: inset 0 0 0 1px var(--color-line-2); transition: background-color 300ms ease, color 300ms ease, box-shadow 300ms ease, scale 160ms var(--ease-out); }
    .chip input, .seg-i input { position: absolute; opacity: 0; pointer-events: none; }
    .chip.on { background: var(--color-ink); color: var(--color-paper); box-shadow: none; }
    .chip:active { scale: 0.95; }
    .chip:has(input:focus-visible), .seg-i:has(input:focus-visible) { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    @media (hover: hover) and (pointer: fine) { .chip:not(.on):hover { box-shadow: inset 0 0 0 1px var(--color-ink); } }
    /* Invitados: control segmentado con una pastilla que se desliza. */
    .seg { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); padding: 4px; border-radius: var(--radius-pill); background: var(--color-paper); }
    .seg-i { position: relative; z-index: 1; display: grid; place-items: center; min-height: 40px; padding: 0 6px; font-size: 0.84rem; text-align: center; line-height: 1.15; cursor: pointer; color: var(--color-muted); transition: color 300ms ease; }
    .seg-i.on { color: var(--color-paper); }
    .seg-thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 4); border-radius: var(--radius-pill); background: var(--color-ink); translate: calc(var(--i) * 100%) 0; transition: translate 500ms var(--ease-spring); }
    /* Campos con etiqueta flotante y una línea que se dibuja desde el centro al escribir. */
    .field { position: relative; display: block; padding-top: 16px; }
    input:not([type='radio']), select, textarea { width: 100%; min-height: 44px; padding: 8px 0; border: 0; border-bottom: 1px solid var(--color-line-2); border-radius: 0; background: none; color: var(--color-ink); outline: none; -webkit-appearance: none; appearance: none; }
    textarea { resize: vertical; min-height: 64px; line-height: 1.5; }
    .fl { position: absolute; left: 0; top: 24px; color: var(--color-muted); pointer-events: none; transform-origin: 0 0; transition: translate 300ms var(--ease-out), scale 300ms var(--ease-out), color 300ms ease; }
    .fl.up, .field input:focus ~ .fl, .field input:not(:placeholder-shown) ~ .fl, .field textarea:focus ~ .fl, .field textarea:not(:placeholder-shown) ~ .fl { translate: 0 -22px; scale: 0.78; letter-spacing: 0.04em; }
    .field:focus-within .fl { color: var(--color-accent); }
    .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--color-accent); scale: 0 1; transition: scale 500ms var(--ease-out); }
    .field:focus-within .bar { scale: 1 1; }
    .chev { position: absolute; right: 0; bottom: 14px; pointer-events: none; color: var(--color-muted); }
    select { padding-right: 24px; cursor: pointer; }
    .error { color: var(--color-danger); font-size: 0.9rem; }

    /* Vista previa en un celular. */
    .phone { justify-self: center; width: min(100%, 360px); padding: 10px; border-radius: 38px; background: linear-gradient(145deg, #2a3146, #0b0f1c); box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 12%), 0 40px 70px -34px rgb(10 16 34 / 70%); rotate: -2deg; transition: rotate 600ms var(--ease-out); }
    @media (hover: hover) and (pointer: fine) { .phone:hover { rotate: 0deg; } }
    .screen { position: relative; overflow: hidden; border-radius: 30px; background: #efeae2; }
    .screen::before { content: ''; position: absolute; z-index: 2; left: 50%; top: 8px; width: 90px; height: 22px; margin-left: -45px; border-radius: 12px; background: #0b0f1c; }
    .phone-head { display: flex; align-items: center; gap: 12px; padding: 40px 16px 12px; background: #1f2c33; color: #e9edef; }
    .avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--color-accent); color: #fff; font-family: var(--font-display); font-size: 1.1rem; }
    .who { display: grid; flex: 1; line-height: 1.25; font-size: 0.92rem; }
    .who small { color: #8696a0; font-size: 0.74rem; }
    .chat { display: grid; gap: 8px; min-height: 230px; align-content: start; padding: 18px 14px 22px; background-color: #e9e2d9; background-image: radial-gradient(rgb(0 0 0 / 4%) 1px, transparent 1px); background-size: 14px 14px; }
    .bubble { position: relative; display: grid; gap: 2px; max-width: 94%; margin-left: auto; padding: 10px 12px 22px; border-radius: 10px 0 10px 10px; background: #d9fdd3; color: #111b21; font-size: 0.88rem; line-height: 1.45; box-shadow: 0 1px 1px rgb(0 0 0 / 10%); white-space: pre-wrap; }
    .bubble::after { content: ''; position: absolute; right: -8px; top: 0; border-left: 8px solid #d9fdd3; border-bottom: 10px solid transparent; }
    .time { position: absolute; right: 10px; bottom: 5px; font-size: 0.68rem; color: #667781; }
    .ticks { color: #53bdeb; }
    .dots { display: inline-flex; gap: 4px; justify-self: start; padding: 10px 14px; border-radius: 0 10px 10px 10px; background: #fff; }
    .dots i { width: 6px; height: 6px; border-radius: 50%; background: #8696a0; animation: blink 1s infinite; }
    .dots i:nth-child(2) { animation-delay: 150ms; }
    .dots i:nth-child(3) { animation-delay: 300ms; }
    @keyframes blink { 0%, 60%, 100% { opacity: 0.3; translate: 0 0; } 30% { opacity: 1; translate: 0 -3px; } }
    .send { justify-self: stretch; --fill: var(--color-ink); background: var(--color-whatsapp); color: #fff; }
    .fine { font-size: 0.82rem; color: var(--color-muted); text-align: center; }
    @media (max-width: 520px) {
      .step.two { grid-template-columns: 1fr; }
      .seg { grid-template-columns: repeat(2, 1fr); border-radius: 18px; }
      .seg-thumb { display: none; }
      .seg-i.on { background: var(--color-ink); border-radius: var(--radius-pill); }
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

  protected readonly typing = signal(false);
  protected readonly guestIndex = signal(1);
  private typingTimer?: ReturnType<typeof setTimeout>;

  protected touch() {
    this.version.update((v) => v + 1);
    this.guestIndex.set(Math.max(0, GUESTS.indexOf(this.guests)));
    // "escribiendo…" mientras se llena el formulario.
    this.typing.set(true);
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.typing.set(false), 900);
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
