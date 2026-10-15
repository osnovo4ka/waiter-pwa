/** Генерация PNG-иконок без зависимостей (zlib из Node). */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePNG(size, pixelFn) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function iconPixel(x, y, size) {
  const u = x / size;
  const v = y / size;
  const bg = [12, 11, 10, 255];
  // скруглённый тёмный фон (для maskable — полный)
  const r = 0.0;
  const cx = u - 0.5;
  const cy = v - 0.5;

  // розовая карточка-заказ с лаймовой галочкой
  const card = { x0: 0.18, x1: 0.82, y0: 0.2, y1: 0.8 };
  const inCard = u > card.x0 && u < card.x1 && v > card.y0 && v < card.y1;

  // верхняя строка заголовка (розовая полоса)
  if (inCard && v > 0.27 && v < 0.36 && u > 0.26 && u < 0.74) return [255, 77, 141, 255];
  // две строки текста (серые)
  if (inCard && v > 0.43 && v < 0.49 && u > 0.26 && u < 0.74) return [163, 152, 140, 255];
  if (inCard && v > 0.53 && v < 0.59 && u > 0.26 && u < 0.62) return [163, 152, 140, 255];
  // лаймовая кнопка-итог внизу карточки
  if (inCard && v > 0.66 && v < 0.74 && u > 0.26 && u < 0.74) return [198, 245, 74, 255];

  if (inCard) return [28, 24, 21, 255];
  return bg;
}

const out = path.join(__dirname, "..", "icons");
fs.mkdirSync(out, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(out, `icon-${size}.png`), encodePNG(size, iconPixel));
  console.log("icons/icon-" + size + ".png");
}
