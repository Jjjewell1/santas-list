import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');

const PINE = { r: 10, g: 47, b: 36 };
const TREE = { r: 35, g: 130, b: 95 };
const TREE_LIGHT = { r: 72, g: 176, b: 132 };
const GOLD = { r: 240, g: 199, b: 94 };
const CRAN = { r: 180, g: 35, b: 54 };
const TRUNK = { r: 127, g: 74, b: 29 };
const SNOW = { r: 251, g: 250, b: 245 };

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function inTriangle(x, y, x1, y1, x2, y2, x3, y3) {
  const d1 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2);
  const d2 = (x - x3) * (y2 - y3) - (x2 - x3) * (y - y3);
  const d3 = (x - x1) * (y3 - y1) - (x3 - x1) * (y - y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function draw(size, maskable) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;

  const pad = maskable ? size * 0.14 : size * 0.04;
  const apexY = size * (maskable ? 0.26 : 0.18);
  const baseY = size * 0.74;
  const baseHalf = size / 2 - pad;
  const starCx = cx;
  const starCy = apexY - size * 0.06;
  const starR = size * 0.09;

  const trunkTop = baseY + size * 0.01;
  const trunkBottom = baseY + size * 0.09;
  const trunkHalf = size * 0.06;

  const ornaments = [
    { ox: cx - baseHalf * 0.42, oy: baseY - size * 0.10, r: size * 0.035 },
    { ox: cx + baseHalf * 0.40, oy: baseY - size * 0.16, r: size * 0.035 },
    { ox: cx - baseHalf * 0.10, oy: baseY - size * 0.27, r: size * 0.03 },
    { ox: cx + baseHalf * 0.18, oy: baseY - size * 0.05, r: size * 0.03 },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = PINE;

      const star = inTriangle(x, y, starCx, starCy - starR, starCx - starR * 0.6, starCy + starR * 0.6, starCx + starR * 0.6, starCy + starR * 0.6) ||
        inTriangle(x, y, starCx - starR * 0.6, starCy - starR * 0.2, starCx + starR * 0.6, starCy - starR * 0.2, starCx, starCy + starR);
      if (star) color = GOLD;

      const tree = inTriangle(x, y, cx, apexY, cx - baseHalf, baseY, cx + baseHalf, baseY);
      if (tree) {
        color = (x + y) % 3 === 0 ? TREE_LIGHT : TREE;
        for (const o of ornaments) {
          if (inEllipse(x, y, o.ox, o.oy, o.r, o.r * 1.15)) color = o.ox < cx ? CRAN : GOLD;
        }
      }

      const trunk = x >= cx - trunkHalf && x <= cx + trunkHalf && y >= trunkTop && y <= trunkBottom;
      if (trunk) color = TRUNK;

      // Snow layer at the bottom
      const snowY = size * 0.92 + Math.abs(Math.sin((x / size) * Math.PI * 10)) * size * 0.03;
      if (y >= snowY) color = SNOW;

      const idx = (size * y + x) << 2;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

fs.mkdirSync(outDir, { recursive: true });
const files = {
  'icon-192.png': draw(192, false),
  'icon-512.png': draw(512, false),
  'maskable-512.png': draw(512, true),
  'apple-touch-icon.png': draw(180, true),
};
for (const [name, png] of Object.entries(files)) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(outDir, name), buffer);
  console.log(`Wrote public/icons/${name}`);
}
