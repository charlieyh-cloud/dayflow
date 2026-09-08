/**
 * 디자인 토큰 색상 대비 전수 검사 (WCAG 2.2 AA).
 *
 * tokens.css 를 직접 파싱하므로, 토큰 값을 바꾸면 이 테스트가 즉시 잡아낸다.
 * 접근성을 리뷰어 재량이 아니라 파이프라인 게이트로 두기 위한 장치다.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AA_NON_TEXT, AA_TEXT, contrastRatio } from '@/lib/contrast'

const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/** 특정 셀렉터 블록 안의 `--color-*: #hex` 토큰만 뽑아낸다. */
function readTheme(blockMatcher: RegExp): Record<string, string> {
  const block = css.match(blockMatcher)
  if (!block?.[0]) throw new Error(`테마 블록을 찾지 못했습니다: ${String(blockMatcher)}`)

  const tokens: Record<string, string> = {}
  const re = /(--color-[a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block[0])) !== null) {
    if (m[1] && m[2]) tokens[m[1]] = m[2]
  }
  return tokens
}

const light = readTheme(/:root\s*\{[\s\S]*?\n\}/)
const dark = readTheme(/:root\[data-theme='dark'\]\s*\{[\s\S]*?\n\}/)
const highContrast = readTheme(/:root\[data-contrast='high'\]\s*\{[\s\S]*?\n\}/)

/** [전경, 배경, 최소 대비, 설명] */
type Pair = [string, string, number, string]

const pairs: Pair[] = [
  // 본문 텍스트 — 4.5:1
  ['--color-text', '--color-bg', AA_TEXT, '본문 / 배경'],
  ['--color-text', '--color-surface', AA_TEXT, '본문 / 서피스'],
  ['--color-text', '--color-surface-raised', AA_TEXT, '본문 / 융기 서피스'],
  ['--color-text-muted', '--color-bg', AA_TEXT, '보조 텍스트 / 배경'],
  ['--color-text-muted', '--color-surface', AA_TEXT, '보조 텍스트 / 서피스'],

  // 강조색을 텍스트·링크로 쓰는 경우 — 4.5:1
  ['--color-accent', '--color-bg', AA_TEXT, '강조 텍스트 / 배경'],
  ['--color-accent', '--color-surface', AA_TEXT, '강조 텍스트 / 서피스'],
  ['--color-danger', '--color-bg', AA_TEXT, '오류 텍스트 / 배경'],
  ['--color-warning', '--color-bg', AA_TEXT, '경고 텍스트 / 배경'],
  ['--color-success', '--color-bg', AA_TEXT, '성공 텍스트 / 배경'],
  ['--color-info', '--color-bg', AA_TEXT, '정보 텍스트 / 배경'],

  // 채워진 버튼·배지 위의 텍스트 — 4.5:1
  ['--color-on-accent', '--color-accent', AA_TEXT, '버튼 텍스트 / 강조 배경'],
  ['--color-on-danger', '--color-danger', AA_TEXT, '버튼 텍스트 / 오류 배경'],
  ['--color-on-warning', '--color-warning', AA_TEXT, '버튼 텍스트 / 경고 배경'],
  ['--color-on-success', '--color-success', AA_TEXT, '버튼 텍스트 / 성공 배경'],
  ['--color-on-info', '--color-info', AA_TEXT, '버튼 텍스트 / 정보 배경'],

  // 옅은 배경 위의 텍스트 (상태 배지) — 4.5:1
  ['--color-text', '--color-accent-subtle', AA_TEXT, '본문 / 옅은 강조 배경'],
  ['--color-text', '--color-danger-subtle', AA_TEXT, '본문 / 옅은 오류 배경'],
  ['--color-text', '--color-warning-subtle', AA_TEXT, '본문 / 옅은 경고 배경'],
  ['--color-text', '--color-success-subtle', AA_TEXT, '본문 / 옅은 성공 배경'],
  ['--color-text', '--color-info-subtle', AA_TEXT, '본문 / 옅은 정보 배경'],

  // UI 컴포넌트 경계·포커스 링 — 3:1
  ['--color-border', '--color-bg', AA_NON_TEXT, '테두리 / 배경'],
  ['--color-border', '--color-surface', AA_NON_TEXT, '테두리 / 서피스'],
  ['--color-border-strong', '--color-bg', AA_NON_TEXT, '강한 테두리 / 배경'],
  ['--color-accent', '--color-bg', AA_NON_TEXT, '강조 컴포넌트 / 배경'],

  // 포커스 링은 이중 링이다. 바깥 링(focus)은 페이지 배경과,
  // 안쪽 링(focus-inner)은 채워진 버튼 배경과 대비를 확보한다.
  // 어떤 색 위에 놓이든 두 링 중 하나는 반드시 3:1 이상으로 보인다.
  ['--color-focus', '--color-bg', AA_NON_TEXT, '바깥 포커스 링 / 배경'],
  ['--color-focus', '--color-surface', AA_NON_TEXT, '바깥 포커스 링 / 서피스'],
  ['--color-focus-inner', '--color-focus', AA_NON_TEXT, '두 링 간 구분'],
  ['--color-focus-inner', '--color-accent', AA_NON_TEXT, '안쪽 포커스 링 / 강조 버튼'],
  ['--color-focus-inner', '--color-danger', AA_NON_TEXT, '안쪽 포커스 링 / 오류 버튼'],
  ['--color-focus-inner', '--color-success', AA_NON_TEXT, '안쪽 포커스 링 / 성공 버튼'],
  ['--color-focus-inner', '--color-warning', AA_NON_TEXT, '안쪽 포커스 링 / 경고 버튼'],
]

describe.each([
  ['라이트', light],
  ['다크', dark],
  ['고대비', highContrast],
])('%s 테마 색상 대비', (themeName, theme) => {
  it('토큰이 비어 있지 않다', () => {
    expect(Object.keys(theme).length).toBeGreaterThan(15)
  })

  it.each(pairs)('%s / %s ≥ %s:1 — %s', (fgToken, bgToken, min, label) => {
    const fg = theme[fgToken]
    const bg = theme[bgToken]
    expect(fg, `${themeName} 테마에 ${fgToken} 토큰이 없습니다`).toBeDefined()
    expect(bg, `${themeName} 테마에 ${bgToken} 토큰이 없습니다`).toBeDefined()

    const ratio = contrastRatio(fg as string, bg as string)
    expect(
      ratio,
      `${themeName} · ${label}: ${fg} / ${bg} = ${ratio.toFixed(2)}:1 (최소 ${min}:1)`,
    ).toBeGreaterThanOrEqual(min)
  })
})
