import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Foto o nota "pegada con cinta" que se puede despegar y volver a pegar en otro lado.
 * Al agarrarla se levanta (crece, se endereza un poco y la sombra se aleja); se mueve con el dedo o el mouse
 * y al soltarla se asienta con un pequeño golpe. Se mueve con la propiedad `translate`, así no pelea con el
 * `rotate` ni con la posición que ya trae del CSS.
 */
@Directive({
  selector: '[appStick]',
  host: {
    class: 'stick',
    '(pointerdown)': 'down($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'up($event)',
    '(pointercancel)': 'up($event)',
  },
})
export class Stick {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private x = 0;
  private y = 0;
  private drag: { id: number; sx: number; sy: number; ox: number; oy: number } | null = null;

  protected down(e: PointerEvent) {
    if (e.button > 0) return;
    e.preventDefault();
    this.el.setPointerCapture(e.pointerId);
    this.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: this.x, oy: this.y };
    this.el.classList.add('lifted');
    document.documentElement.classList.add('grabbing');
  }

  protected move(e: PointerEvent) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.x = this.drag.ox + e.clientX - this.drag.sx;
    this.y = this.drag.oy + e.clientY - this.drag.sy;
    this.el.style.translate = `${this.x}px ${this.y}px`;
  }

  protected up(e: PointerEvent) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.drag = null;
    this.el.classList.remove('lifted');
    this.el.classList.add('pressed');
    document.documentElement.classList.remove('grabbing');
    setTimeout(() => this.el.classList.remove('pressed'), 260);
  }
}
