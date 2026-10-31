// Genera favicon.ico, apple-touch-icon.png y og.jpg (imagen para compartir) en public/.
// Uso: node scripts/brand-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'projects/foto-astor/public');

const star = (fill) =>
  `<path fill="${fill}" d="M32 4c1.9 15.6 8.7 24.3 26 28-17.3 3.7-24.1 12.4-26 28-1.9-15.6-8.7-24.3-26-28 17.3-3.7 24.1-12.4 26-28Z"/>`;
const orbit = (stroke) => `<ellipse fill="none" stroke="${stroke}" stroke-width="2.4" cx="32" cy="34" rx="29" ry="10" transform="rotate(-16 32 34)"/>`;

// Ícono con colores medios (se ve en pestañas claras y oscuras).
const icon = (size, bg) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${bg ? `<rect width="64" height="64" rx="14" fill="${bg}"/>` : ''}${orbit('#8a857c')}${star(bg ? '#ece8e1' : '#5a564f')}</svg>`);

// ICO con una imagen PNG adentro (formato válido desde Windows Vista).
async function ico(sizes) {
  const pngs = await Promise.all(sizes.map((s) => sharp(icon(s)).png().toBuffer()));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  const dir = Buffer.alloc(16 * sizes.length);
  let offset = 6 + dir.length;
  sizes.forEach((s, i) => {
    dir.writeUInt8(s >= 256 ? 0 : s, i * 16);
    dir.writeUInt8(s >= 256 ? 0 : s, i * 16 + 1);
    dir.writeUInt16LE(1, i * 16 + 4);
    dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(pngs[i].length, i * 16 + 8);
    dir.writeUInt32LE(offset, i * 16 + 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([header, dir, ...pngs]);
}

fs.writeFileSync(path.join(PUB, 'favicon.ico'), await ico([16, 32, 48]));
await sharp(icon(180, '#171614')).png().toFile(path.join(PUB, 'apple-touch-icon.png'));

// Imagen para compartir: foto de primer baile con la marca encima.
const W = 1200;
const H = 630;
const photo = await sharp(path.join(PUB, 'media/fotos/chispas-frias.webp')).resize(W, H, { fit: 'cover', position: 'attention' }).modulate({ brightness: 0.7 }).toBuffer();
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0a0a0b" stop-opacity="0.92"/><stop offset="0.65" stop-color="#0a0a0b" stop-opacity="0.35"/><stop offset="1" stop-color="#0a0a0b" stop-opacity="0"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g transform="translate(78 150) scale(1.4)">${orbit('#cdb592')}${star('#ece8e1')}</g>
  <text x="80" y="330" font-family="Didot, Bodoni MT, Georgia, serif" font-size="96" letter-spacing="10" fill="#ece8e1">ASTOR</text>
  <text x="84" y="392" font-family="Georgia, serif" font-style="italic" font-size="38" fill="#cdb592">Noches que brillan una sola vez</text>
  <text x="84" y="520" font-family="Arial Narrow, Arial, sans-serif" font-size="22" letter-spacing="6" fill="#ece8e1" opacity="0.8">BODAS · XV AÑOS · EVENTOS SOCIALES · AGUASCALIENTES</text>
</svg>`);
await sharp(photo).composite([{ input: overlay }]).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(PUB, 'og.jpg'));
console.log('listo: favicon.ico, apple-touch-icon.png, og.jpg');
