import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { CUBE_BACK, CUBE_FRONT, PANORAMA, Program, SQUARES, TOTEMS, TRIPTYCH, WELCOME, programPhotos } from './programs';
import { Screen } from './screen';

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

interface Key {
  pos: [number, number, number];
  look: [number, number, number];
  room: number;
  dwell: boolean;
  /** En pantallas verticales, cuánto se puede alejar la cámara de lo que mira (máximo). */
  pk?: number;
}

/** Recorrido: estaciones donde la cámara se detiene (dwell) y puntos de paso para rodear obstáculos. */
const KEYS: Key[] = [
  { pos: [0, 1.65, 15], look: [0, 2.3, 0], room: 0, dwell: true, pk: 1.2 },
  { pos: [0.6, 1.62, 7], look: [0, 2.35, 0], room: 0, dwell: true, pk: 1.6 },
  { pos: [6.4, 1.65, 0.6], look: [2.5, 2.0, -6], room: 1, dwell: false, pk: 1 },
  { pos: [4.7, 1.65, -4.3], look: [-0.8, 2.0, -9.6], room: 1, dwell: true, pk: 1.25 },
  { pos: [-0.3, 1.65, -11.2], look: [-1.0, 2.0, -18], room: 1, dwell: true, pk: 1.3 },
  { pos: [0.4, 1.65, -20.8], look: [0, 1.85, -29], room: 2, dwell: true, pk: 1.45 },
  { pos: [5.7, 1.65, -26.6], look: [0.5, 1.85, -29.5], room: 2, dwell: false, pk: 1 },
  { pos: [2.4, 1.65, -37.4], look: [0, 1.85, -29.6], room: 2, dwell: true, pk: 1.15 },
  { pos: [0.6, 1.62, -40.2], look: [7.9, 2.0, -41.2], room: 3, dwell: true, pk: 1.12 },
  { pos: [1.2, 1.5, -40.6], look: [-4.2, 0.85, -42], room: 3, dwell: true, pk: 1.5 },
  { pos: [0, 1.65, -44.6], look: [0, 2.15, -59], room: 4, dwell: true, pk: 1 },
  { pos: [0.3, 1.62, -50.2], look: [-3.6, 2.0, -58.4], room: 4, dwell: true, pk: 1 },
  { pos: [0, 1.62, -51.4], look: [0, 2.25, -60], room: 4, dwell: true, pk: 1 },
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

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Ruido suave repetible para el concreto del piso y la distorsión del reflejo. */
function noiseTexture(size = 256) {
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
      let v = 0;
      let amp = 0.5;
      let n = 8;
      for (let o = 0; o < 4; o++) {
        v += value((x / size) * n, (y / size) * n, n) * amp;
        amp *= 0.5;
        n *= 2;
      }
      const w = value((x / size) * 32 + 7, (y / size) * 32 + 3, 32);
      const i = (y * size + x) * 4;
      data[i] = Math.round(v * 255);
      data[i + 1] = Math.round(w * 255);
      data[i + 2] = Math.round(((v + w) / 2) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// Reflejo del piso pulido: borroso en vertical (como el concreto encerado), distorsionado por el ruido y con un halo
// amplio que hace de "luz" que las pantallas echan al piso. Se suma (blending aditivo) sobre el piso iluminado.
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
uniform sampler2D tNoise;
uniform float strength;
uniform vec3 camPos;
varying vec4 vUv;
varying vec3 vWorld;
void main() {
  vec3 nz = texture2D(tNoise, vWorld.xz * 0.035).rgb;
  vec2 uv = vUv.xy / vUv.w + (nz.rg - 0.5) * 0.007;
  vec3 sharp = vec3(0.0);
  float tot = 0.0;
  for (int i = -5; i <= 5; i++) {
    float w = 1.0 - abs(float(i)) / 6.0;
    sharp += texture2D(tDiffuse, uv + vec2(0.0, float(i) * 0.004)).rgb * w;
    tot += w;
  }
  sharp /= tot;
  vec3 wide = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float a = float(i) * 0.6283;
    wide += texture2D(tDiffuse, uv + vec2(cos(a) * 0.045, sin(a) * 0.07)).rgb;
  }
  wide /= 10.0;
  float dist = length(vWorld.xz - camPos.xz);
  float fade = 1.0 - smoothstep(10.0, 34.0, dist);
  float rough = mix(0.55, 1.0, nz.b);
  gl_FragColor = vec4((sharp * 0.3 * rough + wide * 0.2) * strength * fade * color, 1.0);
}
`;

// Último paso: viñeta, grano fino y negros apenas levantados (look de foto, no de render).
const GRADE = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, aspect: { value: 1 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float time; uniform float aspect; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = (vUv - 0.5) * vec2(aspect, 1.0);
      c *= mix(1.0, 0.42, smoothstep(0.35, 1.05, length(d)));
      c += (hash(vUv * 1000.0 + time) - 0.5) * 0.012;
      c = c * 0.97 + 0.006;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

export async function createGallery(canvas: HTMLCanvasElement, hooks: GalleryHooks, opts: { reduced: boolean }): Promise<GalleryApi> {
  const narrow = innerWidth < 760;
  const lowPower = narrow || (navigator.hardwareConcurrency ?? 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.6));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040405);
  scene.fog = new THREE.FogExp2(0x040405, 0.03);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 140);

  const noise = noiseTexture();
  const disposables: { dispose(): void }[] = [noise];
  const track = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);

  // ===== Sala =====
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const concrete = noise.clone();
  concrete.repeat.set(10, 30);
  concrete.needsUpdate = true;
  disposables.push(concrete);
  const floorMat = track(new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.62, metalness: 0, roughnessMap: concrete, bumpMap: concrete, bumpScale: 0.6 }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(40, 130)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -24);
  scene.add(floor);

  const reflector = new Reflector(track(new THREE.PlaneGeometry(40, 130)), {
    clipBias: 0.003,
    textureWidth: Math.round((innerWidth * renderer.getPixelRatio()) / (lowPower ? 3 : 2)),
    textureHeight: Math.round((innerHeight * renderer.getPixelRatio()) / (lowPower ? 3 : 2)),
    color: 0xffffff,
    shader: {
      name: 'AstorFloor',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        tNoise: { value: noise },
        strength: { value: 1 },
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

  const wallMat = track(new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.92 }));
  const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.55, metalness: 0.2 }));
  const wallGeo = track(new THREE.PlaneGeometry(130, 6.6));
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(wallGeo, wallMat);
    w.rotation.y = -side * (Math.PI / 2);
    w.position.set(side * 8, 3.3, -24);
    scene.add(w);
  }
  const endGeo = track(new THREE.PlaneGeometry(16, 6.6));
  const back = new THREE.Mesh(endGeo, wallMat);
  back.position.set(0, 3.3, -62);
  scene.add(back);
  const front = new THREE.Mesh(endGeo, wallMat);
  front.rotation.y = Math.PI;
  front.position.set(0, 3.3, 19);
  scene.add(front);
  const ceiling = new THREE.Mesh(track(new THREE.PlaneGeometry(16, 130)), track(new THREE.MeshBasicMaterial({ color: 0x050506 })));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.4, -24);
  scene.add(ceiling);

  // Lámparas lineales cortas en el techo (dan perspectiva al caminar) y lámparas colgantes cilíndricas.
  const stripMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.94, 0.9) }));
  const stripGeo = track(new THREE.BoxGeometry(0.035, 0.015, 1.5));
  const rows = [-5.2, -1.75, 1.75, 5.2];
  const strips = new THREE.InstancedMesh(stripGeo, stripMat, rows.length * 26);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (const x of rows) {
    for (let z = 17; z > -61; z -= 3) m4.makeTranslation(x, 6.35, z), strips.setMatrixAt(n++, m4);
  }
  strips.count = n;
  scene.add(strips);
  const lampGeo = track(new THREE.CylinderGeometry(0.11, 0.11, 0.36, 20));
  const lampGlow = track(new THREE.CircleGeometry(0.09, 20));
  const cordGeo = track(new THREE.CylinderGeometry(0.006, 0.006, 1, 4));
  const glowMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.9) }));
  const lamps: [number, number, number][] = [
    [-3.8, 5.0, 8], [-1.3, 4.7, 8.6], [1.3, 5.1, 8.2], [3.8, 4.8, 8.7],
    [-4.5, 4.9, -37.2], [-2.2, 5.2, -38.6], [2.4, 4.8, -46.2], [4.6, 5.0, -45],
  ];
  for (const [x, y, z] of lamps) {
    const l = new THREE.Mesh(lampGeo, darkMat);
    l.position.set(x, y, z);
    const g = new THREE.Mesh(lampGlow, glowMat);
    g.rotation.x = Math.PI / 2;
    g.position.set(x, y - 0.181, z);
    const cord = new THREE.Mesh(cordGeo, darkMat);
    cord.scale.y = 6.4 - y - 0.18;
    cord.position.set(x, (6.4 + y + 0.18) / 2, z);
    scene.add(l, g, cord);
  }

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

  // ===== Postproceso =====
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), lowPower ? 0.26 : 0.36, 0.55, 0.8);
  composer.addPass(bloom);
  const grade = new ShaderPass(GRADE);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // ===== Recorrido =====
  const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.look)), false, 'centripetal');
  const dwell = KEYS.map((k, i) => (k.dwell ? i : -1)).filter((i) => i >= 0);
  const tOf = (i: number) => i / (KEYS.length - 1);
  let portraitK = 1;
  let target = 0;
  let smooth = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function pathAt(q: number) {
    const segs = dwell.length - 1;
    const sq = Math.min(segs - 1e-6, Math.max(0, q * segs));
    const i = Math.floor(sq);
    const f = sq - i;
    // Se detiene un momento en cada estación: el inicio y el final de cada tramo no avanzan.
    const fe = smoother(Math.min(1, Math.max(0, (f - 0.14) / 0.72)));
    const t = tOf(dwell[i]) + (tOf(dwell[i + 1]) - tOf(dwell[i])) * fe;
    posCurve.getPoint(t, pos);
    lookCurve.getPoint(t, look);
    const a = KEYS[dwell[i]];
    const b = KEYS[dwell[i + 1]];
    maxK = (a.pk ?? 1.6) + ((b.pk ?? 1.6) - (a.pk ?? 1.6)) * fe;
    return (fe < 0.5 ? a : b).room;
  }
  let maxK = 1.6;

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
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
    ['400 40px "Bodoni Moda Variable"', 'italic 400 40px "Bodoni Moda Variable"', '500 20px "Oswald Variable"', '400 40px "Mrs Saint Delafield"', '400 20px "Hanken Grotesk Variable"'].map((f) =>
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
    smooth += (target - smooth) * Math.min(1, dt * (opts.reduced ? 10 : 3.2));
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
    const bob = opts.reduced ? 0 : Math.sin(now * 0.7) * 0.012;
    camera.position.set(pos.x, pos.y + bob, pos.z);
    // Mirar alrededor con el cursor (girar un poco la cabeza).
    tmp.subVectors(look, pos);
    const right = new THREE.Vector3().crossVectors(tmp, camera.up).normalize();
    look.addScaledVector(right, mouse.x * tmp.length() * 0.09).y += mouse.y * tmp.length() * 0.05;
    camera.lookAt(look);

    for (const s of screens) {
      const active = s.center.distanceTo(camera.position) < 30;
      s.update(now, dt, active, opts.reduced);
    }
    for (const l of lights) {
      const c = l.screen.color;
      l.light.color.copy(c);
      const lum = 0.3 + (c.r + c.g + c.b) / 3;
      l.light.intensity = l.screen.ready ? l.power * lum : 0;
    }
    for (const m of sils) m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
    (reflMat.uniforms['camPos'].value as THREE.Vector3).copy(camera.position);
    grade.uniforms['time'].value = now % 100;

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
      target = Math.max(0, Math.min(1, q));
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
      renderer.dispose();
    },
  };
}
