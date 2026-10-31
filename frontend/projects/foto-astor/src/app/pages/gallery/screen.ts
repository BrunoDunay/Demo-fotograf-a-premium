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
uniform vec2 res;
uniform float kbA;
uniform float kbB;
uniform float seed;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 kb(vec2 uv, float k) { return (uv - 0.5) / (1.0 + k) + 0.5; }
vec3 A(vec2 uv) { return texture2D(tA, kb(clamp(uv, 0.0, 1.0), kbA)).rgb; }
vec3 B(vec2 uv) { return texture2D(tB, kb(clamp(uv, 0.0, 1.0), kbB)).rgb; }

void main() {
  vec2 local = vec2(mix(vUv.x, 1.0 - vUv.x, flipX), vUv.y);
  vec2 uv = uvOff + local * uvScale;
  float p = clamp(progress, 0.0, 1.0);
  float arc = sin(p * 3.14159265);
  vec3 col;
  float line = 0.0;
  if (p <= 0.0) {
    col = A(uv);
  } else if (p >= 1.0) {
    col = B(uv);
  } else if (mode == 0) {
    // Barrido con una línea de luz al frente.
    float e = p * 1.08 - 0.04;
    float m = smoothstep(e + 0.004, e - 0.004, uv.x);
    col = mix(A(uv), B(uv), m);
    line = exp(-abs(uv.x - e) * 240.0) * arc;
  } else if (mode == 1) {
    // Empuje: la actual sale por la izquierda y la nueva entra, de corrido.
    float e = smoothstep(0.0, 1.0, p);
    float x = uv.x + e;
    col = x < 1.0 ? A(vec2(x, uv.y)) : B(vec2(x - 1.0, uv.y));
    line = exp(-abs(uv.x - (1.0 - e)) * 320.0) * arc * 0.7;
  } else if (mode == 2) {
    // Costillas de vidrio: franjas verticales que refractan y cambian escalonadas.
    float n = 14.0;
    float i = floor(uv.x * n);
    float lp = clamp(p * 1.7 - (i / n) * 0.7, 0.0, 1.0);
    float f = fract(uv.x * n);
    float bend = sin(lp * 3.14159265);
    vec2 off = vec2((f - 0.5) * 0.07 * bend, 0.0);
    col = mix(A(uv + off), B(uv - off), smoothstep(0.35, 0.65, lp));
    col += bend * 0.07 * (1.0 - abs(f - 0.5) * 2.0);
  } else if (mode == 3) {
    // Iris desde el centro.
    vec2 d = (uv - 0.5) * vec2(aspect, 1.0);
    float r = length(d);
    float R = p * (length(vec2(aspect, 1.0)) * 0.55 + 0.05);
    float m = smoothstep(R, R - 0.02, r);
    col = mix(A(uv), B(uv), m);
    line = exp(-abs(r - R) * 160.0) * arc * 0.8;
  } else if (mode == 4) {
    // Pixeles LED que se encienden al azar.
    vec2 cell = floor(uv * vec2(46.0 * aspect, 46.0));
    float h = hash(cell + seed);
    float m = smoothstep(h - 0.08, h + 0.08, p * 1.16 - 0.08);
    col = mix(A(uv), B(uv), m);
    col += (1.0 - abs(m * 2.0 - 1.0)) * 0.1;
  } else if (mode == 5) {
    // Se abre desde el centro como dos puertas.
    float d = abs(uv.x - 0.5) * 2.0;
    float e = p * 1.06;
    float m = smoothstep(e + 0.006, e - 0.006, d);
    col = mix(A(uv), B(uv), m);
    line = exp(-abs(d - e) * 200.0) * arc;
  } else if (mode == 6) {
    // Persianas horizontales escalonadas.
    float rows = 9.0;
    float i = floor(uv.y * rows);
    float lp = clamp(p * 1.6 - (1.0 - i / rows) * 0.6, 0.0, 1.0);
    float m = step(1.0 - lp, fract(uv.y * rows));
    col = mix(A(uv), B(uv), m);
  } else {
    float e = smoothstep(0.0, 1.0, p);
    col = mix(A(uv), B(uv), e) * (1.0 + arc * 0.1);
  }
  col += vec3(1.0, 0.97, 0.92) * line;
  // Rejilla de pixeles LED: solo se nota de cerca (se apaga con la distancia para evitar moiré).
  vec2 g = local * res;
  vec2 fw = fwidth(g);
  float grid = smoothstep(0.0, 0.22, fract(g.x)) * smoothstep(0.0, 0.22, fract(g.y));
  float amp = 0.1 * (1.0 - smoothstep(0.12, 0.45, max(fw.x, fw.y)));
  col *= 1.0 - amp * (1.0 - grid);
  // Borde un poco más oscuro, como un panel real.
  vec2 e2 = smoothstep(vec2(0.0), vec2(0.015), local) * smoothstep(vec2(0.0), vec2(0.015), 1.0 - local);
  col *= mix(0.82, 1.0, e2.x * e2.y);
  col *= 0.9 * bright * (1.0 + hover * 0.1);
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
    this.transDur = 1.9;
  }

  /** Crea una pieza física con su parte del canvas. res: tamaño en metros (para la rejilla LED). */
  addPart(geometry: THREE.BufferGeometry, part: { uvOff?: [number, number]; uvScale?: [number, number]; flipX?: boolean; meters: [number, number] }) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...this.shared,
        uvOff: { value: new THREE.Vector2(...(part.uvOff ?? [0, 0])) },
        uvScale: { value: new THREE.Vector2(...(part.uvScale ?? [1, 1])) },
        flipX: { value: part.flipX ? 1 : 0 },
        res: { value: new THREE.Vector2(part.meters[0] * 64, part.meters[1] * 64) },
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

  /** Prepara la primera diapositiva y enciende la pantalla (con un parpadeo, como un LED real). */
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
    // Encendido: sube con dos parpadeos cortos.
    if (this.state !== 'off') {
      const t = now - this.powerAt;
      const flick = t < 0.5 ? (Math.sin(t * 60) > 0.2 ? 0.7 : 0.15) * Math.min(1, t * 4) : Math.min(1, 0.7 + (t - 0.5) * 1.5);
      this.bright = reduced ? 1 : flick;
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
