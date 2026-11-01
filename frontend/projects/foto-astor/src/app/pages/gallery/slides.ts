// Diapositivas de las pantallas de la galería: se dibujan en un canvas 2D (foto, texto, logo) y luego el shader
// de la pantalla hace la transición entre la actual y la siguiente.

export type SlideKind = 'full' | 'framed' | 'split' | 'logo' | 'number' | 'grid' | 'quote' | 'cells' | 'strip' | 'cta';

export interface Slide {
  kind: SlideKind;
  photos: string[];
  kicker?: string;
  title?: string;
  text?: string;
  big?: string;
  label?: string;
  bg?: 'night' | 'paper';
  side?: 'left' | 'right';
  /** Proporción del panel de texto (split) o celdas (cells) cuando la pantalla está partida físicamente. */
  panel?: number;
  cells?: number;
  /** Acercamiento lento (Ken Burns) mientras la diapositiva está quieta. */
  kb?: boolean;
  /** Zonas clicables: rango horizontal del canvas (0–1) y la foto que contiene. */
  regions?: { x0: number; x1: number; photo: string }[];
}

export type Images = Map<string, HTMLImageElement>;

const NIGHT = '#070b16';
const PAPER = '#e9ecf3';
const INK = '#141b2d';
const SOFT = 'rgba(236,232,225,0.62)';
const CHAMPAGNE = '#e2a7a0';

const F_DISPLAY = '"Instrument Serif", Georgia, serif';
const F_LABEL = '"Instrument Sans Variable", Arial, sans-serif';
const F_SCRIPT = '"Mrs Saint Delafield", cursive';
const F_BODY = '"Hanken Grotesk Variable", system-ui, sans-serif';

