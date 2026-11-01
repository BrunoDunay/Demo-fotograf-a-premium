import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { captionFor } from '../core/content';
import { EVENT_PHOTOS, PhotoData, photoSrc, shuffle } from '../core/media';
import { Motion, hasFinePointer, prefersReducedMotion, useGsap } from '../core/motion';
import { Celestial } from '../shared/celestial';
import { Icon } from '../shared/icon';

interface PileCard {
  id: number;
  photo: PhotoData;
  who: string;
  where: string;
  /** Posición inicial en porcentaje (para el HTML prerenderizado). */
  px: number;
  py: number;
  pr: number;
}

/** Estado físico de cada tarjeta (fuera de las señales: se escribe directo al DOM en cada cuadro). */
interface Body {
  id: number;
  el: HTMLElement;
  x: number;
  y: number;
  r: number;
  s: number;
  lift: number;
  o: number;
  vx: number;
  vy: number;
  vr: number;
  tilt: number;
  mode: 'drop' | 'rest' | 'drag' | 'glide' | 'fly' | 'open';
  z: number;
}

const MAX_WIDE = 14;
const MAX_NARROW = 9;
const REFILL_AT = 3;

let nextId = 1;
function makeCards(photos: PhotoData[], layout: (i: number) => { px: number; py: number; pr: number }): PileCard[] {
  return photos.map((p, i) => {
    const id = nextId++;
    const cap = captionFor(p.name, p.cat, id);
    return { id, photo: p, who: cap.who, where: cap.where, ...layout(i) };
  });
}

/** Acomodo inicial repetible (servidor y navegador iguales): un montón desordenado a la derecha. */
function seededLayout(i: number) {
  const a = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  const b = Math.sin(i * 78.233 + 1.7) * 12543.123;
  const c = Math.sin(i * 39.425 + 7.3) * 24634.634;
  const f = (n: number) => n - Math.floor(n);
  return { px: 50 + (f(a) - 0.5) * 34, py: 50 + (f(b) - 0.5) * 40, pr: (f(c) - 0.5) * 34 };
}

/**
 * Portada: una mesa con un montón de copias impresas (de cuarto oscuro). Se arrastran (mantener presionado o mover),
 * se lanzan fuera de la mesa si se sueltan con fuerza y, con un toque corto, la foto "se acerca" a la cámara
 * en 3D. Al quedarse sin fotos aparece "Soltar más fotos": caen nuevas al azar hasta el límite de la mesa.
 */
