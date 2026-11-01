import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import type * as T from 'three';
import { prefersReducedMotion } from '../core/motion';

/**
 * Cámara telemétrica en 3D colgando de su correa (Three.js, modelo hecho con piezas: cuerpo forrado, placas de
 * metal, lente con anillos estriados y cristal con tratamiento, diales y argollas).
 *
 * Física (Verlet, sin motor externo):
 * - La correa son dos tiras de puntos que bajan de un gancho a cada argolla de la cámara.
 * - La cámara es un cuerpo rígido hecho de 4 partículas unidas entre sí (argolla izq., argolla der., centro y
 *   punta del lente). El lente pesa más, así que cuelga un poco "de nariz", como una cámara de verdad.
 * - Se agarra y se arrastra con el mouse o el dedo; al soltarla se mece. Si el cursor la roza, la empuja con la
 *   velocidad que trae.
 */
@Component({
  selector: 'app-hanging-camera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', 'aria-label': 'Cámara telemétrica plateada colgando de su correa. Se puede agarrar y mecer.' },
  template: `
    <canvas
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up($event)"
      (pointercancel)="up($event)"
      (pointerleave)="leave()"
      [class.grab]="over()"
      [class.grabbing]="grabbing()"
    ></canvas>
  `,
  styles: `
    :host { position: relative; display: block; }
    canvas { display: block; width: 100%; height: 100%; touch-action: pan-y; }
    canvas.grab { cursor: grab; }
    canvas.grabbing { cursor: grabbing; }
  `,
})
export class HangingCamera {
  protected readonly over = signal(false);
  protected readonly grabbing = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private api?: {
    pick(x: number, y: number): boolean;
    grab(x: number, y: number): boolean;
    drag(x: number, y: number): void;
    release(): void;
    brush(x: number, y: number, dx: number, dy: number): void;
  };
  private last: { x: number; y: number; t: number } | null = null;
  private dragging = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      const THREE = await import('three');
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
      const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js');
      const stop = build(THREE, RoomEnvironment, RoundedBoxGeometry, this.host.querySelector('canvas')!, this.host, (api) => (this.api = api));
      destroyRef.onDestroy(stop);
    });
  }

  private local(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
  }

  protected down(e: PointerEvent) {
    if (!this.api || e.button > 0) return;
    const p = this.local(e);
    if (!this.api.grab(p.x, p.y)) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.dragging = true;
    this.grabbing.set(true);
    document.documentElement.classList.add('grabbing');
  }

  protected move(e: PointerEvent) {
    if (!this.api) return;
    const p = this.local(e);
    const now = performance.now();
    if (this.dragging) this.api.drag(p.x, p.y);
    else {
      const hit = this.api.pick(p.x, p.y);
      if (hit !== this.over()) this.over.set(hit);
      // El cursor la roza: le pasa su velocidad.
      if (hit && this.last && e.pointerType === 'mouse') {
        const dt = Math.max(8, now - this.last.t);
        this.api.brush(p.x, p.y, (p.x - this.last.x) / dt, (p.y - this.last.y) / dt);
      }
    }
    this.last = { x: p.x, y: p.y, t: now };
  }

  protected up(e: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;
    this.grabbing.set(false);
    document.documentElement.classList.remove('grabbing');
    this.api?.release();
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  protected leave() {
    this.last = null;
    if (!this.dragging) this.over.set(false);
  }
}

type Three = typeof import('three');

