import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { CUBE_BACK, CUBE_FRONT, PANORAMA, Program, SQUARES, TOTEMS, TRIPTYCH, WELCOME, programPhotos } from './programs';
import { Screen } from './screen';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface GalleryHooks {
  onRoom(index: number): void;
  onHover(on: boolean): void;
  onPick(photos: string[], index: number): void;
  onLoad(progress: number): void;
  onReady(): void;
  onEnd(atEnd: boolean): void;
}

export interface GalleryApi {
  setProgress(q: number): void;
  pointer(x: number, y: number, fine: boolean): void;
  leave(): void;
  click(x: number, y: number): void;
  resize(): void;
  setVisible(v: boolean): void;
  destroy(): void;
}

interface Stop {
  pos: [number, number, number];
  look: [number, number, number];
  room: number;
  /** En pantallas verticales, cuánto se puede alejar la cámara de lo que mira (máximo). */
  pk?: number;
  /** Llegar a este encuadre con un corte (fundido) aunque sea la misma sala. */
  cut?: boolean;
}

/**
 * Recorrido como cambios de escena dentro de la misma galería: encuadres compuestos (estaciones). Dentro de una
 * sala la cámara se desliza de un encuadre al otro; entre salas hay un fundido breve a negro (corte de escena),
 * en lugar de caminar por los pasillos.
 */
const STOPS: Stop[] = [
  { pos: [0, 1.65, 15], look: [0, 2.3, 0], room: 0, pk: 1.2 },
  { pos: [0.6, 1.62, 7.5], look: [0, 2.35, 0], room: 0, pk: 1.6 },
  { pos: [4.7, 1.65, -4.3], look: [-0.8, 2.0, -9.6], room: 1, pk: 1.25 },
  { pos: [-0.3, 1.65, -11.2], look: [-1.0, 2.0, -18], room: 1, pk: 1.3 },
  { pos: [0.4, 1.65, -20.8], look: [0, 1.85, -29], room: 2, pk: 1.45 },
  { pos: [6.2, 1.65, -22.8], look: [1.2, 1.85, -28.2], room: 2, pk: 1 },
  { pos: [2.4, 1.65, -37.4], look: [0, 1.85, -29.6], room: 2, pk: 1.15, cut: true },
  { pos: [0.6, 1.62, -40.2], look: [7.9, 2.0, -41.2], room: 3, pk: 1.12 },
  { pos: [1.2, 1.5, -40.6], look: [-4.2, 0.85, -42], room: 3, pk: 1.5 },
  { pos: [0, 1.65, -44.6], look: [0, 2.15, -59], room: 4, pk: 1 },
  { pos: [0.3, 1.62, -50.2], look: [-3.6, 2.0, -58.4], room: 4, pk: 1 },
  { pos: [0, 1.62, -51.4], look: [0, 2.25, -60], room: 4, pk: 1 },
];

const SILHOUETTES: { name: string; x: number; z: number; h: number }[] = [
  { name: 'sil-abrigo', x: -2.7, z: 3.2, h: 1.78 },
  { name: 'sil-mujer-espalda', x: 2.2, z: 2.5, h: 1.66 },
  { name: 'sil-camina', x: 4.9, z: 5.6, h: 1.75 },
  { name: 'sil-vestido', x: -0.4, z: -7.6, h: 1.65 },
  { name: 'sil-senor', x: 1.4, z: -14.6, h: 1.72 },
  { name: 'sil-joven', x: -2.4, z: -16.6, h: 1.77 },
  { name: 'sil-pensando', x: -2.5, z: -24.4, h: 1.78 },
  { name: 'sil-mujer', x: 2.9, z: -24.2, h: 1.68 },
  { name: 'sil-sombrero', x: 5.3, z: -42.8, h: 1.74 },
  { name: 'sil-mochila', x: -1.9, z: -37.6, h: 1.75 },
  { name: 'sil-traje', x: 3.5, z: -57.6, h: 1.8 },
  { name: 'sil-vestido', x: -3.4, z: -57.9, h: 1.62 },
];

