/**
 * WCAG 2.2 상대 휘도 및 대비비 계산.
 * 디자인 토큰의 색상 대비를 테스트로 검증하는 데 쓴다.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** `#rgb` / `#rrggbb` 표기를 RGB 로 변환한다. */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`올바른 16진 색상 값이 아닙니다: ${hex}`)
  }

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

/** WCAG 상대 휘도 (0 = 검정, 1 = 흰색). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number): number => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** 두 색의 대비비 (1 ~ 21). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(parseHex(foreground))
  const l2 = relativeLuminance(parseHex(background))
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}

/** WCAG AA 기준: 본문 4.5:1, 큰 텍스트·UI 컴포넌트 3:1 */
export const AA_TEXT = 4.5
export const AA_LARGE_TEXT = 3
export const AA_NON_TEXT = 3
