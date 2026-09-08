/**
 * PWA 아이콘 생성기 (의존성 없음, zlib 만 사용).
 * 브랜드 컬러 배경 + 흰색 체크 글리프를 그린 PNG 를 만든다.
 *
 *   node scripts/generate-icons.mjs
 *
 * maskable 아이콘은 safe zone(중앙 80%) 안에 글리프를 배치한다.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')

const BRAND = [37, 71, 158] // #25479E — 흰색 대비 8.6:1
const WHITE = [255, 255, 255]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** 안티에일리어싱을 위한 4x4 슈퍼샘플링으로 도형을 칠한다. */
function render(size, { padding, radius }) {
  const buf = Buffer.alloc(size * size * 4)
  const S = 4
  const inset = size * padding
  const box = size - inset * 2
  const r = box * radius

  // 체크 글리프: 두 선분 (박스 기준 상대 좌표 0~1)
  const stroke = box * 0.1
  const p1 = [inset + box * 0.26, inset + box * 0.52]
  const p2 = [inset + box * 0.44, inset + box * 0.69]
  const p3 = [inset + box * 0.75, inset + box * 0.33]

  const distToSegment = (px, py, [ax, ay], [bx, by]) => {
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
  }

  const insideRoundRect = (px, py) => {
    const x = Math.min(Math.max(px, inset + r), inset + box - r)
    const y = Math.min(Math.max(py, inset + r), inset + box - r)
    if (px < inset || px > inset + box || py < inset || py > inset + box) return false
    return (
      Math.hypot(px - x, py - y) <= r ||
      (px >= inset + r && px <= inset + box - r) ||
      (py >= inset + r && py <= inset + box - r)
    )
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0
      let fg = 0
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const px = x + (sx + 0.5) / S
          const py = y + (sy + 0.5) / S
          if (insideRoundRect(px, py)) bg++
          const d = Math.min(distToSegment(px, py, p1, p2), distToSegment(px, py, p2, p3))
          if (d <= stroke / 2) fg++
        }
      }
      const total = S * S
      const bgA = bg / total
      const fgA = fg / total
      const i = (y * size + x) * 4
      // 배경 위에 글리프를 알파 합성
      const a = Math.max(bgA, fgA)
      if (a > 0) {
        for (let c = 0; c < 3; c++) {
          buf[i + c] = Math.round(
            (BRAND[c] * bgA * (1 - fgA) + WHITE[c] * fgA) / (bgA * (1 - fgA) + fgA || 1),
          )
        }
      }
      buf[i + 3] = Math.round(a * 255)
    }
  }
  return buf
}

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  { name: 'icon-192.png', size: 192, padding: 0.0, radius: 0.22 },
  { name: 'icon-512.png', size: 512, padding: 0.0, radius: 0.22 },
  // maskable: 배경을 가장자리까지 채우고 글리프는 안쪽 safe zone 에 둔다.
  { name: 'icon-maskable-192.png', size: 192, padding: 0.0, radius: 0.0, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.0, radius: 0.0, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.0, radius: 0.0 },
]

for (const t of targets) {
  // maskable 은 글리프를 20% 축소해 safe zone 을 확보한다.
  const rgba = t.maskable
    ? render(t.size, { padding: 0.1, radius: 0.0 })
    : render(t.size, { padding: t.padding, radius: t.radius })
  const png = encodePng(t.size, t.size, rgba)
  writeFileSync(resolve(OUT_DIR, t.name), png)
  console.log(`${t.name}  ${t.size}x${t.size}  ${(png.length / 1024).toFixed(1)}KB`)
}
