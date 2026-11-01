import * as THREE from 'three';
import { Program } from './programs';
import { Images, Slide, averageColor, compose } from './slides';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Transición entre la diapositiva actual (tA) y la siguiente (tB). Todo en coordenadas del canvas completo
// (uvOff/uvScale), para que en pantallas partidas (la caja, el tríptico) el efecto cruce de una a otra.
// Transiciones suaves y sin pixeles: barrido difuso, deslizamiento con paralaje, vidrio estriado, iris suave,
// acercamiento con desenfoque, apertura al centro, cortina y fundido por luminosidad.
const FRAG = /* glsl */ `
uniform sampler2D tA;
uniform sampler2D tB;
uniform float progress;
uniform int mode;
uniform float bright;
uniform float hover;
uniform vec2 uvOff;
uniform vec2 uvScale;
uniform float flipX;
uniform float aspect;
uniform float kbA;
uniform float kbB;
uniform float seed;
varying vec2 vUv;

vec2 kb(vec2 uv, float k) { return (uv - 0.5) / (1.0 + k) + 0.5; }
vec3 A(vec2 uv) { return texture2D(tA, kb(clamp(uv, 0.0, 1.0), kbA)).rgb; }
vec3 B(vec2 uv) { return texture2D(tB, kb(clamp(uv, 0.0, 1.0), kbB)).rgb; }
// Desenfoque barato (8 muestras en círculo) para las transiciones que lo necesitan.
vec3 Ab(vec2 uv, float r) {
  vec3 c = A(uv) * 0.2;
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; c += A(uv + vec2(cos(a), sin(a) * aspect) * r) * 0.1; }
  return c;
}
vec3 Bb(vec2 uv, float r) {
  vec3 c = B(uv) * 0.2;
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; c += B(uv + vec2(cos(a), sin(a) * aspect) * r) * 0.1; }
  return c;
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 local = vec2(mix(vUv.x, 1.0 - vUv.x, flipX), vUv.y);
  vec2 uv = uvOff + local * uvScale;
  float p = clamp(progress, 0.0, 1.0);
  float e = p * p * (3.0 - 2.0 * p);
  float arc = sin(p * 3.14159265);
  vec3 col;
  if (p <= 0.0) {
    col = A(uv);
  } else if (p >= 1.0) {
    col = B(uv);
  } else if (mode == 0) {
    // Barrido diagonal con borde muy difuso y un brillo suave en el frente.
    float d = uv.x * 0.85 + (1.0 - uv.y) * 0.15;
    float edge = e * 1.5 - 0.25;
    float m = smoothstep(edge + 0.25, edge - 0.25, d);
    col = mix(A(uv), B(uv), m);
    col += vec3(1.0, 0.96, 0.94) * exp(-pow((d - edge) * 7.0, 2.0)) * arc * 0.12;
  } else if (mode == 1) {
    // Deslizamiento: la nueva cubre a la actual desde la derecha; la actual se aleja más lento y se oscurece.
    float x = 1.0 - e;
    if (uv.x > x) {
      col = B(vec2(uv.x - x, uv.y));
      col *= 1.0 - exp(-(uv.x - x) * 40.0) * 0.25;
    } else {
      col = A(vec2(uv.x + e * 0.35, uv.y)) * (1.0 - e * 0.55);
    }
  } else if (mode == 2) {
    // Vidrio estriado: franjas verticales que refractan mientras cambia, en ola de izquierda a derecha.
    float n = 12.0;
    float f = fract(uv.x * n);
    float lp = clamp(p * 1.5 - (floor(uv.x * n) / n) * 0.5, 0.0, 1.0);
    float bend = sin(lp * 3.14159265);
    vec2 off = vec2((f - 0.5) * 0.05 * bend, 0.0);
    col = mix(A(uv + off), B(uv - off), smoothstep(0.2, 0.8, lp));
    col += bend * 0.05 * (1.0 - abs(f - 0.5) * 2.0);
  } else if (mode == 3) {
    // Iris suave desde el centro.
    vec2 d = (uv - 0.5) * vec2(aspect, 1.0);
    float r = length(d);
    float R = e * (length(vec2(aspect, 1.0)) * 0.6 + 0.25);
    col = mix(A(uv), B(uv), smoothstep(R, R - 0.25, r));
  } else if (mode == 4) {
    // Acercamiento con desenfoque: la actual crece y se desenfoca; la nueva llega desde un poco más grande.
    vec2 ua = (uv - 0.5) / (1.0 + e * 0.12) + 0.5;
    vec2 ub = (uv - 0.5) / (1.0 + (1.0 - e) * 0.08) + 0.5;
    col = mix(Ab(ua, arc * 0.012), Bb(ub, arc * 0.012), e);
  } else if (mode == 5) {
    // Se abre desde el centro, con borde difuso.
    float d = abs(uv.x - 0.5) * 2.0;
    col = mix(A(uv), B(uv), smoothstep(e * 1.3, e * 1.3 - 0.3, d));
  } else if (mode == 6) {
    // Cortina: la nueva sube desde abajo con un poco de paralaje y la actual se desvanece.
    float edge = e * 1.2 - 0.1;
    float m = smoothstep(edge - 0.1, edge + 0.1, 1.0 - uv.y + 0.0);
    m = 1.0 - m;
    vec3 b = B(vec2(uv.x, uv.y + (1.0 - e) * 0.08));
    col = mix(A(uv) * (1.0 - e * 0.4), b, m);
  } else {
    // Fundido por luminosidad: las luces de la nueva foto aparecen primero, las sombras al final.
    vec3 b = B(uv);
    float l = luma(b);
    float m = smoothstep(l - 0.2, l + 0.2, e * 1.4 - 0.2);
    col = mix(A(uv), b, m);
  }
  // Borde apenas más oscuro, como un panel real.
  vec2 e2 = smoothstep(vec2(0.0), vec2(0.01), local) * smoothstep(vec2(0.0), vec2(0.01), 1.0 - local);
  col *= mix(0.85, 1.0, e2.x * e2.y);
  col *= 0.92 * bright * (1.0 + hover * 0.08);
  gl_FragColor = vec4(col, 1.0);
}
`;