function build(
  THREE: Three,
  RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment,
  RoundedBoxGeometry: typeof import('three/examples/jsm/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry,
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  expose: (api: NonNullable<HangingCamera['api']>) => void,
) {
  const V = THREE.Vector3;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.9;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 11.5);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xfff6ee, 2.4);
  key.position.set(-3, 4, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 8;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8d4ff, 1.4);
  rim.position.set(4, 1, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // Pared invisible que solo recibe la sombra (da la sensación de que cuelga frente a la pared).
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.11 }));
  wall.position.z = -1.1;
  wall.receiveShadow = true;
  scene.add(wall);

  const disposables: { dispose(): void }[] = [env, pmrem, renderer];
  const track = <D extends { dispose(): void }>(d: D) => (disposables.push(d), d);

  // ===== Texturas hechas en canvas =====
  const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, color = false) => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d')!);
    const t = track(new THREE.CanvasTexture(cv));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  // Piel sintética granulada.
  const leather = canvasTex(512, 512, (c) => {
    c.fillStyle = '#808080';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14000; i++) {
      const g = 100 + Math.random() * 70;
      c.fillStyle = `rgb(${g},${g},${g})`;
      c.beginPath();
      c.arc(Math.random() * 512, Math.random() * 512, Math.random() * 2.4 + 0.6, 0, 6.28);
      c.fill();
    }
  });
  leather.repeat.set(2, 2);
  // Estrías de los anillos del lente y los diales.
  const knurl = canvasTex(512, 16, (c) => {
    for (let x = 0; x < 512; x += 8) {
      c.fillStyle = '#fff';
      c.fillRect(x, 0, 4, 16);
      c.fillStyle = '#222';
      c.fillRect(x + 4, 0, 4, 16);
    }
  });
  // Metal cepillado.
  const brushed = canvasTex(512, 512, (c) => {
    c.fillStyle = '#888';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1600; i++) {
      const g = 110 + Math.random() * 60;
      c.fillStyle = `rgba(${g},${g},${g},0.5)`;
      c.fillRect(0, Math.random() * 512, 512, Math.random() * 1.4);
    }
  });
  // Tejido de la correa con costura en las orillas y la marca tejida.
  const strapTex = canvasTex(
    128,
    1024,
    (c) => {
      c.fillStyle = '#16181f';
      c.fillRect(0, 0, 128, 1024);
      for (let y = 0; y < 1024; y += 4) {
        c.fillStyle = y % 8 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)';
        c.fillRect(0, y, 128, 2);
      }
      c.strokeStyle = 'rgba(226,167,160,0.7)';
      c.setLineDash([10, 8]);
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(14, 0);
      c.lineTo(14, 1024);
      c.moveTo(114, 0);
      c.lineTo(114, 1024);
      c.stroke();
      c.save();
      c.translate(64, 512);
      c.rotate(-Math.PI / 2);
      c.fillStyle = 'rgba(233,236,243,0.55)';
      c.font = '600 40px "Instrument Sans Variable", sans-serif';
      c.textAlign = 'center';
      (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '18px';
      c.fillText('ASTOR', 0, 14);
      c.restore();
    },
    true,
  );
  strapTex.repeat.set(1, 1);

  // ===== Materiales =====
  const silver = track(new THREE.MeshStandardMaterial({ color: 0xd9dce2, metalness: 1, roughness: 0.32, bumpMap: brushed, bumpScale: 0.15 }));
  const blackMetal = track(new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.7, roughness: 0.4 }));
  const leatherMat = track(new THREE.MeshStandardMaterial({ color: 0x17181c, metalness: 0, roughness: 0.78, bumpMap: leather, bumpScale: 1.2 }));
  const knurlMat = track(new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.6, roughness: 0.45, bumpMap: knurl, bumpScale: 1.5 }));
  knurl.repeat.set(6, 1);
  const knurlSilver = track(new THREE.MeshStandardMaterial({ color: 0xcfd2d8, metalness: 1, roughness: 0.3, bumpMap: knurl, bumpScale: 1.2 }));
  const glass = track(
    new THREE.MeshPhysicalMaterial({ color: 0x05070c, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 520, envMapIntensity: 1.6 }),
  );
  const windowGlass = track(new THREE.MeshPhysicalMaterial({ color: 0x0b0e16, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.4 }));
  const strapMat = track(new THREE.MeshStandardMaterial({ map: strapTex, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }));
  const leatherEnd = track(new THREE.MeshStandardMaterial({ color: 0x2b1d18, roughness: 0.6, side: THREE.DoubleSide }));

  // ===== Modelo de la cámara (unidades: el cuerpo mide 2.6 de ancho) =====
  const cam = new THREE.Group();
  const add = (geo: T.BufferGeometry, mat: T.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(track(geo), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    cam.add(m);
    return m;
  };
  const BW = 2.6;
  const BH = 1.5;
  const BD = 0.7;
  add(new RoundedBoxGeometry(BW, BH * 0.62, BD, 6, 0.12), leatherMat, 0, -0.1, 0);
  add(new RoundedBoxGeometry(BW + 0.02, BH * 0.3, BD + 0.02, 6, 0.12), silver, 0, BH * 0.33, 0);
  add(new RoundedBoxGeometry(BW + 0.02, 0.1, BD + 0.02, 4, 0.04), silver, 0, -BH * 0.42, 0);
  // Agarre derecho.
  add(new RoundedBoxGeometry(0.42, BH * 0.6, 0.18, 4, 0.08), leatherMat, BW * 0.36, -0.08, BD / 2 + 0.05);
  // Visor óptico (ventana al frente, arriba a la izquierda) y ventanita del telémetro.
  add(new RoundedBoxGeometry(0.5, 0.3, 0.06, 4, 0.03), blackMetal, -BW * 0.33, BH * 0.33, BD / 2 + 0.01);
  add(new RoundedBoxGeometry(0.42, 0.22, 0.04, 4, 0.03), windowGlass, -BW * 0.33, BH * 0.33, BD / 2 + 0.04);
  add(new THREE.BoxGeometry(0.12, 0.12, 0.02), windowGlass, -BW * 0.08, BH * 0.36, BD / 2 + 0.02);
  // Lente: montura, barril estriado, anillo de enfoque, frente plateado y cristal con tratamiento.
  const L = (r: number, len: number, mat: T.Material, z: number, seg = 64) => add(new THREE.CylinderGeometry(r, r, len, seg), mat, 0.12, -0.12, z, Math.PI / 2);
  L(0.56, 0.12, silver, BD / 2 + 0.06);
  L(0.5, 0.26, knurlMat, BD / 2 + 0.25);
  L(0.52, 0.06, silver, BD / 2 + 0.41);
  L(0.47, 0.22, blackMetal, BD / 2 + 0.55);
  L(0.5, 0.06, knurlSilver, BD / 2 + 0.69);
  const front = add(new THREE.TorusGeometry(0.43, 0.05, 16, 64), silver, 0.12, -0.12, BD / 2 + 0.72);
  front.rotation.set(0, 0, 0);
  const lensGlass = add(new THREE.SphereGeometry(0.42, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.28), glass, 0.12, -0.12, BD / 2 + 0.58, Math.PI / 2);
  lensGlass.scale.set(1, 0.7, 1);
  add(new THREE.CircleGeometry(0.3, 48), track(new THREE.MeshStandardMaterial({ color: 0x020305, roughness: 0.2 })), 0.12, -0.12, BD / 2 + 0.6);
  // Diales de arriba: velocidad, compensación, disparador y zapata.
  const top = BH * 0.48;
  add(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 48), knurlSilver, BW * 0.18, top + 0.08, 0.02);
  add(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 48), knurlSilver, BW * 0.38, top + 0.07, -0.05);
  add(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 32), silver, BW * 0.3, top + 0.18, 0.18);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), blackMetal, BW * 0.3, top + 0.25, 0.18);
  add(new RoundedBoxGeometry(0.55, 0.06, 0.4, 2, 0.02), blackMetal, -0.15, top + 0.03, 0);
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 40), knurlSilver, -BW * 0.36, top + 0.05, -0.08);
  // Argollas para la correa a los lados.
  const LUG_X = BW / 2 + 0.06;
  const LUG_Y = BH * 0.22;
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 20), silver, s * (BW / 2 + 0.01), LUG_Y, 0, 0, 0, Math.PI / 2);
    add(new THREE.TorusGeometry(0.11, 0.022, 12, 32), silver, s * LUG_X, LUG_Y + 0.08, 0, 0, Math.PI / 2, 0);
  }
  scene.add(cam);

  // ===== Física =====
  type P = { p: T.Vector3; o: T.Vector3; w: number };
  const HOOK = new V(0, 2.2, 0);
  // Partículas del cuerpo rígido en coordenadas de la cámara.
  const LOCAL = {
    L: new V(-LUG_X, LUG_Y + 0.08, 0),
    R: new V(LUG_X, LUG_Y + 0.08, 0),
    C: new V(0, -0.15, 0),
    F: new V(0.12, -0.12, BD / 2 + 0.7),
  };
  const start = new V(0, HOOK.y - 3.3, 0);
  const body: Record<keyof typeof LOCAL, P> = {
    L: { p: start.clone().add(LOCAL.L), o: new V(), w: 2 },
    R: { p: start.clone().add(LOCAL.R), o: new V(), w: 2 },
    C: { p: start.clone().add(LOCAL.C), o: new V(), w: 0.6 },
    F: { p: start.clone().add(LOCAL.F), o: new V(), w: 1.1 },
  };
  for (const k of Object.keys(body) as (keyof typeof LOCAL)[]) body[k].o.copy(body[k].p);
  const pairs: [P, P, number][] = [];
  const keys = Object.keys(body) as (keyof typeof LOCAL)[];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) pairs.push([body[keys[i]], body[keys[j]], LOCAL[keys[i]].distanceTo(LOCAL[keys[j]])]);

  const SEG = 16;
  const STRAP_LEN = 3.6;
  const makeRope = (end: P) =>
    Array.from({ length: SEG + 1 }, (_, i) => {
      const t = i / SEG;
      const p = HOOK.clone().lerp(end.p, t);
      return { p, o: p.clone(), w: i === 0 ? 0 : 1 } as P;
    });
  const ropes = [makeRope(body.L), makeRope(body.R)];
  // El último punto de cada tira ES la argolla de la cámara.
  ropes[0][SEG] = body.L;
  ropes[1][SEG] = body.R;
  const segLen = STRAP_LEN / SEG;

  const gravity = new V(0, -9.8, 0);
  let grab: { target: T.Vector3; local: T.Vector3; plane: T.Plane } | null = null;
  const tmp = new V();
  const tmp2 = new V();

  const solve = (a: P, b: P, rest: number, stiff = 1) => {
    tmp.subVectors(b.p, a.p);
    const d = tmp.length() || 1e-6;
    const wsum = a.w + b.w;
    if (!wsum) return;
    const diff = ((d - rest) / d) * stiff;
    a.p.addScaledVector(tmp, (diff * a.w) / wsum);
    b.p.addScaledVector(tmp, (-diff * b.w) / wsum);
  };
  // La correa no se estira, pero sí se puede doblar (solo limita la distancia máxima).
  const solveRope = (a: P, b: P, rest: number) => {
    tmp.subVectors(b.p, a.p);
    const d = tmp.length();
    if (d <= rest) return;
    solve(a, b, rest);
  };

  const all = [...ropes[0].slice(1), ...ropes[1].slice(1), body.C, body.F];
  const step = (dt: number) => {
    const damp = 0.992;
    for (const q of all) {
      if (!q.w) continue;
      tmp.subVectors(q.p, q.o).multiplyScalar(damp);
      q.o.copy(q.p);
      q.p.add(tmp).addScaledVector(gravity, dt * dt);
    }
    for (let it = 0; it < 14; it++) {
      for (const rope of ropes) for (let i = 0; i < SEG; i++) solveRope(rope[i], rope[i + 1], segLen);
      for (const [a, b, r] of pairs) solve(a, b, r);
      if (grab) {
        // El punto agarrado sigue al cursor (como si lo jalaras con la mano).
        const pt = worldOf(grab.local, tmp2);
        tmp.subVectors(grab.target, pt).multiplyScalar(0.35);
        for (const k of keys) body[k].p.add(tmp);
      }
      // Las dos tiras no se cruzan entre sí detrás de la cámara.
      for (let i = 1; i < SEG; i++) {
        const a = ropes[0][i];
        const b = ropes[1][i];
        if (a.p.x > b.p.x - 0.05) {
          const mid = (a.p.x + b.p.x) / 2;
          a.p.x = mid - 0.025;
          b.p.x = mid + 0.025;
        }
      }
    }
  };

  // Orientación de la cámara a partir de sus partículas.
  const basis = new THREE.Matrix4();
  const xAxis = new V();
  const yAxis = new V();
  const zAxis = new V();
  const center = new V();
  const orient = () => {
    xAxis.subVectors(body.R.p, body.L.p).normalize();
    tmp.subVectors(body.F.p, body.C.p);
    zAxis.copy(tmp).addScaledVector(xAxis, -tmp.dot(xAxis)).normalize();
    yAxis.crossVectors(zAxis, xAxis).normalize();
    basis.makeBasis(xAxis, yAxis, zAxis);
    cam.quaternion.setFromRotationMatrix(basis);
    // Posición: el centro local (0,0,0) a partir de la partícula C.
    center.copy(LOCAL.C).applyQuaternion(cam.quaternion);
    cam.position.subVectors(body.C.p, center);
  };
  const worldOf = (local: T.Vector3, out: T.Vector3) => out.copy(local).applyQuaternion(cam.quaternion).add(cam.position);

  // ===== Correa (cinta plana) =====
  const strapW = 0.2;
  const strapGeo = (n: number) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 2 * 3), 3));
    const uv = new Float32Array((n + 1) * 2 * 2);
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      uv.set([0, i / n, 1, i / n], i * 4);
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    return track(g);
  };
  const strapMeshes = ropes.map(() => {
    const m = new THREE.Mesh(strapGeo(SEG), strapMat);
    m.castShadow = true;
    m.frustumCulled = false;
    scene.add(m);
    return m;
  });
  // Puntas de piel cosidas cerca de las argollas.
  const ends = ropes.map(() => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(0.22, 0.42, 0.04)), leatherEnd);
    m.castShadow = true;
    scene.add(m);
    return m;
  });
  // Gancho y riel.
  const rail = new THREE.Mesh(track(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 24)), silver);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, HOOK.y + 0.35, -0.2);
  rail.castShadow = true;
  scene.add(rail);
  const hook = new THREE.Mesh(track(new THREE.TorusGeometry(0.16, 0.035, 12, 32, Math.PI * 1.3)), silver);
  hook.position.set(0, HOOK.y + 0.14, -0.08);
  hook.rotation.set(0, Math.PI / 2, Math.PI * 0.85);
  scene.add(hook);

  const side = new V();
  const tangent = new V();
  const fwd = new V();
  const up = new V(0, 0, 1);
  const updateStrap = () => {
    ropes.forEach((rope, r) => {
      const pos = strapMeshes[r].geometry.getAttribute('position') as T.BufferAttribute;
      for (let i = 0; i <= SEG; i++) {
        const a = rope[Math.max(0, i - 1)].p;
        const b = rope[Math.min(SEG, i + 1)].p;
        tangent.subVectors(b, a).normalize();
        // Cerca del gancho la cinta mira al frente; cerca de la argolla gira con la cámara.
        const t = i / SEG;
        fwd.copy(up).lerp(zAxis, t * t).normalize();
        side.crossVectors(tangent, fwd).normalize().multiplyScalar(strapW / 2);
        const p = rope[i].p;
        pos.setXYZ(i * 2, p.x - side.x, p.y - side.y, p.z - side.z);
        pos.setXYZ(i * 2 + 1, p.x + side.x, p.y + side.y, p.z + side.z);
      }
      pos.needsUpdate = true;
      strapMeshes[r].geometry.computeVertexNormals();
      strapMeshes[r].geometry.computeBoundingSphere();
      // Punta de piel: entre los dos últimos puntos.
      const a = rope[SEG - 2].p;
      const b = rope[SEG].p;
      ends[r].position.lerpVectors(a, b, 0.6);
      tangent.subVectors(b, a).normalize();
      ends[r].quaternion.setFromUnitVectors(new V(0, 1, 0), tangent);
      ends[r].quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), Math.atan2(zAxis.x, zAxis.z)));
    });
  };

  // ===== Puntero =====
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitCam = (x: number, y: number) => {
    ndc.set(x, y);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(cam, true)[0];
  };
  expose({
    pick: (x, y) => !!hitCam(x, y),
    grab: (x, y) => {
      const hit = hitCam(x, y);
      if (!hit) return false;
      const local = cam.worldToLocal(hit.point.clone());
      // worldToLocal incluye la escala del grupo (1): sirve como punto local del cuerpo.
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new V(0, 0, 1), hit.point);
      grab = { target: hit.point.clone(), local, plane };
      wake();
      return true;
    },
    drag: (x, y) => {
      if (!grab) return;
      ndc.set(x, y);
      ray.setFromCamera(ndc, camera);
      ray.ray.intersectPlane(grab.plane, grab.target);
      wake();
    },
    release: () => {
      grab = null;
      wake();
    },
    brush: (x, y, dx, dy) => {
      const hit = hitCam(x, y);
      if (!hit || prefersReducedMotion()) return;
      // Empujón proporcional a la velocidad del cursor (en el plano de la pantalla), más fuerte cerca del golpe.
      const k = 0.9;
      for (const q of keys) {
        const near = 1 / (1 + body[q].p.distanceTo(hit.point));
        body[q].o.x -= dx * k * near;
        body[q].o.y -= dy * k * near * 0.6;
        body[q].o.z += Math.abs(dx) * 0.25 * near * (q === 'F' ? 1 : -1);
      }
      wake();
    },
  });

  // ===== Bucle =====
  const resize = () => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // En pantallas angostas se aleja la cámara para que quepa completa.
    camera.position.z = r.width / r.height < 0.8 ? 14 : 11.5;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // Un pequeño impulso inicial para que se vea que está colgando de verdad.
  for (const k of keys) body[k].o.x -= 0.03;
  for (let i = 0; i < 120; i++) step(1 / 120);
  for (const k of keys) body[k].o.x = body[k].p.x - 0.06;

  let raf = 0;
  let visible = true;
  let calm = 0;
  let acc = 0;
  let prev = performance.now();
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  });
  io.observe(host);
  function wake() {
    calm = 0;
    if (!raf && visible) {
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function frame(now: number) {
    raf = 0;
    if (!visible) return;
    acc += Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const h = 1 / 120;
    while (acc >= h) {
      step(h);
      acc -= h;
    }
    orient();
    updateStrap();
    renderer.render(scene, camera);
    // Cuando ya casi no se mueve, deja de dibujar hasta el próximo toque.
    let motion = 0;
    for (const k of keys) motion += body[k].p.distanceTo(body[k].o);
    calm = motion < 0.0004 && !grab ? calm + 1 : 0;
    if (calm < 90) raf = requestAnimationFrame(frame);
  }
  orient();
  updateStrap();
  wake();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    for (const d of disposables) d.dispose();
  };
}
