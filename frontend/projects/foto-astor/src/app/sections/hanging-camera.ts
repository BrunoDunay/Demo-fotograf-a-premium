import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import type * as T from 'three';
import { prefersReducedMotion } from '../core/motion';

/**
 * Cámara réflex profesional en 3D colgando de su correa (Three.js, modelo hecho con piezas):
 * - cuerpo negro mate de magnesio, empuñadura de hule con textura, pentaprisma con el logo y zapata;
 * - dial de modos grabado (P, Tv, Av, M…), disparador, dial principal, pantalla trasera y visor;
 * - zoom 24–70 f/2.8 con anillos de hule estriados, anillo de acento, parasol y cristal con tratamiento.
 *
 * Física (Verlet, sin motor externo):
 * - La correa son dos tiras de puntos que bajan de un gancho a cada argolla de la cámara.
 * - La cámara es un cuerpo rígido de 4 partículas (argollas, centro y punta del lente). El lente pesa, así que
 *   cuelga un poco "de nariz", y la correa la regresa despacio a su giro de reposo.
 * - No se agarra: el cursor es un objeto que la roza. El empujón sale de la velocidad del cursor y tiene tope,
 *   para que se meza y nunca salga volando.
 */
@Component({
  selector: 'app-hanging-camera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', 'aria-label': 'Cámara réflex negra con zoom profesional colgando de su correa. Se mece al pasarle el cursor.' },
  template: `<canvas (pointermove)="move($event)" (pointerdown)="poke($event)" (pointerleave)="leave()"></canvas>`,
  styles: `
    :host { position: relative; display: block; }
    canvas { display: block; width: 100%; height: 100%; touch-action: pan-y; }
  `,
})
export class HangingCamera {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private api?: { hover(x: number, y: number): void; leave(): void; poke(x: number, y: number): void };

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      const THREE = await import('three');
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
      const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js');
      await Promise.all(['600 80px "Instrument Sans Variable"', '400 80px "Instrument Serif"'].map((f) => document.fonts.load(f).catch(() => null)));
      const stop = build(THREE, RoomEnvironment, RoundedBoxGeometry, this.host.querySelector('canvas')!, this.host, (api) => (this.api = api));
      destroyRef.onDestroy(stop);
    });
  }

  private local(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
  }

  protected move(e: PointerEvent) {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const p = this.local(e);
    this.api?.hover(p.x, p.y);
  }

  // En pantallas táctiles, un toque le da un empujoncito.
  protected poke(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    const p = this.local(e);
    this.api?.poke(p.x, p.y);
  }

  protected leave() {
    this.api?.leave();
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
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  scene.environment = env;
  scene.environmentIntensity = 1.05;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 11.5);
  camera.lookAt(0, 0, 0);

  // Luz de estudio: principal suave arriba a la izquierda, contra fría a la derecha para recortar el negro.
  const key = new THREE.DirectionalLight(0xfff4ea, 2.6);
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
  const rim = new THREE.DirectionalLight(0xc9d6ff, 2.2);
  rim.position.set(5, 2, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe6e0, 0.6);
  fill.position.set(2, -3, 4);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  // Pared invisible que solo recibe la sombra (da la sensación de que cuelga frente a la pared).
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.13 }));
  wall.position.z = -1.6;
  wall.receiveShadow = true;
  scene.add(wall);

  const disposables: { dispose(): void }[] = [env, pmrem, renderer, wall.geometry, wall.material as T.Material];
  const track = <D extends { dispose(): void }>(d: D) => (disposables.push(d), d);

  // ===== Texturas hechas en canvas =====
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, color = false) => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d')!);
    const t = track(new THREE.CanvasTexture(cv));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso;
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const spacing = (c: CanvasRenderingContext2D, px: number) => ((c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`);
  // Grano fino del magnesio pintado.
  const grain = canvasTex(512, 512, (c) => {
    c.fillStyle = '#808080';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40000; i++) {
      const g = 110 + Math.random() * 40;
      c.fillStyle = `rgb(${g},${g},${g})`;
      c.fillRect(Math.random() * 512, Math.random() * 512, 1.4, 1.4);
    }
  });
  grain.repeat.set(3, 3);
  // Hule de la empuñadura: puntitos en relieve.
  const pebble = canvasTex(512, 512, (c) => {
    c.fillStyle = '#5a5a5a';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const g = 140 + Math.random() * 90;
      c.fillStyle = `rgb(${g},${g},${g})`;
      c.beginPath();
      c.arc(Math.random() * 512, Math.random() * 512, Math.random() * 2.6 + 1, 0, 6.28);
      c.fill();
    }
  });
  pebble.repeat.set(2, 3);
  // Estrías de los anillos de hule (a lo largo del eje del lente).
  const ribs = canvasTex(512, 8, (c) => {
    for (let x = 0; x < 512; x += 8) {
      const g = c.createLinearGradient(x, 0, x + 8, 0);
      g.addColorStop(0, '#202020');
      g.addColorStop(0.5, '#f0f0f0');
      g.addColorStop(1, '#202020');
      c.fillStyle = g;
      c.fillRect(x, 0, 8, 8);
    }
  });
  ribs.repeat.set(5, 1);
  // Estrías finas de los diales.
  const knurl = canvasTex(512, 8, (c) => {
    for (let x = 0; x < 512; x += 4) {
      c.fillStyle = x % 8 ? '#2a2a2a' : '#e0e0e0';
      c.fillRect(x, 0, 4, 8);
    }
  });
  knurl.repeat.set(4, 1);
  // Letras del lente impresas en el barril (se repiten para que se lean desde cualquier giro).
  const barrelText = canvasTex(
    2048,
    128,
    (c) => {
      c.fillStyle = '#0d0e11';
      c.fillRect(0, 0, 2048, 128);
      c.fillStyle = '#e9ebef';
      c.font = '600 54px "Instrument Sans Variable", sans-serif';
      spacing(c, 6);
      c.textBaseline = 'middle';
      for (let i = 0; i < 2; i++) {
        c.fillText('ASTOR  24–70 mm  1:2.8', 120 + i * 1024, 66);
        c.fillStyle = '#e2a7a0';
        c.fillText('◆', 790 + i * 1024, 66);
        c.fillStyle = '#e9ebef';
      }
    },
    true,
  );
  // Anillo frontal (dentro del parasol) con el nombre del lente.
  const nameRing = canvasTex(
    1024,
    1024,
    (c) => {
      c.fillStyle = '#0b0c10';
      c.fillRect(0, 0, 1024, 1024);
      c.translate(512, 512);
      c.fillStyle = '#c9ccd3';
      c.font = '600 30px "Instrument Sans Variable", sans-serif';
      c.textAlign = 'center';
      const s = 'ASTOR OPTICS  ·  ZOOM LENS 24–70 mm 1:2.8  ·  Ø82 mm  ·  ';
      const r = 452;
      const step = (Math.PI * 2) / s.length;
      [...s].forEach((ch, i) => {
        c.save();
        c.rotate(i * step);
        c.translate(0, -r);
        c.fillText(ch, 0, 0);
        c.restore();
      });
    },
    true,
  );
  // Tapa del dial de modos, grabada.
  const dialTop = canvasTex(
    512,
    512,
    (c) => {
      c.fillStyle = '#16171b';
      c.fillRect(0, 0, 512, 512);
      c.translate(256, 256);
      c.fillStyle = '#f2f3f6';
      c.font = '600 46px "Instrument Sans Variable", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const modes = ['M', 'Av', 'Tv', 'P', 'B', 'C1', 'C2', 'C3'];
      modes.forEach((m, i) => {
        const a = -Math.PI / 2 + (i - 3) * 0.62;
        c.fillStyle = m === 'P' ? '#e2a7a0' : '#f2f3f6';
        c.fillText(m, Math.cos(a) * 178, Math.sin(a) * 178);
      });
      c.strokeStyle = 'rgba(255,255,255,0.18)';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, 110, 0, Math.PI * 2);
      c.stroke();
    },
    true,
  );
  // Logo blanco en el frente del pentaprisma.
  const logoTex = canvasTex(
    1024,
    256,
    (c) => {
      c.clearRect(0, 0, 1024, 256);
      c.fillStyle = '#eef0f4';
      c.font = '400 200px "Instrument Serif", serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      spacing(c, 26);
      c.fillText('ASTOR', 524, 140);
    },
    true,
  );
  // Correa de nylon tejido: sarga diagonal, orillas cosidas y la marca tejida al centro.
  const strapTex = canvasTex(
    256,
    2048,
    (c) => {
      c.fillStyle = '#121318';
      c.fillRect(0, 0, 256, 2048);
      for (let y = -256; y < 2048; y += 6) {
        c.strokeStyle = y % 12 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(256, y + 128);
        c.stroke();
      }
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillRect(0, 0, 14, 2048);
      c.fillRect(242, 0, 14, 2048);
      c.strokeStyle = 'rgba(226,167,160,0.65)';
      c.setLineDash([16, 10]);
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(26, 0);
      c.lineTo(26, 2048);
      c.moveTo(230, 0);
      c.lineTo(230, 2048);
      c.stroke();
      c.save();
      c.translate(128, 1024);
      c.rotate(-Math.PI / 2);
      c.fillStyle = 'rgba(233,236,243,0.82)';
      c.font = '600 92px "Instrument Sans Variable", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      spacing(c, 34);
      c.fillText('ASTOR', 0, 6);
      c.restore();
    },
    true,
  );
  strapTex.repeat.set(1, 1.4);

  // ===== Materiales =====
  const bodyMat = track(new THREE.MeshPhysicalMaterial({ color: 0x0c0d10, roughness: 0.5, metalness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0.5, bumpMap: grain, bumpScale: 0.35, envMapIntensity: 0.55 }));
  const rubber = track(new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 0.82, metalness: 0, bumpMap: pebble, bumpScale: 2.2, envMapIntensity: 0.6 }));
  const ribbed = track(new THREE.MeshStandardMaterial({ color: 0x090a0c, roughness: 0.7, metalness: 0, bumpMap: ribs, bumpScale: 3, envMapIntensity: 0.7 }));
  const barrel = track(new THREE.MeshPhysicalMaterial({ color: 0x0d0e11, roughness: 0.42, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: 0.6 }));
  const barrelPrint = track(new THREE.MeshPhysicalMaterial({ map: barrelText, roughness: 0.42, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: 0.6 }));
  const darkMetal = track(new THREE.MeshStandardMaterial({ color: 0x1b1c21, roughness: 0.32, metalness: 0.85 }));
  const knurlMat = track(new THREE.MeshStandardMaterial({ color: 0x1c1d22, roughness: 0.4, metalness: 0.8, bumpMap: knurl, bumpScale: 2 }));
  const chrome = track(new THREE.MeshStandardMaterial({ color: 0xd8dbe1, roughness: 0.16, metalness: 1 }));
  const accent = track(new THREE.MeshPhysicalMaterial({ color: 0xa4514f, roughness: 0.3, metalness: 0.3, clearcoat: 0.8 }));
  const screen = track(new THREE.MeshPhysicalMaterial({ color: 0x050609, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 }));
  const glass = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x04060b,
      roughness: 0.03,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.01,
      iridescence: 1,
      iridescenceIOR: 1.7,
      iridescenceThicknessMinimum: 220,
      iridescenceThicknessMaximum: 640,
      envMapIntensity: 1.8,
    }),
  );
  const innerGlass = track(new THREE.MeshPhysicalMaterial({ color: 0x0a0d18, roughness: 0.05, clearcoat: 1, iridescence: 0.7, iridescenceThicknessMinimum: 400, iridescenceThicknessMaximum: 900, envMapIntensity: 1.2 }));
  const void_ = track(new THREE.MeshBasicMaterial({ color: 0x010102 }));
  const ringMat = track(new THREE.MeshStandardMaterial({ map: nameRing, roughness: 0.5, metalness: 0.2 }));
  const dialMat = track(new THREE.MeshStandardMaterial({ map: dialTop, roughness: 0.4, metalness: 0.5 }));
  const logoMat = track(new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.35, metalness: 0.1 }));
  const lamp = track(new THREE.MeshPhysicalMaterial({ color: 0x3a0a0c, roughness: 0.1, clearcoat: 1 }));
  const strapMat = track(new THREE.MeshStandardMaterial({ map: strapTex, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }));
  const tabMat = track(new THREE.MeshStandardMaterial({ color: 0x18191d, roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide }));

  // ===== Modelo (unidades: el cuerpo mide 2.9 de ancho; el lente apunta a +z; la empuñadura va en -x) =====
  const cam = new THREE.Group();
  const add = (geo: T.BufferGeometry, mat: T.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent: T.Object3D = cam) => {
    const m = new THREE.Mesh(track(geo), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const BW = 2.9;
  const BH = 1.72;
  const BD = 0.92;
  const TOP = BH / 2;
  const LX = 0.16; // eje del lente (un poco hacia el lado contrario a la empuñadura)
  const LY = -0.08;

  // Cuerpo, frente de la montura y empuñadura.
  add(new RoundedBoxGeometry(BW, BH, BD, 8, 0.2), bodyMat, 0, 0, 0);
  add(new THREE.CylinderGeometry(0.86, 0.9, 0.16, 96), bodyMat, LX, LY, BD / 2 + 0.06, Math.PI / 2);
  add(new RoundedBoxGeometry(0.86, BH * 0.96, 0.7, 8, 0.3), rubber, -BW / 2 + 0.46, -0.05, BD / 2 + 0.2);
  add(new RoundedBoxGeometry(0.5, BH * 0.7, 0.3, 6, 0.14), rubber, -BW / 2 + 0.2, -0.12, -BD / 2 - 0.02); // apoyo del pulgar
  add(new RoundedBoxGeometry(0.36, BH * 0.86, BD * 0.9, 6, 0.16), rubber, BW / 2 - 0.12, -0.04, 0); // costado con hule
  add(new RoundedBoxGeometry(0.14, 0.2, 0.04, 4, 0.03), lamp, -BW / 2 + 0.62, TOP - 0.36, BD / 2 + 0.56); // luz del autodisparador

  // Pentaprisma: caja redondeada que se angosta hacia arriba y con el frente inclinado hacia atrás.
  const PW = 1.56;
  const PH = 0.7;
  const PD = BD * 0.84;
  const SLOPE = 0.2; // cuánto se va hacia atrás el frente en la parte de arriba
  const prismGeo = new RoundedBoxGeometry(PW, PH, PD, 8, 0.12);
  const pp = prismGeo.getAttribute('position') as T.BufferAttribute;
  for (let i = 0; i < pp.count; i++) {
    const t = (pp.getY(i) + PH / 2) / PH;
    pp.setX(i, pp.getX(i) * (1 - 0.4 * t));
    const zz = pp.getZ(i);
    // Solo el frente se inclina; la espalda queda recta.
    pp.setZ(i, zz > 0 ? zz - SLOPE * t * (zz / (PD / 2)) : zz);
  }
  prismGeo.computeVertexNormals();
  const PY = TOP + PH / 2 - 0.1;
  add(prismGeo, bodyMat, LX, PY, -0.02);
  const LT = 0.5; // altura (0–1) donde va el logo
  const logo = add(new THREE.PlaneGeometry(0.84, 0.21), logoMat, LX, PY - PH / 2 + PH * LT, -0.02 + PD / 2 - SLOPE * LT + 0.006, -Math.atan(SLOPE / PH));
  logo.castShadow = false;
  add(new RoundedBoxGeometry(0.5, 0.05, 0.44, 3, 0.02), chrome, LX, PY + PH / 2 + 0.01, -0.1); // zapata
  add(new RoundedBoxGeometry(0.42, 0.06, 0.38, 3, 0.02), darkMetal, LX, PY + PH / 2 - 0.02, -0.1);
  add(new RoundedBoxGeometry(0.72, 0.5, 0.34, 8, 0.16), rubber, LX, TOP + 0.24, -BD / 2 - 0.18); // ocular

  // Lado de la empuñadura arriba: pantallita superior, dial principal y disparador con su anillo.
  add(new RoundedBoxGeometry(0.62, 0.02, 0.4, 2, 0.008), screen, -BW * 0.27, TOP + 0.005, -0.12);
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 64), knurlMat, -BW / 2 + 0.52, TOP - 0.03, BD / 2 + 0.1, 0, 0, Math.PI / 2); // rueda a medio hundir
  add(new THREE.CylinderGeometry(0.15, 0.16, 0.06, 48), darkMetal, -BW / 2 + 0.46, TOP + 0.02, BD / 2 + 0.36);
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 40), chrome, -BW / 2 + 0.46, TOP + 0.07, BD / 2 + 0.36);

  // Lado contrario: dial de modos grabado con estrías y seguro al centro.
  const dial = new THREE.Group();
  dial.position.set(BW * 0.32, TOP + 0.09, -0.04);
  cam.add(dial);
  add(new THREE.CylinderGeometry(0.33, 0.33, 0.18, 96), knurlMat, 0, 0, 0, 0, 0, 0, dial);
  add(new THREE.CircleGeometry(0.31, 96), dialMat, 0, 0.092, 0, -Math.PI / 2, 0, 0, dial);
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 32), chrome, 0, 0.11, 0, 0, 0, 0, dial);

  // Montura: aro cromado, punto de alineación y botón para soltar el lente.
  add(new THREE.TorusGeometry(0.7, 0.035, 20, 96), chrome, LX, LY, BD / 2 + 0.15);
  add(new THREE.SphereGeometry(0.04, 16, 12), accent, LX + 0.2, LY + 0.76, BD / 2 + 0.14);
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 32), chrome, LX + 0.86, LY + 0.14, BD / 2 + 0.03, Math.PI / 2);

  // Atrás: pantalla grande con marco, botones y rueda.
  add(new RoundedBoxGeometry(1.7, 1.12, 0.06, 4, 0.04), darkMetal, 0.28, -0.14, -BD / 2 - 0.01);
  add(new RoundedBoxGeometry(1.6, 1.02, 0.03, 4, 0.03), screen, 0.28, -0.14, -BD / 2 - 0.045);
  add(new THREE.TorusGeometry(0.19, 0.04, 16, 48), knurlMat, -BW / 2 + 0.62, -0.2, -BD / 2 - 0.02);
  for (const [x, y] of [
    [-BW / 2 + 0.62, 0.32],
    [-BW / 2 + 0.38, 0.62],
    [-BW / 2 + 0.66, 0.62],
  ])
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 24), darkMetal, x, y, -BD / 2 - 0.02, Math.PI / 2);

  // Zoom: anillos con un perfil torneado (bordes biselados).
  const lens = new THREE.Group();
  lens.position.set(LX, LY, BD / 2 + 0.14);
  cam.add(lens);
  const ring = (r: number, len: number, z: number, mat: T.Material, bevel = 0.02, seg = 96) => {
    const pts = [
      new THREE.Vector2(r - 0.06, 0),
      new THREE.Vector2(r - bevel, 0),
      new THREE.Vector2(r, bevel),
      new THREE.Vector2(r, len - bevel),
      new THREE.Vector2(r - bevel, len),
      new THREE.Vector2(r - 0.06, len),
    ];
    return add(new THREE.LatheGeometry(pts, seg), mat, 0, 0, z, Math.PI / 2, 0, 0, lens);
  };
  const tube = (r: number, len: number, z: number, mat: T.Material) =>
    add(new THREE.CylinderGeometry(r, r, len, 96, 1, true), mat, 0, 0, z + len / 2, Math.PI / 2, 0, 0, lens);
  let z = 0;
  ring(0.64, 0.12, z, darkMetal); // bayoneta
  z += 0.12;
  ring(0.61, 0.3, z, barrel);
  tube(0.612, 0.16, z + 0.08, barrelPrint); // letras
  z += 0.3;
  ring(0.65, 0.56, z, ribbed, 0.03); // anillo de zoom
  z += 0.56;
  ring(0.625, 0.05, z, accent, 0.008); // anillo de acento
  z += 0.05;
  ring(0.61, 0.18, z, barrel);
  z += 0.18;
  ring(0.63, 0.3, z, ribbed, 0.025); // enfoque
  z += 0.3;
  ring(0.66, 0.14, z, barrel, 0.03);
  z += 0.14;
  // Parasol abocinado con borde.
  const HOOD = 0.62;
  add(new THREE.CylinderGeometry(0.9, 0.68, HOOD, 96, 1, true), track(new THREE.MeshStandardMaterial({ color: 0x0f1013, roughness: 0.6, side: THREE.DoubleSide })), 0, 0, z + HOOD / 2, Math.PI / 2, 0, 0, lens);
  add(new THREE.TorusGeometry(0.9, 0.02, 12, 96), barrel, 0, 0, z + HOOD, 0, 0, 0, lens);
  // Cristal: anillo con el nombre, lente frontal abombada con tratamiento, un elemento interior y fondo oscuro.
  const zg = z - 0.02;
  add(new THREE.RingGeometry(0.5, 0.64, 96), ringMat, 0, 0, zg + 0.005, 0, 0, 0, lens);
  const R = 0.9;
  const theta = Math.asin(0.5 / R);
  add(new THREE.SphereGeometry(R, 96, 24, 0, Math.PI * 2, 0, theta), glass, 0, 0, zg - R * Math.cos(theta), Math.PI / 2, 0, 0, lens);
  add(new THREE.SphereGeometry(0.5, 64, 16, 0, Math.PI * 2, 0, 0.6), innerGlass, 0, 0, zg - 0.38 - 0.5 * Math.cos(0.6), Math.PI / 2, 0, 0, lens);
  add(new THREE.CircleGeometry(0.5, 64), void_, 0, 0, zg - 0.4, 0, 0, 0, lens);
  const LENS_FRONT = BD / 2 + 0.14 + z + HOOD;

  // Argollas para la correa a los lados, arriba.
  const LUG_X = BW / 2 + 0.07;
  const LUG_Y = TOP - 0.28;
  const LUG_Z = -0.05;
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 20), darkMetal, s * (BW / 2 + 0.02), LUG_Y - 0.06, LUG_Z, 0, 0, Math.PI / 2);
    add(new THREE.TorusGeometry(0.1, 0.022, 12, 32), chrome, s * LUG_X, LUG_Y, LUG_Z, 0, Math.PI / 2, 0);
  }
  scene.add(cam);

  // ===== Física =====
  type P = { p: T.Vector3; o: T.Vector3; w: number };
  const HOOK = new V(0, 2.25, 0);
  const REST_YAW = 0.5; // la cámara cuelga en tres cuartos: se ven el logo, la empuñadura y el lente
  // Partículas del cuerpo rígido en coordenadas de la cámara. El centro va bajo y pesado, el lente un poco menos.
  const LOCAL = {
    L: new V(-LUG_X, LUG_Y, LUG_Z),
    R: new V(LUG_X, LUG_Y, LUG_Z),
    C: new V(0, -0.6, 0),
    F: new V(LX, LY, LENS_FRONT - 0.3),
  };
  const keys = Object.keys(LOCAL) as (keyof typeof LOCAL)[];
  const weight = { L: 2, R: 2, C: 0.4, F: 2 };
  const startQ = new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), REST_YAW);
  const start = new V(0, HOOK.y - 3.25, 0);
  const body = Object.fromEntries(
    keys.map((k) => {
      const p = LOCAL[k].clone().applyQuaternion(startQ).add(start);
      return [k, { p, o: p.clone(), w: weight[k] }];
    }),
  ) as Record<keyof typeof LOCAL, P>;
  const pairs: [P, P, number][] = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) pairs.push([body[keys[i]], body[keys[j]], LOCAL[keys[i]].distanceTo(LOCAL[keys[j]])]);

  const SEG = 16;
  const STRAP_LEN = 3.55;
  const makeRope = (end: P) =>
    Array.from({ length: SEG + 1 }, (_, i) => {
      const p = HOOK.clone().lerp(end.p, i / SEG);
      return { p, o: p.clone(), w: i === 0 ? 0 : 1 } as P;
    });
  const ropes = [makeRope(body.L), makeRope(body.R)];
  // El último punto de cada tira ES la argolla de la cámara.
  ropes[0][SEG] = body.L;
  ropes[1][SEG] = body.R;
  const segLen = STRAP_LEN / SEG;

  const gravity = new V(0, -9.8, 0);
  const tmp = new V();
  const MAX_STEP = 0.016; // tope de velocidad por paso: nunca sale volando

  const solve = (a: P, b: P, rest: number) => {
    tmp.subVectors(b.p, a.p);
    const d = tmp.length() || 1e-6;
    const wsum = a.w + b.w;
    if (!wsum) return;
    const diff = (d - rest) / d;
    a.p.addScaledVector(tmp, (diff * a.w) / wsum);
    b.p.addScaledVector(tmp, (-diff * b.w) / wsum);
  };
  // La correa no se estira, pero sí se dobla (solo limita la distancia máxima).
  const solveRope = (a: P, b: P, rest: number) => {
    if (a.p.distanceTo(b.p) > rest) solve(a, b, rest);
  };

  // Cursor: un objeto redondo que roza la cámara y la correa.
  const cursor = { on: false, ndc: new THREE.Vector2(), world: new V(), prev: new V(), has: false };
  const pending = new V(); // empujón por aplicar (lo reparte en los siguientes pasos)
  let pendingAt: T.Vector3 | null = null;

  const all = [...ropes[0].slice(1), ...ropes[1].slice(1), body.C, body.F];
  const yawRot = new THREE.Quaternion();
  const step = (dt: number) => {
    const damp = 0.993;
    for (const q of all) {
      if (!q.w) continue;
      tmp.subVectors(q.p, q.o).multiplyScalar(damp);
      if (tmp.length() > MAX_STEP) tmp.setLength(MAX_STEP);
      q.o.copy(q.p);
      q.p.add(tmp).addScaledVector(gravity, dt * dt);
    }
    // Empujón del cursor, repartido según qué tan cerca del punto de contacto está cada partícula.
    if (pendingAt && pending.lengthSq() > 1e-10) {
      const part = pending.clone().multiplyScalar(0.25);
      pending.sub(part);
      for (const k of keys) {
        const near = 1 / (1 + body[k].p.distanceTo(pendingAt) * 1.4);
        body[k].p.addScaledVector(part, near);
      }
    }
    // La correa, torcida, regresa despacio la cámara a su giro de reposo.
    const yaw = Math.atan2(zAxis.x, zAxis.z);
    let err = yaw - REST_YAW;
    err = Math.atan2(Math.sin(err), Math.cos(err));
    if (Math.abs(err) > 0.002) {
      yawRot.setFromAxisAngle(new V(0, 1, 0), -err * 0.0025);
      for (const k of keys) {
        if (k === 'C') continue;
        tmp.subVectors(body[k].p, body.C.p).applyQuaternion(yawRot);
        body[k].p.copy(body.C.p).add(tmp);
      }
    }
    for (let it = 0; it < 14; it++) {
      for (const rope of ropes) for (let i = 0; i < SEG; i++) solveRope(rope[i], rope[i + 1], segLen);
      for (const [a, b, r] of pairs) solve(a, b, r);
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
    // El cursor aparta la correa si pasa por encima.
    if (cursor.on && cursor.has) {
      for (const rope of ropes)
        for (let i = 1; i < SEG; i++) {
          const q = rope[i];
          const dx = q.p.x - cursor.world.x;
          const dy = q.p.y - cursor.world.y;
          const d = Math.hypot(dx, dy);
          const RAD = 0.24;
          if (d < RAD && d > 1e-4) {
            const push = Math.min(0.012, (RAD - d) * 0.3);
            q.p.x += (dx / d) * push;
            q.p.y += (dy / d) * push;
          }
        }
    }
  };

  // Orientación de la cámara a partir de sus partículas.
  const basis = new THREE.Matrix4();
  const xAxis = new V();
  const yAxis = new V();
  const zAxis = new V(Math.sin(REST_YAW), 0, Math.cos(REST_YAW));
  const center = new V();
  const orient = () => {
    xAxis.subVectors(body.R.p, body.L.p).normalize();
    tmp.subVectors(body.F.p, body.C.p);
    zAxis.copy(tmp).addScaledVector(xAxis, -tmp.dot(xAxis)).normalize();
    yAxis.crossVectors(zAxis, xAxis).normalize();
    basis.makeBasis(xAxis, yAxis, zAxis);
    cam.quaternion.setFromRotationMatrix(basis);
    center.copy(LOCAL.C).applyQuaternion(cam.quaternion);
    cam.position.subVectors(body.C.p, center);
  };

  // ===== Correa (cinta plana) =====
  const strapW = 0.26;
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
  // Puntas: tira delgada de hule que pasa por la argolla.
  const ends = ropes.map(() => {
    const m = new THREE.Mesh(track(new RoundedBoxGeometry(0.14, 0.5, 0.03, 2, 0.012)), tabMat);
    m.castShadow = true;
    scene.add(m);
    return m;
  });
  // Gancho y riel.
  const rail = new THREE.Mesh(track(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 32)), chrome);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, HOOK.y + 0.35, -0.2);
  rail.castShadow = true;
  scene.add(rail);
  const hook = new THREE.Mesh(track(new THREE.TorusGeometry(0.16, 0.035, 12, 32, Math.PI * 1.3)), chrome);
  hook.position.set(0, HOOK.y + 0.14, -0.08);
  hook.rotation.set(0, Math.PI / 2, Math.PI * 0.85);
  scene.add(hook);

  const side = new V();
  const tangent = new V();
  const fwd = new V();
  const facing = new V(0, 0, 1);
  const yUp = new V(0, 1, 0);
  const tabTurn = new THREE.Quaternion();
  const updateStrap = () => {
    ropes.forEach((rope, r) => {
      const pos = strapMeshes[r].geometry.getAttribute('position') as T.BufferAttribute;
      for (let i = 0; i <= SEG; i++) {
        const a = rope[Math.max(0, i - 1)].p;
        const b = rope[Math.min(SEG, i + 1)].p;
        tangent.subVectors(b, a).normalize();
        // Cerca del gancho la cinta mira al frente; cerca de la argolla gira con la cámara (de canto, como pasa por la argolla).
        const t = i / SEG;
        fwd.copy(facing).lerp(xAxis, t * t * 0.9).normalize();
        side.crossVectors(tangent, fwd).normalize().multiplyScalar(strapW / 2);
        const p = rope[i].p;
        pos.setXYZ(i * 2, p.x - side.x, p.y - side.y, p.z - side.z);
        pos.setXYZ(i * 2 + 1, p.x + side.x, p.y + side.y, p.z + side.z);
      }
      pos.needsUpdate = true;
      strapMeshes[r].geometry.computeVertexNormals();
      strapMeshes[r].geometry.computeBoundingSphere();
      const a = rope[SEG - 2].p;
      const b = rope[SEG].p;
      ends[r].position.lerpVectors(a, b, 0.62);
      tangent.subVectors(b, a).normalize();
      ends[r].quaternion.setFromUnitVectors(yUp, tangent);
      tabTurn.setFromAxisAngle(yUp, Math.atan2(xAxis.x, xAxis.z));
      ends[r].quaternion.multiply(tabTurn);
    });
  };

  // ===== Puntero =====
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new V(0, 0, 1), 0);
  const reduced = prefersReducedMotion();
  const aimCursor = () => {
    ray.setFromCamera(cursor.ndc, camera);
    plane.constant = -cam.position.z;
    return ray.ray.intersectPlane(plane, cursor.world);
  };
  expose({
    hover: (x, y) => {
      cursor.ndc.set(x, y);
      cursor.on = true;
      wake();
    },
    leave: () => {
      cursor.on = false;
      cursor.has = false;
    },
    poke: (x, y) => {
      if (reduced) return;
      ray.setFromCamera(new THREE.Vector2(x, y), camera);
      const hit = ray.intersectObject(cam, true)[0];
      if (!hit) return;
      pendingAt = hit.point.clone();
      pending.set(hit.point.x < cam.position.x ? 0.035 : -0.035, 0.01, -0.012);
      wake();
    },
  });
  // Un cuadro: si el cursor se movió sobre la cámara, la roza con su velocidad (con tope).
  const brush = () => {
    if (!cursor.on || reduced) return;
    cursor.prev.copy(cursor.world);
    const had = cursor.has;
    cursor.has = !!aimCursor();
    if (!had || !cursor.has) return;
    const move = tmp.subVectors(cursor.world, cursor.prev);
    if (move.lengthSq() < 1e-7) return;
    const hit = ray.intersectObject(cam, true)[0];
    if (!hit) return;
    const impulse = move.clone().multiplyScalar(0.09);
    impulse.z = -Math.abs(move.x) * 0.025;
    if (impulse.length() > 0.022) impulse.setLength(0.022);
    pending.add(impulse);
    if (pending.length() > 0.045) pending.setLength(0.045);
    pendingAt = hit.point.clone();
  };

  // ===== Bucle =====
  const resize = () => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // En pantallas angostas se aleja la cámara para que quepa completa.
    const far = r.width / r.height < 0.8 ? 16.5 : 13.6;
    // Un poco a la derecha: el lente apunta hacia allá y así la cámara queda centrada.
    camera.position.set(0.45, -0.55, far);
    camera.lookAt(0.45, -0.55, 0);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // Asentar la cámara antes del primer cuadro y darle un vaivén suave de entrada.
  orient();
  for (let i = 0; i < 360; i++) {
    step(1 / 120);
    orient();
  }
  if (!reduced) for (const k of keys) body[k].o.x = body[k].p.x - 0.012;

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
    brush();
    acc += Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const h = 1 / 120;
    while (acc >= h) {
      step(h);
      orient();
      acc -= h;
    }
    updateStrap();
    renderer.render(scene, camera);
    // Cuando ya casi no se mueve, deja de dibujar hasta el próximo roce.
    let motion = 0;
    for (const k of keys) motion += body[k].p.distanceTo(body[k].o);
    calm = motion < 0.0003 && pending.lengthSq() < 1e-8 ? calm + 1 : 0;
    if (calm < 90 || cursor.on) raf = requestAnimationFrame(frame);
  }
  updateStrap();
  wake();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    for (const d of disposables) d.dispose();
  };
}