const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(name: string, small: boolean): Promise<HTMLImageElement> {
  const key = `${name}|${small}`;
  let p = cache.get(key);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = `/media/fotos/${name}${small ? '-sm' : ''}.webp`;
    });
    cache.set(key, p);
  }
  return p;
}

export interface Part {
  mesh: THREE.Mesh;
  uvOff: [number, number];
  uvScale: [number, number];
}

/**
 * Una pantalla (o varias que comparten contenido, como las caras de la caja): dos canvas (actual y siguiente),
 * un material por pieza física y el horario de su programa.
 */
export class Screen {
  readonly parts: THREE.Mesh[] = [];
  readonly center = new THREE.Vector3();
  readonly color = new THREE.Color(0, 0, 0);
  readonly targetColor = new THREE.Color(0, 0, 0);
  /** Luz que la pantalla echa al cuarto (la enciende el motor). */
  light?: THREE.PointLight;
  current: Slide;
  private canvasA = document.createElement('canvas');
  private canvasB = document.createElement('canvas');
  private texA: THREE.CanvasTexture;
  private texB: THREE.CanvasTexture;
  private readonly shared: Record<string, THREE.IUniform>;
  private index = 0;
  private state: 'off' | 'hold' | 'preparing' | 'ready' | 'transition' = 'off';
  private holdUntil = 0;
  private transStart = 0;
  private readonly transDur: number;
  private bright = 0;
  private powerAt = 0;
  private hoverTarget = 0;
  private kbA = 0;
  private kbB = 0;
  private nextSlide?: Slide;

