/**
 * Generates placeholder PWA icons as real PNGs with zero dependencies.
 *
 * iOS will not accept an SVG for apple-touch-icon, so these have to be actual
 * PNG files. Rather than pull in sharp/canvas for artwork that is meant to be
 * thrown away, this rasterizes a dumbbell into an RGBA buffer and encodes the
 * PNG by hand (deflate via node:zlib + CRC32).
 *
 * Replace public/icons/*.png with your own artwork any time — nothing in the
 * app reads anything but the filenames.
 *
 *   npm run icons
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BG = [17, 24, 39, 255] // #111827 slate-900
const FG = [74, 222, 128, 255] // #4ade80 green-400
const SS = 3 // supersampling factor, for smooth edges

// --- PNG encoding -----------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  // Each scanline is prefixed with a filter byte; 0 = None.
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const src = y * width * 4
    const dst = y * (1 + width * 4)
    raw[dst] = 0
    rgba.copy(raw, dst + 1, src, src + width * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- shape tests (normalized 0..1 coordinates) ------------------------------

function inRoundedSquare(x, y, radius) {
  if (radius <= 0) return true
  const cx = x < radius ? radius : x > 1 - radius ? 1 - radius : x
  const cy = y < radius ? radius : y > 1 - radius ? 1 - radius : y
  if (cx === x && cy === y) return true
  return Math.hypot(x - cx, y - cy) <= radius
}

const rect = (x, y, x0, x1, y0, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1

// A dumbbell: handle, inner plates, outer plates. Spans x 0.16..0.84 so it
// stays inside the maskable safe zone (center 80%).
function inDumbbell(x, y) {
  return (
    rect(x, y, 0.32, 0.68, 0.455, 0.545) || // handle
    rect(x, y, 0.24, 0.33, 0.34, 0.66) || // inner plate, left
    rect(x, y, 0.67, 0.76, 0.34, 0.66) || // inner plate, right
    rect(x, y, 0.16, 0.245, 0.395, 0.605) || // outer plate, left
    rect(x, y, 0.755, 0.84, 0.395, 0.605) // outer plate, right
  )
}

// --- rasterizer -------------------------------------------------------------

function render(size, { radius }) {
  const buf = Buffer.alloc(size * size * 4)
  const samples = SS * SS

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let inside = 0
      let glyph = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size
          const y = (py + (sy + 0.5) / SS) / size
          if (inRoundedSquare(x, y, radius)) {
            inside++
            if (inDumbbell(x, y)) glyph++
          }
        }
      }

      const coverage = inside / samples
      const glyphMix = inside === 0 ? 0 : glyph / inside
      const o = (py * size + px) * 4
      for (let c = 0; c < 3; c++) {
        buf[o + c] = Math.round(BG[c] + (FG[c] - BG[c]) * glyphMix)
      }
      buf[o + 3] = Math.round(255 * coverage)
    }
  }

  return encodePng(size, size, buf)
}

// --- outputs ----------------------------------------------------------------

const ICONS = [
  // Rounded, for Android/desktop where the icon is shown as-authored.
  { file: 'icon-192.png', size: 192, radius: 0.22 },
  { file: 'icon-512.png', size: 512, radius: 0.22 },
  // Full bleed: the platform applies its own mask.
  { file: 'icon-512-maskable.png', size: 512, radius: 0 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0 },
]

mkdirSync(OUT_DIR, { recursive: true })
for (const { file, size, radius } of ICONS) {
  const png = render(size, { radius })
  writeFileSync(join(OUT_DIR, file), png)
  console.log(`${file.padEnd(24)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`)
}