// Avance entre encuadres: suave al salir y al llegar, pero sin detenerse del todo (no se "atora" el scroll).
const glide = (t: number) => {
  const s = t * t * (3 - 2 * t);
  return t * 0.35 + s * 0.65;
};

/** Variación muy suave y grande (manchas del concreto pulido), sin grano fino. */
function softNoise(size = 256) {
  const data = new Uint8Array(size * size * 4);
  const grid = (gx: number, gy: number, n: number) => {
    const x = ((gx % n) + n) % n;
    const y = ((gy % n) + n) % n;
    const s = Math.sin(x * 127.1 + y * 311.7 + n * 17.3) * 43758.5453;
    return s - Math.floor(s);
  };
  const value = (x: number, y: number, n: number) => {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const tx = x - fx;
    const ty = y - fy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = grid(fx, fy, n);
    const b = grid(fx + 1, fy, n);
    const c = grid(fx, fy + 1, n);
    const d = grid(fx + 1, fy + 1, n);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = value((x / size) * 4, (y / size) * 4, 4) * 0.7 + value((x / size) * 8, (y / size) * 8, 8) * 0.3;
      const g = Math.round(150 + v * 70);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = g;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// Reflejo del piso pulido: desenfoque suave en ambos ejes (sin distorsión), más fuerte a ras del piso (Fresnel)
// y que se apaga con la distancia. Se suma sobre el piso iluminado.
const REFLECT_VERT = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vWorld;
void main() {
  vUv = textureMatrix * vec4(position, 1.0);
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const REFLECT_FRAG = /* glsl */ `
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform float strength;
uniform vec3 camPos;
varying vec4 vUv;
varying vec3 vWorld;
void main() {
  vec2 uv = vUv.xy / vUv.w;
  vec3 sum = vec3(0.0);
  float tot = 0.0;
  for (int i = -3; i <= 3; i++) {
    for (int j = -3; j <= 3; j++) {
      vec2 o = vec2(float(i) * 0.0032, float(j) * 0.0055);
      float w = exp(-float(i * i + j * j) / 6.0);
      sum += texture2D(tDiffuse, uv + o).rgb * w;
      tot += w;
    }
  }
  sum /= tot;
  vec3 v = normalize(camPos - vWorld);
  float fres = 0.25 + 0.75 * pow(1.0 - clamp(v.y, 0.0, 1.0), 3.0);
  float dist = length(vWorld.xz - camPos.xz);
  float fade = 1.0 - smoothstep(9.0, 30.0, dist);
  gl_FragColor = vec4(sum * strength * fres * fade * color, 1.0);
}
`;

// Último paso: viñeta suave y fundido a negro para los cortes entre salas. Sin grano.
const GRADE = {
  uniforms: { tDiffuse: { value: null }, aspect: { value: 1 }, dip: { value: 0 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float aspect; uniform float dip; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = (vUv - 0.5) * vec2(aspect, 1.0);
      c *= mix(1.0, 0.6, smoothstep(0.45, 1.1, length(d)));
      c *= 1.0 - dip;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

/** Rotulación de pared (vinil): logo o nombre de sala en una textura de canvas transparente. */
function signTexture(kind: 'logo' | 'room', a: string, b: string) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e9ecf3';
  g.strokeStyle = '#e9ecf3';
  g.textAlign = 'center';
  const ls = (px: number) => ((g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`);
  if (kind === 'logo') {
    // Estrella, órbita y la palabra.
    g.lineWidth = 5;
    g.globalAlpha = 0.7;
    g.beginPath();
    g.ellipse(1024, 470, 760, 170, (-8 * Math.PI) / 180, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
    g.font = '400 360px "Instrument Serif", serif';
    ls(40);
    g.fillText('ASTOR', 1044, 590);
    star(g, 640, 290, 70);
    g.font = '500 54px "Instrument Sans Variable", sans-serif';
    ls(26);
    g.fillText(a, 1024, 820);
    g.globalAlpha = 0.65;
    g.font = 'italic 400 64px "Instrument Serif", serif';
    ls(0);
    g.fillText(b, 1024, 920);
  } else {
    g.textAlign = 'left';
    star(g, 120, 330, 34);
    g.font = '500 58px "Instrument Sans Variable", sans-serif';
    ls(24);
    g.fillText(a.toUpperCase(), 190, 352);
    g.font = '400 260px "Instrument Serif", serif';
    ls(0);
    g.fillText(b, 100, 620);
    g.fillRect(104, 700, 260, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function star(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x + s * 0.1, y - s * 0.1, x + s, y);
  g.quadraticCurveTo(x + s * 0.1, y + s * 0.1, x, y + s);
  g.quadraticCurveTo(x - s * 0.1, y + s * 0.1, x - s, y);
  g.quadraticCurveTo(x - s * 0.1, y - s * 0.1, x, y - s);
  g.fill();
}

/** Proyección de luz (gobo) del logo sobre el piso: estrella y órbita, con borde suave. */
function goboTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(512, 512, 40, 512, 512, 500);
  grad.addColorStop(0, 'rgba(255,245,240,0.18)');
  grad.addColorStop(1, 'rgba(255,245,240,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  g.filter = 'blur(3px)';
  g.strokeStyle = 'rgba(255,240,236,0.9)';
  g.fillStyle = 'rgba(255,240,236,0.95)';
  g.lineWidth = 6;
  g.beginPath();
  g.ellipse(512, 512, 430, 120, -0.15, 0, Math.PI * 2);
  g.stroke();
  star(g, 512, 512, 150);
  g.beginPath();
  g.arc(880, 380, 16, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function createGallery(canvas: HTMLCanvasElement, hooks: GalleryHooks, opts: { reduced: boolean }): Promise<GalleryApi> {
  const narrow = innerWidth < 760;
  const lowPower = narrow || (navigator.hardwareConcurrency ?? 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x05060a, 0.022);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 140);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);

  // ===== Sala: piso de concreto pulido, muros de yeso oscuro y techo en penumbra =====
  scene.add(new THREE.HemisphereLight(0x8a93b0, 0x0a0b10, 0.12));
  const spots = track(softNoise());
  spots.repeat.set(2, 6);
  const floorMat = track(new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.62, metalness: 0, roughnessMap: spots }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(40, 130)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -24);
  scene.add(floor);

  const reflector = new Reflector(track(new THREE.PlaneGeometry(40, 130)), {
    clipBias: 0.003,
    textureWidth: Math.round((innerWidth * renderer.getPixelRatio()) / (lowPower ? 2.5 : 1.6)),
    textureHeight: Math.round((innerHeight * renderer.getPixelRatio()) / (lowPower ? 2.5 : 1.6)),
    color: 0xffffff,
    shader: {
      name: 'AstorFloor',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        strength: { value: 0.5 },
        camPos: { value: new THREE.Vector3() },
      },
      vertexShader: REFLECT_VERT,
      fragmentShader: REFLECT_FRAG,
    },
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(0, 0.003, -24);
  const reflMat = reflector.material as THREE.ShaderMaterial;
  reflMat.transparent = true;
  reflMat.blending = THREE.AdditiveBlending;
  reflMat.depthWrite = false;
  scene.add(reflector);

  const wallMat = track(new THREE.MeshStandardMaterial({ color: 0x272c38, roughness: 0.92 }));
  const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x0c0d11, roughness: 0.5, metalness: 0.25 }));
  const wallGeo = track(new THREE.PlaneGeometry(130, 6.6));
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(wallGeo, wallMat);
    w.rotation.y = -side * (Math.PI / 2);
    w.position.set(side * 8, 3.3, -24);
    scene.add(w);
    // Zoclo oscuro al pie del muro.
    const base = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 0.12, 130)), darkMat);
    base.position.set(side * 7.98, 0.06, -24);
    scene.add(base);
  }
  const endGeo = track(new THREE.PlaneGeometry(16, 6.6));
  const back = new THREE.Mesh(endGeo, wallMat);
  back.position.set(0, 3.3, -62);
  scene.add(back);
  const front = new THREE.Mesh(endGeo, wallMat);
  front.rotation.y = Math.PI;
  front.position.set(0, 3.3, 19);
  scene.add(front);
  const ceiling = new THREE.Mesh(track(new THREE.PlaneGeometry(16, 130)), track(new THREE.MeshBasicMaterial({ color: 0x030306 })));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.6, -24);
  scene.add(ceiling);

  // Luz que baña los muros desde arriba (como en una galería real): conos suaves sobre la pared.
  const washes: [number, number][] = lowPower
    ? [[-1, 9], [1, -8], [-1, -34], [1, -47]]
    : [[-1, 9], [1, 9], [1, -7], [-1, -14], [-1, -24], [1, -33], [-1, -38], [1, -48]];
  for (const [side, z] of washes) {
    const s = new THREE.SpotLight(0xffe9dc, 60, 9, 0.55, 1, 1.6);
    s.position.set(side * 6.6, 6.3, z);
    s.target.position.set(side * 8, 1.4, z);
    scene.add(s, s.target);
  }

  // Rotulación en vinil: el logo a la entrada y al fondo, y el nombre de cada sala en su muro.
  const signs: [THREE.Texture, number, number, number, number, number][] = [
    [signTexture('logo', 'EXPOSICIÓN PERMANENTE', 'Bodas, XV años y eventos sociales'), -7.97, 3.0, 9.5, Math.PI / 2, 4.4],
    [signTexture('room', 'Sala II', 'Tótems'), 7.97, 2.6, -6.5, -Math.PI / 2, 3],
    [signTexture('room', 'Sala III', 'La caja'), -7.97, 2.6, -23, Math.PI / 2, 3],
    [signTexture('room', 'Sala IV', 'Detalles'), -7.97, 2.6, -36.2, Math.PI / 2, 3],
    [signTexture('room', 'Sala V', 'Panorama'), 7.97, 2.6, -48.5, -Math.PI / 2, 3],
  ];
  for (const [tex, x, y, z, ry, w] of signs) {
    track(tex);
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, w / 2)), track(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.82, depthWrite: false })));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    scene.add(m);
  }

  // Proyecciones del logo en el piso (gobo), girando muy despacio.
  const gobo = track(goboTexture());
  const goboMat = track(new THREE.MeshBasicMaterial({ map: gobo, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
  const gobos = [new THREE.Vector3(0, 0.01, 10.5), new THREE.Vector3(0, 0.01, -46.4), new THREE.Vector3(3.2, 0.01, -20.6)].map((p, i) => {
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(3.4, 3.4)), goboMat);
    m.rotation.x = -Math.PI / 2;
    m.position.copy(p);
    m.userData['spin'] = i % 2 ? -0.03 : 0.04;
    scene.add(m);
    return m;
  });

  // ===== Pantallas =====
  const screens: Screen[] = [];
  const screenMeshes: THREE.Mesh[] = [];
  const px = lowPower ? 150 : 205; // pixeles por metro del canvas
  const canvasSize = (wm: number, hm: number) => {
    const scale = Math.min(1, 2048 / (wm * px));
    return [Math.round(wm * px * scale), Math.round(hm * px * scale)] as const;
  };
  const addScreen = (program: Program, wm: number, hm: number, offset = 0) => {
    const [cw, ch] = canvasSize(wm, hm);
    const s = new Screen(program, cw, ch, offset);
    screens.push(s);
    return s;
  };
  const finish = (s: Screen, center: THREE.Vector3) => {
    s.center.copy(center);
    for (const m of s.parts) screenMeshes.push(m);
  };

  // I. Muro de bienvenida (10 × 4.2 m).
  {
    const s = addScreen(WELCOME, 10, 4.2);
    const box = new THREE.Mesh(track(new THREE.BoxGeometry(10.4, 4.6, 0.36)), darkMat);
    box.position.set(0, 2.45, -0.2);
    const m = s.addPart(track(new THREE.PlaneGeometry(10, 4.2)), { meters: [10, 4.2] });
    m.position.set(0, 2.45, -0.01);
    scene.add(box, m);
    finish(s, new THREE.Vector3(0, 2.45, 0));
  }

  // II. Tótems verticales.
  const totemSpots: [number, number, number][] = [
    [-2.6, -8, 0.45], [3.4, -11, -0.4], [-3.7, -14, 0.5], [1.7, -17.2, -0.28], [-3.4, -19.8, 0.32],
  ];
  const totemBox = track(new THREE.BoxGeometry(2.12, 3.54, 0.16));
  const totemPlane = track(new THREE.PlaneGeometry(2, 3.4));
  totemSpots.forEach(([x, z, ry], i) => {
    const s = addScreen(TOTEMS[i], 2, 3.4, i * 1.3);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    const box = new THREE.Mesh(totemBox, darkMat);
    box.position.y = 1.82;
    const m = s.addPart(totemPlane, { meters: [2, 3.4] });
    m.position.set(0, 1.82, 0.082);
    g.add(box, m);
    scene.add(g);
    finish(s, new THREE.Vector3(x, 1.8, z));
  });

  // III. La caja: cubo LED girado 45°; el contenido da la vuelta a la esquina.
  {
    const g = new THREE.Group();
    g.position.set(0, 0, -29);
    g.rotation.y = Math.PI / 4;
    const box = new THREE.Mesh(track(new THREE.BoxGeometry(5, 3.4, 5)), darkMat);
    box.position.y = 1.75;
    g.add(box);
    const face = track(new THREE.PlaneGeometry(4.9, 3.3));
    const front = addScreen(CUBE_FRONT, 9.8, 3.3);
    const back = addScreen(CUBE_BACK, 9.8, 3.3, 3);
    // Caras (normal local): -x y +z para el frente; +x y -z para la parte de atrás.
    const faces: [Screen, number, number, number, number][] = [
      [front, -Math.PI / 2, -2.505, 0, 0],
      [front, 0, 0, 2.505, 0.5],
      [back, Math.PI / 2, 2.505, 0, 0],
      [back, Math.PI, 0, -2.505, 0.5],
    ];
    for (const [s, ry, fx, fz, u] of faces) {
      const m = s.addPart(face, { uvOff: [u, 0], uvScale: [0.5, 1], meters: [4.9, 3.3] });
      m.rotation.y = ry;
      m.position.set(fx, 1.75, fz);
      g.add(m);
    }
    scene.add(g);
    finish(front, new THREE.Vector3(0, 1.75, -27));
    finish(back, new THREE.Vector3(0, 1.75, -31));
  }

  // IV. Tríptico en la pared derecha y pantallas cuadradas en el piso a la izquierda.
  {
    const s = addScreen(TRIPTYCH, 9, 1.7);
    const plane = track(new THREE.PlaneGeometry(3, 1.7));
    const frame = track(new THREE.BoxGeometry(0.08, 1.82, 3.12));
    [-44.6, -41.2, -37.8].forEach((z, i) => {
      const m = s.addPart(plane, { uvOff: [i / 3, 0], uvScale: [1 / 3, 1], meters: [3, 1.7] });
      m.rotation.y = -Math.PI / 2;
      m.position.set(7.84, 2.05, z);
      const f = new THREE.Mesh(frame, darkMat);
      f.position.set(7.92, 2.05, z);
      scene.add(m, f);
    });
    finish(s, new THREE.Vector3(7.8, 2, -41.2));
    const bench = track(new THREE.BoxGeometry(0.5, 0.42, 2.3));
    for (const z of [-39.6, -43.4]) {
      const b = new THREE.Mesh(bench, darkMat);
      b.position.set(5.9, 0.21, z);
      scene.add(b);
    }

    const sq = addScreen(SQUARES, 5.5, 1.1, 1.5);
    const sqPlane = track(new THREE.PlaneGeometry(1.1, 1.1));
    const sqBox = track(new THREE.BoxGeometry(1.18, 1.18, 0.12));
    const ped = track(new THREE.BoxGeometry(1.0, 0.3, 0.5));
    const spots: [number, number][] = [[-3.6, -38.6], [-4.6, -40.2], [-4.9, -42], [-4.5, -43.8], [-3.5, -45.2]];
    spots.forEach(([x, z], i) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.lookAt(1.5, 0, -41.5);
      const m = sq.addPart(sqPlane, { uvOff: [i / 5, 0], uvScale: [0.2, 1], meters: [1.1, 1.1] });
      m.position.set(0, 0.88, 0.065);
      const b = new THREE.Mesh(sqBox, darkMat);
      b.position.set(0, 0.88, 0);
      const p = new THREE.Mesh(ped, darkMat);
      p.position.set(0, 0.15, 0);
      g.add(m, b, p);
      scene.add(g);
    });
    finish(sq, new THREE.Vector3(-4.4, 0.9, -42));
  }

  // V. Pantalla curva (radio 7 m, 110°) con banca redonda al centro.
  {
    const theta = (110 * Math.PI) / 180;
    const s = addScreen(PANORAMA, 7 * theta, 3.4, 2);
    const geo = track(new THREE.CylinderGeometry(7, 7, 3.4, 96, 1, true, Math.PI - theta / 2, theta));
    const m = s.addPart(geo, { flipX: true, meters: [7 * theta, 3.4] });
    (m.material as THREE.ShaderMaterial).side = THREE.BackSide;
    m.position.set(0, 2.15, -53);
    scene.add(m);
    const shellMat = track(darkMat.clone());
    shellMat.side = THREE.DoubleSide;
    const shell = new THREE.Mesh(track(new THREE.CylinderGeometry(7.12, 7.12, 3.6, 96, 1, true, Math.PI - theta / 2 - 0.02, theta + 0.04)), shellMat);
    shell.position.set(0, 2.15, -53);
    scene.add(shell);
    const bench = new THREE.Mesh(track(new THREE.CylinderGeometry(1.35, 1.35, 0.42, 48)), darkMat);
    bench.position.set(0, 0.21, -53.4);
    scene.add(bench);
    finish(s, new THREE.Vector3(0, 2, -59));
  }

  // Luz que cada instalación echa al cuarto (toma el color de lo que muestra).
  const lightSpots: [Screen, THREE.Vector3, number][] = [
    [screens[0], new THREE.Vector3(0, 2.2, 2.2), 26],
    [screens[2], new THREE.Vector3(0, 2, -12.5), 10],
    [screens[6], new THREE.Vector3(0, 1.8, -24.8), 16],
    [screens[7], new THREE.Vector3(0, 1.8, -34.2), 12],
    [screens[8], new THREE.Vector3(6.2, 2.0, -41.2), 12],
    [screens[9], new THREE.Vector3(-2.6, 1.0, -42), 6],
    [screens[10], new THREE.Vector3(0, 2.2, -55.5), 22],
  ];
  const lights: { light: THREE.PointLight; screen: Screen; power: number }[] = [];
  for (const [s, pos, power] of lightSpots) {
    const light = new THREE.PointLight(0xffffff, 0, 16, 1.6);
    light.position.copy(pos);
    scene.add(light);
    lights.push({ light, screen: s, power });
  }

  // ===== Siluetas: recortes negros que siempre miran a la cámara (como personas a contraluz) =====
  const loader = new THREE.TextureLoader();
  const sils: THREE.Mesh[] = [];
  const silGeoCache = new Map<string, THREE.PlaneGeometry>();
  await Promise.all(
    SILHOUETTES.map(async (s) => {
      const tex = await loader.loadAsync(`/media/recortes/${s.name}.webp`).catch(() => null);
      if (!tex) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      track(tex);
      const img = tex.image as HTMLImageElement;
      const w = (img.width / img.height) * s.h;
      const key = `${s.name}${s.h}`;
      let geo = silGeoCache.get(key);
      if (!geo) {
        geo = track(new THREE.PlaneGeometry(w, s.h));
        geo.translate(0, s.h / 2, 0);
        silGeoCache.set(key, geo);
      }
      const mat = track(new THREE.MeshBasicMaterial({ map: tex, color: 0x050505, alphaTest: 0.5 }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(s.x, 0, s.z);
      scene.add(mesh);
      sils.push(mesh);
    }),
  );

  // ===== Postproceso (con antialiasing MSAA: bordes limpios, sin "pixeleado") =====
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: lowPower ? 2 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), lowPower ? 0.18 : 0.24, 0.6, 0.86);
  composer.addPass(bloom);
  const grade = new ShaderPass(GRADE);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // ===== Recorrido =====
  let portraitK = 1;
  let goal = 0;
  let smooth = 0;
  let vel = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const la = new THREE.Vector3();
  const lb = new THREE.Vector3();
  let maxK = 1.6;
  let dip = 0;

  /** Encuadre para un avance q (0–1). Devuelve la sala que se ve. */
  function pathAt(q: number) {
    const segs = STOPS.length - 1;
    const sq = Math.min(segs - 1e-6, Math.max(0, q * segs));
    const i = Math.floor(sq);
    const f = sq - i;
    const a = STOPS[i];
    const b = STOPS[i + 1];
    pa.set(...a.pos);
    pb.set(...b.pos);
    la.set(...a.look);
    lb.set(...b.look);
    if (a.room === b.room && !b.cut) {
      // Misma sala: la cámara se desliza al siguiente encuadre.
      const e = glide(f);
      pos.lerpVectors(pa, pb, e);
      look.lerpVectors(la, lb, e);
      maxK = (a.pk ?? 1.6) + ((b.pk ?? 1.6) - (a.pk ?? 1.6)) * e;
      dip = 0;
      return a.room;
    }
    // Otra sala: se acerca un poco, funde a negro, y aparece en la nueva sala terminando de acercarse.
    dip = opts.reduced ? 0 : 1 - smoothstep(0.04, 0.2, Math.abs(f - 0.5));
    if (f < 0.5) {
      const k = glide(f * 2);
      tmp.subVectors(la, pa).normalize();
      pos.copy(pa).addScaledVector(tmp, k * 1.6);
      look.copy(la);
      maxK = a.pk ?? 1.6;
      return a.room;
    }
    const k = glide((1 - f) * 2);
    tmp.subVectors(lb, pb).normalize();
    pos.copy(pb).addScaledVector(tmp, -k * 1.6);
    look.copy(lb);
    maxK = b.pk ?? 1.6;
    return b.room;
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    target.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    const portrait = camera.aspect < 0.85;
    camera.fov = portrait ? 66 : camera.aspect < 1.3 ? 56 : 48;
    portraitK = portrait ? 1 + Math.min(1, (0.85 - camera.aspect) / 0.4) * 0.6 : 1;
    camera.updateProjectionMatrix();
    grade.uniforms['aspect'].value = camera.aspect;
  }
  resize();

  // ===== Carga: primero lo que se ve al entrar, luego el resto =====
  await Promise.all(
    ['400 40px "Instrument Serif"', 'italic 400 40px "Instrument Serif"', '500 20px "Instrument Sans Variable"', '400 40px "Mrs Saint Delafield"', '400 20px "Hanken Grotesk Variable"'].map((f) =>
      document.fonts.load(f).catch(() => null),
    ),
  );
  let loaded = 0;
  const t0 = performance.now();
  let lastT = t0;
  const clock = {
    getElapsedTime: () => (performance.now() - t0) / 1000,
    getDelta: () => {
      const n = performance.now();
      const d = (n - lastT) / 1000;
      lastT = n;
      return d;
    },
  };
  const startScreen = async (s: Screen) => {
    await s.start(clock.getElapsedTime());
    s.primeColor();
    loaded++;
    hooks.onLoad(loaded / screens.length);
  };
  await Promise.all([startScreen(screens[0]), startScreen(screens[1]), startScreen(screens[2])]);
  hooks.onReady();
  (async () => {
    for (const s of screens.slice(3)) await startScreen(s);
  })();

  // ===== Interacción =====
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: Screen | null = null;
  const hit = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const found = ray.intersectObjects(screenMeshes, false)[0];
    if (!found || found.distance > 26 || !found.uv) return null;
    const mesh = found.object as THREE.Mesh;
    const screen = mesh.userData['screen'] as Screen;
    if (!screen.ready) return null;
    const [ox] = mesh.userData['uvOff'] as [number, number];
    const [sx] = mesh.userData['uvScale'] as [number, number];
    const u = mesh.userData['flipX'] ? 1 - found.uv.x : found.uv.x;
    const photo = screen.photoAt(ox + u * sx);
    return { screen, photo };
  };

  let visible = true;
  let raf = 0;
  let lastRoom = -1;
  let wasEnd = false;
  let pendingPointer: { x: number; y: number } | null = null;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.05, clock.getDelta());
    const now = clock.getElapsedTime();
    // Resorte amortiguado: sigue al scroll sin tirones ni arranques bruscos.
    if (opts.reduced) smooth = goal;
    else {
      const k = 18;
      vel += ((goal - smooth) * k - vel * 2 * Math.sqrt(k)) * dt;
      smooth += vel * dt;
    }
    const room = pathAt(smooth);
    if (room !== lastRoom) {
      lastRoom = room;
      hooks.onRoom(room);
    }
    const atEnd = smooth > 0.965;
    if (atEnd !== wasEnd) {
      wasEnd = atEnd;
      hooks.onEnd(atEnd);
    }
    // En vertical la cámara se aleja de lo que mira para que quepa la pantalla.
    if (portraitK !== 1) {
      tmp.copy(pos).sub(look).multiplyScalar(Math.min(portraitK, maxK));
      pos.copy(look).add(tmp);
      pos.x = Math.max(-7.2, Math.min(7.2, pos.x));
      pos.z = Math.min(18.4, pos.z);
    }
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2.5);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2.5);
    const bob = opts.reduced ? 0 : Math.sin(now * 0.5) * 0.008;
    camera.position.set(pos.x, pos.y + bob, pos.z);
    // Mirar alrededor con el cursor (girar un poco la cabeza).
    tmp.subVectors(look, pos);
    const right = new THREE.Vector3().crossVectors(tmp, camera.up).normalize();
    look.addScaledVector(right, mouse.x * tmp.length() * 0.06).y += mouse.y * tmp.length() * 0.035;
    camera.lookAt(look);

    for (const s of screens) {
      const active = s.center.distanceTo(camera.position) < 30;
      s.update(now, dt, active, opts.reduced);
    }
    for (const l of lights) {
      const c = l.screen.color;
      l.light.color.copy(c);
      const lum = 0.3 + (c.r + c.g + c.b) / 3;
      l.light.intensity = l.screen.ready ? l.power * lum * 0.55 : 0;
    }
    for (const m of sils) m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
    (reflMat.uniforms['camPos'].value as THREE.Vector3).copy(camera.position);
    grade.uniforms['dip'].value = dip;
    for (const g of gobos) g.rotation.z += (g.userData['spin'] as number) * dt;

    if (pendingPointer) {
      const h = hit(pendingPointer.x, pendingPointer.y);
      pendingPointer = null;
      const next = h?.photo ? h.screen : null;
      if (next !== hovered) {
        hovered?.setHover(false);
        next?.setHover(true);
        hovered = next;
        hooks.onHover(!!next);
      }
    }
    composer.render(dt);
  };
  raf = requestAnimationFrame(frame);

  return {
    setProgress(q) {
      goal = Math.max(0, Math.min(1, q));
    },
    pointer(x, y, fine) {
      if (fine) {
        const r = canvas.getBoundingClientRect();
        mouse.tx = ((x - r.left) / r.width - 0.5) * 2;
        mouse.ty = -((y - r.top) / r.height - 0.5) * 2;
      }
      pendingPointer = { x, y };
    },
    leave() {
      mouse.tx = mouse.ty = 0;
      hovered?.setHover(false);
      hovered = null;
      hooks.onHover(false);
    },
    click(x, y) {
      const h = hit(x, y);
      if (!h?.photo) return;
      const list = programPhotos(h.screen.program);
      hooks.onPick(list, Math.max(0, list.indexOf(h.photo)));
    },
    resize,
    setVisible(v) {
      visible = v;
      if (v) clock.getDelta();
    },
    destroy() {
      cancelAnimationFrame(raf);
      for (const s of screens) s.dispose();
      for (const d of disposables) d.dispose();
      reflector.dispose();
      composer.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
}