  constructor(
    readonly program: Program,
    width: number,
    height: number,
    readonly offset = 0,
  ) {
    for (const c of [this.canvasA, this.canvasB]) {
      c.width = width;
      c.height = height;
    }
    const mk = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.anisotropy = 8;
      return t;
    };
    this.texA = mk(this.canvasA);
    this.texB = mk(this.canvasB);
    this.shared = {
      tA: { value: this.texA },
      tB: { value: this.texB },
      progress: { value: 0 },
      mode: { value: 0 },
      bright: { value: 0 },
      hover: { value: 0 },
      aspect: { value: width / height },
      kbA: { value: 0 },
      kbB: { value: 0 },
      seed: { value: Math.random() * 100 },
    };
    this.current = program.slides[0];
    this.transDur = 2.4;
  }

  /** Crea una pieza física con su parte del canvas. */
  addPart(geometry: THREE.BufferGeometry, part: { uvOff?: [number, number]; uvScale?: [number, number]; flipX?: boolean; meters: [number, number] }) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...this.shared,
        uvOff: { value: new THREE.Vector2(...(part.uvOff ?? [0, 0])) },
        uvScale: { value: new THREE.Vector2(...(part.uvScale ?? [1, 1])) },
        flipX: { value: part.flipX ? 1 : 0 },
      },
      toneMapped: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.userData['screen'] = this;
    mesh.userData['uvOff'] = part.uvOff ?? [0, 0];
    mesh.userData['uvScale'] = part.uvScale ?? [1, 1];
    mesh.userData['flipX'] = !!part.flipX;
    this.parts.push(mesh);
    return mesh;
  }

  /** Prepara la primera diapositiva y enciende la pantalla. */
  async start(now: number) {
    const s = this.program.slides[0];
    await this.prepare(s, this.canvasA, this.texA);
    this.current = s;
    this.kbA = 0;
    this.state = 'hold';
    this.powerAt = now;
    this.holdUntil = now + this.program.hold + this.offset;
  }

  get ready() {
    return this.state !== 'off';
  }

  private async prepare(slide: Slide, canvas: HTMLCanvasElement, tex: THREE.CanvasTexture) {
    const imgs: Images = new Map();
    await Promise.all(slide.photos.map(async (p) => imgs.set(p, await loadImage(p, !!this.program.small))));
    compose(slide, canvas, imgs);
    tex.needsUpdate = true;
    const [r, g, b] = averageColor(canvas);
    return new THREE.Color(r, g, b);
  }

  setHover(on: boolean) {
    this.hoverTarget = on ? 1 : 0;
  }

  /** Foto bajo el punto tocado (x del canvas completo, 0–1). */
  photoAt(x: number): string | null {
    const r = this.current.regions?.find((z) => x >= z.x0 && x <= z.x1);
    return r?.photo ?? null;
  }

  update(now: number, dt: number, active: boolean, reduced: boolean) {
    const u = this.shared;
    // Encendido: sube suave en un segundo.
    if (this.state !== 'off') {
      const t = Math.min(1, (now - this.powerAt) / 1.1);
      this.bright = reduced ? 1 : t * t * (3 - 2 * t);
    }
    u['bright'].value = this.bright;
    u['hover'].value += (this.hoverTarget - u['hover'].value) * Math.min(1, dt * 8);
    if (this.current.kb && !reduced) this.kbA = Math.min(0.09, this.kbA + dt * 0.006);
    u['kbA'].value = this.kbA;
    u['kbB'].value = this.kbB;
    this.color.lerp(this.targetColor, Math.min(1, dt * 1.5));
    if (!active || this.state === 'off') return;

    if (this.state === 'hold' && now > this.holdUntil - 1.6) {
      this.state = 'preparing';
      const next = this.program.slides[(this.index + 1) % this.program.slides.length];
      this.prepare(next, this.canvasB, this.texB).then((c) => {
        this.nextSlide = next;
        this.nextColor = c;
        this.state = 'ready';
      });
    }
    if (this.state === 'ready' && now >= this.holdUntil) {
      this.state = 'transition';
      this.transStart = now;
      this.kbB = 0;
      const modes = this.program.transitions;
      u['mode'].value = reduced ? 7 : modes[this.index % modes.length];
      u['seed'].value = Math.random() * 100;
      if (this.nextColor) this.targetColor.copy(this.nextColor);
    }
    if (this.state === 'transition') {
      const p = Math.min(1, (now - this.transStart) / (reduced ? 0.6 : this.transDur));
      u['progress'].value = p;
      if (this.nextSlide?.kb) this.kbB = Math.min(0.09, this.kbB + dt * 0.006);
      if (p >= 1) {
        // La siguiente pasa a ser la actual: se intercambian canvas y texturas.
        [this.canvasA, this.canvasB] = [this.canvasB, this.canvasA];
        [this.texA, this.texB] = [this.texB, this.texA];
        u['tA'].value = this.texA;
        u['tB'].value = this.texB;
        u['progress'].value = 0;
        this.kbA = this.kbB;
        this.kbB = 0;
        this.index = (this.index + 1) % this.program.slides.length;
        this.current = this.nextSlide!;
        this.state = 'hold';
        this.holdUntil = now + this.program.hold;
      }
    }
  }

  private nextColor?: THREE.Color;

  /** Color inicial de la luz (después de start). */
  primeColor() {
    const [r, g, b] = averageColor(this.canvasA);
    this.targetColor.setRGB(r, g, b);
    this.color.copy(this.targetColor);
  }

  dispose() {
    this.texA.dispose();
    this.texB.dispose();
    for (const m of this.parts) (m.material as THREE.Material).dispose();
  }
}