@Component({
  selector: 'app-photo-pile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Celestial],
  templateUrl: './photo-pile.html',
  styleUrl: './photo-pile.css',
})
export class PhotoPile {
  protected readonly cards = signal<PileCard[]>(makeCards(shuffle(EVENT_PHOTOS, 11).slice(0, MAX_WIDE), seededLayout));
  protected readonly count = computed(() => this.cards().length);
  protected readonly empty = signal(false);
  protected readonly refillAt = signal<{ x: number; y: number } | null>(null);
  protected readonly dropping = signal(false);
  protected readonly touched = signal(false);
  protected readonly zoomed = signal<PileCard | null>(null);
  protected readonly zoomClosing = signal(false);
  protected readonly zoomLoaded = signal(false);
  protected readonly total = EVENT_PHOTOS.length;
  protected readonly photoSrc = photoSrc;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(Motion);
  private readonly bodies = new Map<number, Body>();
  private table!: HTMLElement;
  private W = 0;
  private H = 0;
  private cw = 240;
  private ch = 290;
  private zTop = 10;
  private raf = 0;
  private last = 0;
  private max = MAX_WIDE;
  private seen = new Set<string>();
  private press: {
    id: number;
    pointerId: number;
    sx: number;
    sy: number;
    t0: number;
    ox: number;
    oy: number;
    moved: boolean;
    grabbed: boolean;
    samples: { x: number; y: number; t: number }[];
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  private zoomTl?: gsap.core.Timeline;
  private openedAt = 0;
  private started = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.table = this.host.querySelector<HTMLElement>('.table')!;
      this.measure();
      this.max = innerWidth < 760 ? MAX_NARROW : MAX_WIDE;
      // En pantallas chicas caben menos fotos: se quitan las que sobran antes de que se vean.
      if (this.cards().length > this.max) this.cards.update((c) => c.slice(0, this.max));
      this.cards().forEach((c) => this.seen.add(c.photo.name));

      const ro = new ResizeObserver(() => this.measure());
      ro.observe(this.table);
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && this.zoomed() && this.closeZoom();
      addEventListener('keydown', onKey);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        removeEventListener('keydown', onKey);
        cancelAnimationFrame(this.raf);
        this.zoomTl?.kill();
      });
    });

    // Las fotos caen cuando termina la intro del logo.
    effect(() => {
      if (!this.motion.introDone() || this.started) return;
      this.started = true;
      untracked(() => requestAnimationFrame(() => this.dropIn(this.cards(), true)));
    });
  }

  // ===== Medidas =====
  private measure() {
    const r = this.table.getBoundingClientRect();
    this.W = r.width;
    this.H = r.height;
    const narrow = this.W < 760;
    this.cw = narrow ? Math.min(178, this.W * 0.44) : Math.max(200, Math.min(280, this.W * 0.17));
    this.ch = this.cw * 1.2;
    this.table.style.setProperty('--cw', `${this.cw}px`);
  }

  /** Centro del montón: a la derecha en escritorio; en celular, en el espacio libre debajo del texto. */
  private pileCenter() {
    if (this.W >= 760) return { x: this.W * 0.68, y: this.H * 0.55, sx: this.W * 0.15, sy: this.H * 0.2 };
    const copy = this.host.querySelector<HTMLElement>('.copy');
    const top = copy ? copy.offsetTop + copy.offsetHeight : this.H * 0.5;
    const free = Math.max(this.ch, this.H - top - 56);
    return { x: this.W * 0.5, y: top + free / 2, sx: this.W * 0.24, sy: Math.max(10, (free - this.ch) / 2) * 0.85 };
  }

  // ===== Caída =====
  /**
   * Como cuando alguien suelta un bonche de fotos sobre la mesa: caen juntas, casi alineadas, con gravedad;
   * al tocar la mesa se abren en abanico (las de arriba resbalan más lejos) y frenan con fricción.
   */
  private dropIn(cards: PileCard[], first = false) {
    const { gsap } = useGsap();
    const reduced = prefersReducedMotion();
    const c = this.pileCenter();
    this.dropping.set(true);
    const n = cards.length;
    const baseR = (Math.random() - 0.5) * 24;
    // El bonche cae un poco fuera del centro del montón.
    const hx = c.x + (Math.random() - 0.5) * c.sx * 0.5;
    const hy = c.y + (Math.random() - 0.5) * c.sy * 0.5;
    const start = first ? 0.25 : 0.05;
    const fall = 0.46;
    cards.forEach((card, i) => {
      const el = this.table.querySelector<HTMLElement>(`[data-id="${card.id}"]`);
      if (!el) return;
      const up = n > 1 ? i / (n - 1) : 0; // 0 = la de hasta abajo, 1 = la de hasta arriba
      // A dónde resbala: alrededor del punto de caída, más lejos las de arriba.
      const ang = Math.random() * Math.PI * 2;
      const reach = 0.25 + up * 0.75;
      const gx = Math.cos(ang) * c.sx * reach * (0.6 + Math.random() * 0.5);
      const gy = Math.sin(ang) * c.sy * reach * (0.6 + Math.random() * 0.5);
      const tx = Math.max(this.cw * 0.4, Math.min(this.W - this.cw * 0.4, hx + gx));
      const ty = Math.max(this.ch * 0.4, Math.min(this.H - this.ch * 0.4, hy + gy));
      const tr = baseR + (Math.random() - 0.5) * (14 + up * 46);
      const b: Body = {
        id: card.id,
        el,
        x: hx + (Math.random() - 0.5) * 14,
        y: hy - 30 + (Math.random() - 0.5) * 14,
        r: baseR + (Math.random() - 0.5) * 7,
        s: 1.5 + up * 0.06,
        lift: 1.6,
        o: 0,
        vx: 0,
        vy: 0,
        vr: 0,
        tilt: 0,
        mode: 'drop',
        z: ++this.zTop,
      };
      el.classList.add('live');
      this.bodies.set(card.id, b);
      this.render(b);
      if (reduced) {
        Object.assign(b, { x: tx, y: ty, r: tr, s: 1, lift: 0, o: 1, mode: 'rest' });
        this.render(b);
        return;
      }
      // Las de abajo tocan la mesa una fracción antes que las de arriba.
      const t0 = start + i * 0.016;
      const slide = 0.55 + up * 0.5 + Math.random() * 0.15;
      const tl = gsap.timeline({ delay: t0, onUpdate: () => this.render(b), onComplete: () => void (b.mode === 'drop' && (b.mode = 'rest')) });
      tl.to(b, { o: 1, duration: 0.12, ease: 'none' }, 0)
        .to(b, { s: 1, lift: 0.12, y: hy + (b.y - hy + 30) * 0.4, duration: fall, ease: 'power2.in' }, 0)
        // Golpe contra la mesa.
        .to(b, { s: 0.985, duration: 0.06, ease: 'power1.out' }, fall)
        .to(b, { s: 1, duration: 0.18, ease: 'power2.out' }, fall + 0.06)
        // Resbalan y frenan.
        .to(b, { x: tx, y: ty, duration: slide, ease: 'power3.out' }, fall)
        .to(b, { r: tr, duration: slide * 1.1, ease: 'power3.out' }, fall)
        .to(b, { lift: 0, duration: 0.3, ease: 'power2.out' }, fall);
      (b as Body & { tl?: gsap.core.Timeline }).tl = tl;
    });
    setTimeout(() => this.dropping.set(false), (start + fall + 1.1) * 1000);
  }

  protected dropMore() {
    if (this.dropping()) return;
    const need = this.max - this.cards().length;
    if (need <= 0) return;
    const onTable = new Set(this.cards().map((c) => c.photo.name));
    let pool = EVENT_PHOTOS.filter((p) => !onTable.has(p.name) && !this.seen.has(p.name));
    // Cuando ya se vio todo el archivo, se vuelve a barajar completo.
    if (pool.length < need) {
      this.seen.clear();
      pool = EVENT_PHOTOS.filter((p) => !onTable.has(p.name));
    }
    const fresh = makeCards(shuffle(pool).slice(0, need), () => ({ px: 50, py: 50, pr: 0 }));
    fresh.forEach((c) => this.seen.add(c.photo.name));
    this.empty.set(false);
    this.cards.update((list) => [...list, ...fresh]);
    requestAnimationFrame(() => requestAnimationFrame(() => this.dropIn(fresh)));
  }

  // ===== Dibujo =====
  private render(b: Body) {
    const el = b.el;
    el.style.transform = `translate3d(${(b.x - this.cw / 2).toFixed(1)}px, ${(b.y - this.ch / 2).toFixed(1)}px, 0) rotate(${(b.r + b.tilt).toFixed(2)}deg) scale(${b.s.toFixed(4)})`;
    el.style.setProperty('--lift', b.lift.toFixed(3));
    el.style.opacity = String(b.o);
    el.style.zIndex = String(b.z);
  }

  private loop = (now: number) => {
    const dt = Math.min(34, now - (this.last || now));
    this.last = now;
    let active = false;
    for (const b of this.bodies.values()) {
      if (b.mode === 'drag') {
        active = true;
        b.lift += (1 - b.lift) * Math.min(1, dt * 0.018);
        b.s += (1.06 - b.s) * Math.min(1, dt * 0.018);
        b.tilt += (Math.max(-14, Math.min(14, b.vx * 9)) - b.tilt) * Math.min(1, dt * 0.012);
        this.render(b);
      } else if (b.mode === 'glide') {
        active = true;
        const f = Math.pow(0.9915, dt);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.r += b.vr * dt;
        b.vx *= f;
        b.vy *= f;
        b.vr *= f;
        b.tilt *= Math.pow(0.99, dt);
        b.lift += (0 - b.lift) * Math.min(1, dt * 0.012);
        b.s += (1 - b.s) * Math.min(1, dt * 0.012);
        // Rebote suave con los bordes de la mesa.
        const mx = this.cw * 0.25;
        const my = this.ch * 0.25;
        if (b.x < mx || b.x > this.W - mx) {
          b.x = Math.max(mx, Math.min(this.W - mx, b.x));
          b.vx *= -0.35;
        }
        if (b.y < my || b.y > this.H - my) {
          b.y = Math.max(my, Math.min(this.H - my, b.y));
          b.vy *= -0.35;
        }
        this.render(b);
        if (Math.hypot(b.vx, b.vy) < 0.004 && b.lift < 0.01 && Math.abs(b.tilt) < 0.05) {
          b.r += b.tilt;
          b.tilt = 0;
          b.mode = 'rest';
        }
      } else if (b.mode === 'fly') {
        active = true;
        const f = Math.pow(0.9992, dt);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.r += b.vr * dt;
        b.vx *= f;
        b.vy *= f;
        b.lift += (0.7 - b.lift) * Math.min(1, dt * 0.01);
        this.render(b);
        const out = this.cw * 1.2;
        if (b.x < -out || b.x > this.W + out || b.y < -out || b.y > this.H + out) this.remove(b);
      }
    }
    this.raf = active ? requestAnimationFrame(this.loop) : 0;
    if (!active) this.last = 0;
  };

  private kick() {
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  private remove(b: Body) {
    this.bodies.delete(b.id);
    this.cards.update((list) => list.filter((c) => c.id !== b.id));
    if (this.cards().length <= REFILL_AT) {
      const c = this.pileCenter();
      this.refillAt.set({ x: c.x, y: c.y });
      this.empty.set(true);
    }
  }

  // ===== Puntero =====
  protected onDown(e: PointerEvent, card: PileCard) {
    const b = this.bodies.get(card.id);
    if (!b || b.mode === 'open' || e.button > 0) return;
    e.preventDefault();
    // Mientras se arrastra no se selecciona texto de la portada.
    document.documentElement.classList.add('grabbing');
    getSelection()?.removeAllRanges();
    (b as Body & { tl?: gsap.core.Timeline }).tl?.kill();
    b.o = 1;
    b.el.setPointerCapture(e.pointerId);
    const p = this.local(e);
    b.z = ++this.zTop;
    b.mode = 'rest';
    b.vx = b.vy = b.vr = 0;
    this.render(b);
    const press = {
      id: b.id,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      t0: performance.now(),
      ox: p.x - b.x,
      oy: p.y - b.y,
      moved: false,
      grabbed: false,
      samples: [{ ...p, t: performance.now() }],
      // Mantener presionado sin mover también "levanta" la foto.
      timer: setTimeout(() => {
        if (this.press === press && !press.moved) this.grab(b, press);
      }, 170),
    };
    this.press = press;
    this.touched.set(true);
  }

  private grab(b: Body, press: NonNullable<typeof this.press>) {
    press.grabbed = true;
    b.mode = 'drag';
    b.el.classList.add('held');
    this.kick();
  }

  protected onMove(e: PointerEvent) {
    const press = this.press;
    if (!press || e.pointerId !== press.pointerId) return;
    const b = this.bodies.get(press.id);
    if (!b) return;
    if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) > 6) {
      press.moved = true;
      if (!press.grabbed) this.grab(b, press);
    }
    if (!press.moved) return;
    const p = this.local(e);
    const now = performance.now();
    press.samples.push({ ...p, t: now });
    while (press.samples.length > 2 && now - press.samples[0].t > 110) press.samples.shift();
    const first = press.samples[0];
    const span = Math.max(1, now - first.t);
    b.vx = (p.x - first.x) / span;
    b.vy = (p.y - first.y) / span;
    b.x = p.x - press.ox;
    b.y = p.y - press.oy;
  }

  protected onUp(e: PointerEvent) {
    const press = this.press;
    if (!press || e.pointerId !== press.pointerId) return;
    clearTimeout(press.timer);
    this.press = null;
    document.documentElement.classList.remove('grabbing');
    const b = this.bodies.get(press.id);
    if (!b) return;
    b.el.classList.remove('held');
    const quick = performance.now() - press.t0 < 260;
    if (!press.moved && !press.grabbed && quick) {
      this.openZoom(b);
      return;
    }
    // Si la foto se sostuvo quieta antes de soltarla, no lleva impulso.
    const lastMove = press.samples[press.samples.length - 1]?.t ?? 0;
    if (performance.now() - lastMove > 90) b.vx = b.vy = 0;
    const speed = Math.hypot(b.vx, b.vy);
    const fling = e.pointerType === 'mouse' ? 1.15 : 0.7;
    if (speed > fling) {
      // Lanzada: sigue de largo con giro y sale de la mesa.
      b.mode = 'fly';
      b.vx *= 1.15;
      b.vy *= 1.15;
      b.vr = Math.max(-0.9, Math.min(0.9, (b.vx - b.vy * 0.3) * 0.22));
    } else {
      b.mode = 'glide';
      b.vr = b.vx * 0.04;
    }
    this.kick();
  }

  protected onKey(e: KeyboardEvent, card: PileCard) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const b = this.bodies.get(card.id);
    if (b) this.openZoom(b);
  }

  private local(e: PointerEvent) {
    const r = this.table.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // ===== Ver de cerca =====
  private openZoom(b: Body) {
    const card = this.cards().find((c) => c.id === b.id);
    if (!card || this.zoomed()) return;
    b.mode = 'open';
    this.openedAt = performance.now();
    this.zoomLoaded.set(false);
    this.zoomed.set(card);
    this.motion.lock();
    requestAnimationFrame(() => {
      const { gsap } = useGsap();
      const zoom = this.host.querySelector<HTMLElement>('.zoom-card');
      const shade = this.host.querySelector<HTMLElement>('.zoom-shade');
      const info = this.host.querySelectorAll<HTMLElement>('.zoom-info > *');
      if (!zoom || !shade) return;
      const tr = this.table.getBoundingClientRect();
      const zr = zoom.getBoundingClientRect();
      // Desde dónde parte: el centro y el giro de la foto en la mesa.
      const dx = tr.left + b.x - (zr.left + zr.width / 2);
      const dy = tr.top + b.y - (zr.top + zr.height / 2);
      const scale = (this.cw * b.s) / zr.width;
      b.el.style.visibility = 'hidden';
      const reduced = prefersReducedMotion();
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      gsap.set(zoom, { x: dx, y: dy, scale, rotation: b.r + b.tilt, rotationX: 0, rotationY: 0, transformPerspective: 1400 });
      gsap.set(zoom, { '--lift': 0.2 });
      tl.to(shade, { opacity: 1, duration: reduced ? 0.01 : 0.8, ease: 'power2.out' }, 0)
        // 1) se levanta de la mesa
        .to(zoom, { scale: scale * 1.06, '--lift': 1, duration: reduced ? 0.01 : 0.2, ease: 'power2.out' }, 0)
        // 2) viaja hacia ti: se endereza, crece y se inclina como cuando acercas una foto a la cara
        .to(zoom, { x: 0, rotation: 0, scale: 1, duration: reduced ? 0.01 : 0.95, ease: 'power3.inOut' }, 0.1)
        .to(zoom, { y: 0, duration: reduced ? 0.01 : 0.95, ease: 'power2.inOut' }, 0.1)
        .to(zoom, { rotationX: 14, rotationY: -6, duration: reduced ? 0.01 : 0.5, ease: 'sine.inOut' }, 0.12)
        .to(zoom, { rotationX: 0, rotationY: 0, duration: reduced ? 0.01 : 0.6, ease: 'sine.out' }, 0.62)
        .fromTo(info, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, reduced ? 0 : 0.85);
      this.zoomTl = tl;
    });
  }

  protected closeZoom() {
    const card = this.zoomed();
    // El clic que el navegador manda justo después del toque no debe cerrar la foto recién abierta.
    if (!card || this.zoomClosing() || !this.zoomTl || performance.now() - this.openedAt < 500) return;
    const b = this.bodies.get(card.id);
    this.zoomClosing.set(true);
    // La salida es más rápida que la entrada.
    this.zoomTl.timeScale(1.6).reverse();
    this.zoomTl.eventCallback('onReverseComplete', () => {
      if (b) {
        b.el.style.visibility = '';
        b.mode = 'rest';
        b.z = ++this.zTop;
        this.render(b);
      }
      this.zoomed.set(null);
      this.zoomClosing.set(false);
      this.motion.unlock();
    });
  }

  /** La foto abierta se inclina un poco hacia el cursor (se siente como tenerla en la mano). */
  protected zoomTilt(e: PointerEvent) {
    if (!hasFinePointer() || this.zoomClosing() || !this.zoomTl || this.zoomTl.isActive()) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    const { gsap } = useGsap();
    gsap.to(el, { rotationY: nx * 8, rotationX: -ny * 8, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
  }

  protected zoomRelease(e: PointerEvent) {
    if (!this.zoomTl || this.zoomTl.isActive()) return;
    useGsap().gsap.to(e.currentTarget as HTMLElement, { rotationY: 0, rotationX: 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
  }

  // Deslizar hacia abajo en celular devuelve la foto a la mesa.
  private swipeY: number | null = null;
  protected zoomDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse') this.swipeY = e.clientY;
  }
  protected zoomUp(e: PointerEvent) {
    if (this.swipeY !== null && e.clientY - this.swipeY > 80) this.closeZoom();
    this.swipeY = null;
  }
}
