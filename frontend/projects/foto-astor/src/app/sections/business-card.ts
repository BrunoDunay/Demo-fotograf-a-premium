import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { BRAND } from '../core/content';
import { hasFinePointer, prefersReducedMotion } from '../core/motion';
import { Icon } from '../shared/icon';

/** Colores de la tarjeta: papel, tinta, foil y canto pintado. La primera (Medianoche) es la de inicio. */
const VARIANTS = [
  { id: 'medianoche', label: 'Medianoche', paper: '#121a2e', ink: '#e4e7ee', foil: '#e6b0a8', edge: '#e6b0a8' },
  { id: 'porcelana', label: 'Porcelana', paper: '#f3f2ee', ink: '#141b2d', foil: '#c9ccd3', edge: '#a4514f' },
  { id: 'rosa', label: 'Palo de rosa', paper: '#e6c7c1', ink: '#3b2228', foil: '#f1e6d6', edge: '#3b2228' },
  { id: 'carbon', label: 'Carbón', paper: '#222326', ink: '#d9d5cd', foil: '#d6b27a', edge: '#d6b27a' },
] as const;
type Variant = (typeof VARIANTS)[number];

// Tarjeta estándar 3.5 × 2 pulgadas: proporción 1.75, cartulina gruesa.
const CW = 1.75;
const CH = 1;
const DEPTH = 0.016;
const TW = 2048;
const TH = Math.round(TW / 1.75);

/**
 * Tarjeta de presentación en 3D (Three.js): cartulina rectangular con esquinas en punta, letras hundidas
 * (letterpress), foil metálico que refleja la luz de verdad según el ángulo y canto pintado.
 * Se gira libre arrastrándola (con inercia), se voltea con el botón o doble toque y, quieta, se acomoda en la
 * cara más cercana. Se puede cambiar el color del papel.
 */