function track(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`;
}

export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, focusY = 0.42) {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (ir > r) {
    sw = sh * r;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / r;
    sy = (img.naturalHeight - sh) * focusY;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number) {
  if (!img || !img.naturalWidth) return { x, y, w, h };
  const ir = img.naturalWidth / img.naturalHeight;
  let dw = w;
  let dh = w / ir;
  if (dh > h) {
    dh = h;
    dw = h * ir;
  }
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 8) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = word;
      if (++lines >= maxLines) return y;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.06, cy - r * 0.45, cx + r * 0.45, cy - r * 0.06, cx + r, cy);
  ctx.bezierCurveTo(cx + r * 0.45, cy + r * 0.06, cx + r * 0.06, cy + r * 0.45, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.06, cy + r * 0.45, cx - r * 0.45, cy + r * 0.06, cx - r, cy);
  ctx.bezierCurveTo(cx - r * 0.45, cy - r * 0.06, cx - r * 0.06, cy - r * 0.45, cx, cy - r);
  ctx.fill();
}

/** Logo de Astor (palabra, estrella y órbita) centrado en (cx, cy) con un alto de letra dado. */
function logo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${size}px ${F_DISPLAY}`;
  track(ctx, size * 0.08);
  ctx.fillText('ASTOR', cx + size * 0.04, cy);
  const w = ctx.measureText('ASTOR').width;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.62, size * 0.36, -0.14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx + w * 0.58, cy - size * 0.3, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
  star(ctx, cx - w * 0.43, cy - size * 0.42, size * 0.2);
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.save();
  ctx.font = `500 ${size}px ${F_LABEL}`;
  track(ctx, size * 0.24);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

/** Dibuja la diapositiva en el canvas y anota las zonas clicables. */
export function compose(slide: Slide, canvas: HTMLCanvasElement, imgs: Images) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const m = Math.min(W, H);
  const dark = (slide.bg ?? 'night') === 'night';
  const fg = dark ? PAPER : INK;
  const soft = dark ? SOFT : 'rgba(22,21,20,0.6)';
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = dark ? NIGHT : PAPER;
  ctx.fillRect(0, 0, W, H);
  const img = (i: number) => imgs.get(slide.photos[i]);
  const regions: Slide['regions'] = [];

  switch (slide.kind) {
    case 'full': {
      drawCover(ctx, img(0), 0, 0, W, H);
      const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, H * 0.7, W, H * 0.3);
      if (slide.label) label(ctx, slide.label, m * 0.05, H - m * 0.05, Math.max(10, m * 0.028), 'rgba(255,255,255,0.85)');
      regions.push({ x0: 0, x1: 1, photo: slide.photos[0] });
      break;
    }
    case 'framed': {
      const pad = m * 0.09;
      const capH = m * 0.12;
      const r = drawContain(ctx, img(0), pad, pad, W - pad * 2, H - pad * 2 - capH);
      ctx.shadowColor = 'transparent';
      label(ctx, slide.label ?? 'Astor · Exposición permanente', r.x, r.y + r.h + capH * 0.55, Math.max(10, m * 0.026), soft);
      if (slide.title) {
        ctx.font = `italic 400 ${Math.max(14, m * 0.048)}px ${F_DISPLAY}`;
        ctx.fillStyle = fg;
        ctx.textAlign = 'right';
        ctx.fillText(slide.title, r.x + r.w, r.y + r.h + capH * 0.6);
        ctx.textAlign = 'left';
      }
      regions.push({ x0: 0, x1: 1, photo: slide.photos[0] });
      break;
    }
    case 'split': {
      const pw = W * (slide.panel ?? 0.38);
      const left = (slide.side ?? 'left') === 'left';
      const px = left ? 0 : W - pw;
      drawCover(ctx, img(0), left ? pw : 0, 0, W - pw, H);
      ctx.fillStyle = dark ? NIGHT : PAPER;
      ctx.fillRect(px, 0, pw, H);
      const pad = Math.min(pw, H) * 0.12;
      const fs = Math.min(pw * 0.11, H * 0.12);
      if (slide.kicker) label(ctx, slide.kicker, px + pad, pad + fs * 0.4, Math.max(10, fs * 0.28), soft);
      ctx.fillStyle = fg;
      ctx.font = `italic 400 ${fs}px ${F_DISPLAY}`;
      const after = wrap(ctx, slide.title ?? '', px + pad, pad + fs * 1.7, pw - pad * 2, fs * 1.05, 4);
      if (slide.text) {
        ctx.font = `400 ${Math.max(11, fs * 0.3)}px ${F_BODY}`;
        ctx.fillStyle = soft;
        wrap(ctx, slide.text, px + pad, after + fs * 0.3, pw - pad * 2, fs * 0.46, 6);
      }
      label(ctx, 'astorfoto.mx', px + pad, H - pad * 0.8, Math.max(10, fs * 0.24), soft);
      regions.push(left ? { x0: pw / W, x1: 1, photo: slide.photos[0] } : { x0: 0, x1: 1 - pw / W, photo: slide.photos[0] });
      break;
    }
    case 'logo': {
      logo(ctx, W / 2, H * 0.46, m * 0.26, fg);
      if (slide.label) label(ctx, slide.label, W / 2, H * 0.78, Math.max(11, m * 0.034), soft, 'center');
      if (slide.text) {
        ctx.font = `italic 400 ${Math.max(12, m * 0.05)}px ${F_DISPLAY}`;
        ctx.fillStyle = soft;
        ctx.textAlign = 'center';
        ctx.fillText(slide.text, W / 2, H * 0.88);
        ctx.textAlign = 'left';
      }
      break;
    }
    case 'number': {
      const half = W * 0.5;
      drawCover(ctx, img(0), half, 0, W - half, H);
      const pad = H * 0.1;
      ctx.fillStyle = fg;
      ctx.font = `400 ${H * 0.34}px ${F_DISPLAY}`;
      track(ctx, -H * 0.004);
      ctx.fillText(slide.big ?? '', pad, H * 0.52);
      track(ctx, 0);
      label(ctx, slide.label ?? '', pad, H * 0.64, Math.max(11, H * 0.04), CHAMPAGNE);
      if (slide.text) {
        ctx.font = `400 ${Math.max(11, H * 0.036)}px ${F_BODY}`;
        ctx.fillStyle = soft;
        wrap(ctx, slide.text, pad, H * 0.74, half - pad * 2, H * 0.054, 4);
      }
      regions.push({ x0: 0.5, x1: 1, photo: slide.photos[0] });
      break;
    }
    case 'grid': {
      // Retícula tipo muro de marca: líneas finas, una celda de texto y fotos.
      const cols = 4;
      const cw = W / cols;
      const top = H * 0.16;
      ctx.strokeStyle = dark ? 'rgba(236,232,225,0.18)' : 'rgba(22,21,20,0.18)';
      ctx.lineWidth = Math.max(1, W * 0.0008);
      for (let i = 1; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(cw * i, 0);
        ctx.lineTo(cw * i, H);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(W, top);
      ctx.stroke();
      const lab = Math.max(10, H * 0.032);
      ['01 · Preparativos', '02 · Ceremonia', '03 · Retratos', '04 · Fiesta'].forEach((t, i) => label(ctx, t, cw * i + cw * 0.08, top * 0.6, lab, soft));
      const pad = cw * 0.06;
      slide.photos.forEach((p, i) => {
        const col = i >= 1 ? i + 1 : i;
        drawCover(ctx, imgs.get(p), cw * col + pad, top + pad, cw - pad * 2, H - top - pad * 2);
        regions.push({ x0: col / cols, x1: (col + 1) / cols, photo: p });
      });
      ctx.fillStyle = fg;
      ctx.font = `italic 400 ${cw * 0.13}px ${F_DISPLAY}`;
      wrap(ctx, slide.title ?? '', cw + pad * 1.5, top + cw * 0.2, cw - pad * 3, cw * 0.14, 5);
      if (slide.text) {
        ctx.font = `400 ${Math.max(10, cw * 0.042)}px ${F_BODY}`;
        ctx.fillStyle = soft;
        wrap(ctx, slide.text, cw + pad * 1.5, H - top * 1.4, cw - pad * 3, cw * 0.062, 4);
      }
      break;
    }
    case 'quote': {
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.font = `italic 400 ${m * 0.075}px ${F_DISPLAY}`;
      const lines = wrapLines(ctx, `“${slide.text ?? ''}”`, W * 0.68);
      const lh = m * 0.095;
      let y = H / 2 - ((lines.length - 1) * lh) / 2;
      for (const l of lines) {
        ctx.fillText(l, W / 2, y);
        y += lh;
      }
      label(ctx, slide.label ?? '', W / 2, y + lh * 0.3, Math.max(10, m * 0.03), dark ? CHAMPAGNE : '#a4514f', 'center');
      ctx.fillStyle = dark ? CHAMPAGNE : '#a4514f';
      star(ctx, W / 2, H * 0.14, m * 0.035);
      ctx.textAlign = 'left';
      break;
    }
    case 'cells': {
      const n = slide.cells ?? slide.photos.length;
      const cw = W / n;
      for (let i = 0; i < n; i++) {
        const p = slide.photos[i % slide.photos.length];
        drawCover(ctx, imgs.get(p), cw * i, 0, cw, H);
        regions.push({ x0: i / n, x1: (i + 1) / n, photo: p });
      }
      if (slide.label) label(ctx, slide.label, m * 0.05, H - m * 0.06, Math.max(10, m * 0.03), 'rgba(255,255,255,0.9)');
      break;
    }
    case 'strip': {
      // Muro de exposición: fotos en fila con su ficha debajo y un título a la izquierda.
      const n = slide.photos.length;
      const titleW = W * 0.18;
      const pad = H * 0.1;
      const gap = W * 0.016;
      const cw = (W - titleW - pad - gap * (n - 1) - pad * 0.6) / n;
      ctx.fillStyle = fg;
      ctx.font = `italic 400 ${H * 0.1}px ${F_DISPLAY}`;
      wrap(ctx, slide.title ?? '', pad, H * 0.3, titleW - pad * 0.5, H * 0.11, 4);
      if (slide.kicker) label(ctx, slide.kicker, pad, H * 0.18, Math.max(10, H * 0.035), CHAMPAGNE);
      slide.photos.forEach((p, i) => {
        const x = titleW + pad * 0.6 + i * (cw + gap);
        drawCover(ctx, imgs.get(p), x, pad, cw, H - pad * 2.4);
        label(ctx, `N.º ${String(i + 1).padStart(2, '0')}`, x, H - pad * 0.9, Math.max(10, H * 0.032), soft);
        regions.push({ x0: x / W, x1: (x + cw) / W, photo: p });
      });
      break;
    }
    case 'cta': {
      ctx.textAlign = 'center';
      ctx.fillStyle = CHAMPAGNE;
      ctx.font = `400 ${H * 0.2}px ${F_SCRIPT}`;
      ctx.fillText(slide.kicker ?? 'Tu historia', W / 2, H * 0.36);
      ctx.fillStyle = fg;
      ctx.font = `italic 400 ${H * 0.13}px ${F_DISPLAY}`;
      ctx.fillText(slide.title ?? 'podría ser la siguiente', W / 2, H * 0.56);
      label(ctx, slide.label ?? 'Aparta tu fecha · astorfoto.mx', W / 2, H * 0.74, Math.max(11, H * 0.04), soft, 'center');
      ctx.fillStyle = fg;
      star(ctx, W / 2, H * 0.86, H * 0.035);
      ctx.textAlign = 'left';
      break;
    }
  }
  ctx.restore();
  slide.regions = regions;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** Color promedio de la diapositiva (para la luz que la pantalla echa al piso). */
export function averageColor(canvas: HTMLCanvasElement): [number, number, number] {
  const tiny = document.createElement('canvas');
  tiny.width = 6;
  tiny.height = 4;
  const t = tiny.getContext('2d', { willReadFrequently: true })!;
  t.drawImage(canvas, 0, 0, 6, 4);
  const d = t.getImageData(0, 0, 6, 4).data;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
  }
  const n = d.length / 4;
  return [r / n / 255, g / n / 255, b / n / 255];
}