@Component({
  selector: 'app-business-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="scene"
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up($event)"
      (pointercancel)="up($event)"
      (pointerleave)="leave()"
      (dblclick)="flip()"
      role="img"
      [attr.aria-label]="'Tarjeta de presentación de ' + brand.person + ', color ' + variant().label + '. Arrástrala para girarla.'"
    >
      <canvas></canvas>
      <span class="ground"></span>
    </div>
    <div class="swatches" role="radiogroup" aria-label="Color de la tarjeta">
      @for (v of variants; track v.id) {
        <button type="button" class="sw" role="radio" [attr.aria-checked]="variant().id === v.id" [attr.aria-label]="v.label" (click)="setVariant(v)">
          <span class="dot" [style.background]="v.paper" [style.--foil]="v.foil"></span>
          <span class="sw-label">{{ v.label }}</span>
        </button>
      }
    </div>
    <div class="controls">
      <button type="button" class="btn btn-line" (click)="flip()"><app-icon name="flip" [size]="16" /> <span class="btn-t">Voltear</span></button>
      <p class="label hint"><app-icon name="drag" [size]="15" /> Arrástrala para verla de lado</p>
    </div>
  `,
  styles: `
    :host { display: grid; justify-items: center; gap: 18px; }
    .scene { position: relative; width: min(460px, 90vw); aspect-ratio: 1.3; cursor: grab; touch-action: pan-y; -webkit-user-select: none; user-select: none; }
    .scene:active { cursor: grabbing; }
    canvas { position: relative; z-index: 1; width: 100%; height: 100%; }
    .ground { position: absolute; left: 20%; right: 20%; bottom: 8%; height: 26px; border-radius: 50%; background: radial-gradient(closest-side, rgb(10 16 34 / 34%), transparent); filter: blur(6px); will-change: transform; }
    .swatches { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
    .sw { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px 0 6px; border-radius: var(--radius-pill); font-size: 0.82rem; color: var(--color-muted); transition: background-color 250ms ease, color 250ms ease; }
    .sw[aria-checked='true'] { background: var(--color-card); color: var(--color-ink); box-shadow: var(--shadow-paper); }
    .dot { position: relative; width: 26px; height: 26px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 14%); overflow: hidden; transition: scale 400ms var(--ease-spring); }
    .dot::after { content: ''; position: absolute; right: 4px; top: 4px; width: 7px; height: 7px; border-radius: 50%; background: var(--foil); }
    .sw[aria-checked='true'] .dot { scale: 1.12; }
    @media (hover: hover) and (pointer: fine) { .sw:hover { color: var(--color-ink); } .sw:hover .dot { scale: 1.12; } }
    .controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 20px; }
    .controls .btn { min-height: 44px; padding: 0 18px; font-size: 0.68rem; }
    .hint { display: inline-flex; align-items: center; gap: 8px; color: var(--color-muted); }
  `,
})
export class BusinessCard {
  protected readonly brand = BRAND;
  protected readonly variants = VARIANTS;
  protected readonly variant = signal<Variant>(VARIANTS[0]);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private ry = -22;
  private rx = 10;
  private vy = 0;
  private vx = 0;
  private hoverX = 0;
  private hoverY = 0;
  private drag: { x: number; y: number; t: number; id: number } | null = null;
  private lastInput = 0;
  private flipTo: number | null = null;
  private repaint?: (v: Variant) => void;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      const THREE = await import('three');
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
      await Promise.all(
        ['400 100px "Instrument Serif"', 'italic 400 100px "Instrument Serif"', '500 40px "Instrument Sans Variable"', '400 40px "Hanken Grotesk Variable"'].map((f) =>
          document.fonts.load(f).catch(() => null),
        ),
      );
      const scene = this.host.querySelector<HTMLElement>('.scene')!;
      const canvas = scene.querySelector('canvas')!;
      const ground = scene.querySelector<HTMLElement>('.ground')!;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      const s = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      s.environment = env;
      s.environmentIntensity = 0.45;
      const camera = new THREE.PerspectiveCamera(28, 1.3, 0.1, 20);
      camera.position.set(0, 0, 3.55);
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(-2, 3, 4);
      s.add(key);
      s.add(new THREE.AmbientLight(0xffffff, 0.25));

      const aniso = renderer.capabilities.getMaxAnisotropy();
      const tex = (c: HTMLCanvasElement, color = false) => {
        const t = new THREE.CanvasTexture(c);
        t.anisotropy = aniso;
        if (color) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };
      const faceMat = () =>
        new THREE.MeshStandardMaterial({ roughness: 1, metalness: 1, bumpScale: 1.4 });
      const front = faceMat();
      const back = faceMat();
      const edge = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0 });
      const card = new THREE.Mesh(new THREE.BoxGeometry(CW, CH, DEPTH), [edge, edge, edge, edge, front, back]);
      s.add(card);

      const apply = (mat: InstanceType<typeof THREE.MeshStandardMaterial>, f: FaceCanvases) => {
        mat.map?.dispose();
        mat.bumpMap?.dispose();
        mat.roughnessMap?.dispose();
        mat.metalnessMap?.dispose();
        mat.map = tex(f.map, true);
        mat.bumpMap = tex(f.bump);
        mat.roughnessMap = tex(f.rough);
        mat.metalnessMap = tex(f.metal);
        mat.needsUpdate = true;
      };
      this.repaint = (v: Variant) => {
        apply(front, drawFace(v, 'front'));
        apply(back, drawFace(v, 'back'));
        edge.color.set(v.edge);
      };
      this.repaint(this.variant());

      const resize = () => {
        const r = scene.getBoundingClientRect();
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(scene);

      const reduced = prefersReducedMotion();
      let raf = 0;
      let prev = performance.now();
      let t = 0;
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(this.host);
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.033, (now - prev) / 1000);
        prev = now;
        if (!visible) return;
        t += dt;
        if (!this.drag) {
          this.ry += this.vy * dt;
          this.rx += this.vx * dt;
          this.vy *= Math.pow(0.12, dt);
          this.vx *= Math.pow(0.12, dt);
          const idle = now - this.lastInput > 1400 && Math.abs(this.vy) < 20;
          if (this.flipTo !== null) {
            this.ry += (this.flipTo - this.ry) * Math.min(1, dt * 6);
            this.rx += (0 - this.rx) * Math.min(1, dt * 6);
            if (Math.abs(this.flipTo - this.ry) < 0.3) this.flipTo = null;
          } else if (idle) {
            // Quieta, se acomoda en la cara más cercana y se mece despacio con el cursor.
            const face = Math.round(this.ry / 180) * 180;
            const sway = reduced ? 0 : Math.sin(t * 0.6) * 12 + this.hoverX * 18;
            const tilt = reduced ? 0 : Math.cos(t * 0.45) * 6 + this.hoverY * 12;
            this.ry += (face + sway - this.ry) * Math.min(1, dt * 2.2);
            this.rx += (tilt - this.rx) * Math.min(1, dt * 2.2);
          }
        }
        this.rx = Math.max(-70, Math.min(70, this.rx));
        card.rotation.set((this.rx * Math.PI) / 180, (this.ry * Math.PI) / 180, 0, 'YXZ');
        // La luz sigue un poco al cursor para que el foil destelle al mover la mano.
        key.position.set(-2 + this.hoverX * 2.5, 3 - this.hoverY * 2, 4);
        renderer.render(s, camera);
        const c = Math.abs(Math.cos((this.ry * Math.PI) / 180));
        ground.style.transform = `scaleX(${(0.3 + c * 0.7).toFixed(3)}) translateY(${(this.rx * 0.2).toFixed(1)}px)`;
      };
      raf = requestAnimationFrame(tick);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        for (const m of [front, back]) {
          m.map?.dispose();
          m.bumpMap?.dispose();
          m.roughnessMap?.dispose();
          m.metalnessMap?.dispose();
          m.dispose();
        }
        edge.dispose();
        card.geometry.dispose();
        env.dispose();
        pmrem.dispose();
        renderer.dispose();
      });
    });
  }

  protected setVariant(v: Variant) {
    this.variant.set(v);
    this.repaint?.(v);
    // Un medio giro para lucir el cambio.
    if (!prefersReducedMotion()) {
      this.vy = 260;
      this.lastInput = performance.now() - 600;
    }
  }

  protected down(e: PointerEvent) {
    if (e.button > 0) return;
    this.drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    this.flipTo = null;
    this.vx = this.vy = 0;
    this.lastInput = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  protected move(e: PointerEvent) {
    const now = performance.now();
    if (this.drag && e.pointerId === this.drag.id) {
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      const dt = Math.max(1, now - this.drag.t) / 1000;
      this.ry += dx * 0.5;
      this.rx += dy * 0.4;
      this.vy = (dx * 0.5) / dt;
      this.vx = (dy * 0.4) / dt;
      this.drag = { ...this.drag, x: e.clientX, y: e.clientY, t: now };
      this.lastInput = now;
      return;
    }
    if (!hasFinePointer()) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoverX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    this.hoverY = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }

  protected up(e: PointerEvent) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.drag = null;
    this.lastInput = performance.now();
    this.vy = Math.max(-900, Math.min(900, this.vy));
    this.vx = Math.max(-500, Math.min(500, this.vx));
  }

  protected leave() {
    this.hoverX = this.hoverY = 0;
  }

  flip() {
    const face = Math.round(this.ry / 180) * 180;
    this.flipTo = face + 180;
    this.vx = this.vy = 0;
    this.lastInput = performance.now();
  }
}

interface FaceCanvases {
  map: HTMLCanvasElement;
  bump: HTMLCanvasElement;
  rough: HTMLCanvasElement;
  metal: HTMLCanvasElement;
}

/**
 * Dibuja una cara en cuatro capas: color, relieve (bump), aspereza y metal.
 * - tinta (letterpress): color de tinta y hundida en el relieve;
 * - foil: color del foil, metálica, lisa y apenas levantada;
 * - golpe en seco: solo relieve, sin tinta.
 */
function drawFace(v: Variant, side: 'front' | 'back'): FaceCanvases {
  const make = () => {
    const c = document.createElement('canvas');
    c.width = TW;
    c.height = TH;
    return c;
  };
  const f: FaceCanvases = { map: make(), bump: make(), rough: make(), metal: make() };
  const map = f.map.getContext('2d')!;
  const bump = f.bump.getContext('2d')!;
  const rough = f.rough.getContext('2d')!;
  const metal = f.metal.getContext('2d')!;

  // Papel: color con fibras finas, relieve de algodón, mate.
  map.fillStyle = v.paper;
  map.fillRect(0, 0, TW, TH);
  bump.fillStyle = '#808080';
  bump.fillRect(0, 0, TW, TH);
  rough.fillStyle = 'rgb(225,225,225)';
  rough.fillRect(0, 0, TW, TH);
  metal.fillStyle = '#000';
  metal.fillRect(0, 0, TW, TH);
  const dark = luminance(v.paper) < 0.4;
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * TW;
    const y = Math.random() * TH;
    const r = Math.random() * 2.2 + 0.4;
    map.fillStyle = dark ? `rgba(255,255,255,${Math.random() * 0.035})` : `rgba(60,50,40,${Math.random() * 0.05})`;
    map.fillRect(x, y, r * 3, r * 0.6);
    const g = 128 + (Math.random() - 0.5) * 30;
    bump.fillStyle = `rgb(${g},${g},${g})`;
    bump.fillRect(x, y, r * 2, r);
  }

  const ink = (draw: (c: CanvasRenderingContext2D) => void, alpha = 1) => {
    map.save();
    map.globalAlpha = alpha;
    map.fillStyle = map.strokeStyle = v.ink;
    draw(map);
    map.restore();
    bump.save();
    bump.filter = 'blur(2px)';
    bump.fillStyle = bump.strokeStyle = '#4a4a4a';
    draw(bump);
    bump.restore();
  };
  const foil = (draw: (c: CanvasRenderingContext2D) => void) => {
    map.save();
    map.fillStyle = map.strokeStyle = v.foil;
    draw(map);
    map.restore();
    metal.save();
    metal.fillStyle = metal.strokeStyle = '#fff';
    draw(metal);
    metal.restore();
    rough.save();
    rough.fillStyle = rough.strokeStyle = 'rgb(60,60,60)';
    draw(rough);
    rough.restore();
    bump.save();
    bump.filter = 'blur(1.5px)';
    bump.fillStyle = bump.strokeStyle = '#a0a0a0';
    draw(bump);
    bump.restore();
  };
  /**
   * Grabado hundido para el logo: la figura se imprime y, dentro de ella, el borde de arriba a la izquierda
   * proyecta una sombra y el de abajo a la derecha atrapa luz. Así se ve con profundidad sin sobresalir.
   */
  const deboss = (draw: (c: CanvasRenderingContext2D) => void, color: string, metallic = false) => {
    const shape = document.createElement('canvas');
    shape.width = TW;
    shape.height = TH;
    const sc = shape.getContext('2d')!;
    sc.fillStyle = sc.strokeStyle = color;
    draw(sc);
    // Inverso de la figura: todo menos la figura.
    const inv = document.createElement('canvas');
    inv.width = TW;
    inv.height = TH;
    const ic = inv.getContext('2d')!;
    ic.fillStyle = '#000';
    ic.fillRect(0, 0, TW, TH);
    ic.globalCompositeOperation = 'destination-out';
    ic.fillStyle = ic.strokeStyle = '#000';
    draw(ic);
    const inner = (ox: number, oy: number, blur: number, tint: string) => {
      sc.save();
      sc.globalCompositeOperation = 'source-atop';
      sc.shadowColor = tint;
      sc.shadowBlur = blur;
      // El inverso se dibuja fuera de la hoja; solo su sombra cae dentro de la figura.
      sc.shadowOffsetX = TW * 2 + ox;
      sc.shadowOffsetY = oy;
      sc.drawImage(inv, -TW * 2, 0);
      sc.restore();
    };
    inner(7, 10, 12, 'rgba(0,0,0,0.62)');
    inner(3, 4, 3, 'rgba(0,0,0,0.45)');
    inner(-4, -5, 6, 'rgba(255,255,255,0.28)');
    map.drawImage(shape, 0, 0);
    // Fuera de la figura: un hilo de luz en el canto inferior derecho del papel, donde el hundido "corta" la hoja.
    map.save();
    map.globalCompositeOperation = 'source-over';
    map.filter = 'blur(1.2px)';
    map.globalAlpha = 0.22;
    map.drawImage(maskOf(shape, '#ffffff'), 2, 3);
    map.restore();
    map.drawImage(shape, 0, 0);
    // Relieve: la figura queda más abajo que el papel, con paredes suaves.
    bump.save();
    bump.filter = 'blur(3px)';
    bump.fillStyle = bump.strokeStyle = '#262626';
    draw(bump);
    bump.restore();
    if (metallic) {
      metal.save();
      metal.fillStyle = metal.strokeStyle = '#fff';
      draw(metal);
      metal.restore();
      rough.save();
      rough.fillStyle = rough.strokeStyle = 'rgb(70,70,70)';
      draw(rough);
      rough.restore();
    }
  };
  const blind = (draw: (c: CanvasRenderingContext2D) => void) => {
    bump.save();
    bump.filter = 'blur(5px)';
    bump.fillStyle = bump.strokeStyle = '#b4b4b4';
    draw(bump);
    bump.restore();
  };
  const star = (c: CanvasRenderingContext2D, x: number, y: number, s: number) => {
    c.beginPath();
    c.moveTo(x, y - s);
    c.quadraticCurveTo(x + s * 0.1, y - s * 0.1, x + s, y);
    c.quadraticCurveTo(x + s * 0.1, y + s * 0.1, x, y + s);
    c.quadraticCurveTo(x - s * 0.1, y + s * 0.1, x - s, y);
    c.quadraticCurveTo(x - s * 0.1, y - s * 0.1, x, y - s);
    c.fill();
  };
  const orbit = (c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, w: number) => {
    c.lineWidth = w;
    c.beginPath();
    c.ellipse(x, y, rx, ry, (-8 * Math.PI) / 180, 0, Math.PI * 2);
    c.stroke();
  };
  const text = (c: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, spacing = 0, align: CanvasTextAlign = 'left') => {
    c.font = font;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
    c.fillText(s, x, y);
  };

  const cx = TW / 2;
  if (side === 'front') {
    // Frente: órbita y estrella en foil, ASTOR hundido al centro y una línea de oficio abajo.
    blind((c) => orbit(c, cx, TH * 0.5, TW * 0.46, TH * 0.2, 10));
    deboss((c) => orbit(c, cx, TH * 0.47, TW * 0.27, TH * 0.11, 7), v.foil, true);
    deboss((c) => {
      const a = (-0.62 * Math.PI);
      const x = TW * 0.27 * Math.cos(a);
      const y = TH * 0.11 * Math.sin(a);
      const t = (-8 * Math.PI) / 180;
      c.beginPath();
      c.arc(cx + x * Math.cos(t) - y * Math.sin(t), TH * 0.47 + x * Math.sin(t) + y * Math.cos(t), 15, 0, Math.PI * 2);
      c.fill();
    }, v.foil, true);
    deboss((c) => text(c, 'ASTOR', cx + 30, TH * 0.57, '400 300px "Instrument Serif", serif', 44, 'center'), v.ink);
    deboss((c) => star(c, cx - 420, TH * 0.33, 58), v.foil, true);
    ink((c) => text(c, 'FOTOGRAFÍA  ·  BODAS Y EVENTOS  ·  AGUASCALIENTES', cx, TH * 0.84, '600 44px "Instrument Sans Variable", sans-serif', 12, 'center'), 0.9);
  } else {
    // Reverso: nombre, oficio, una línea de foil y los datos en dos columnas.
    const x = 150;
    blind((c) => orbit(c, TW * 0.92, TH * 0.5, TW * 0.3, TH * 0.5, 9));
    deboss((c) => star(c, x + 26, 190, 38), v.foil, true);
    ink((c) => text(c, 'Emilio Astor', x, 420, 'italic 400 150px "Instrument Serif", serif'));
    ink((c) => text(c, 'FOTÓGRAFO DE BODAS, XV AÑOS Y EVENTOS', x, 500, '500 32px "Instrument Sans Variable", sans-serif', 9), 0.75);
    foil((c) => c.fillRect(x, 566, 220, 5));
    const rows: [string, string][] = [
      [BRAND.phone, BRAND.instagram],
      [BRAND.email, BRAND.web],
      ['Juan de Montoro 318', 'Zona Centro, Ags.'],
    ];
    rows.forEach(([a, b], i) => {
      const y = 700 + i * 76;
      ink((c) => text(c, a, x, y, '400 42px "Hanken Grotesk Variable", sans-serif', 1));
      ink((c) => text(c, b, x + 860, y, '400 42px "Hanken Grotesk Variable", sans-serif', 1));
    });
    foil((c) => text(c, 'BODAS  ✦  XV AÑOS  ✦  EVENTOS SOCIALES', x, TH - 110, '500 30px "Instrument Sans Variable", sans-serif', 10));
  }
  return f;
}

/** Copia de la silueta de una figura, pintada de un solo color. */
function maskOf(src: HTMLCanvasElement, color: string) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d')!;
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
