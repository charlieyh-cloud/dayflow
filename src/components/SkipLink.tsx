/**
 * "본문 바로가기" 링크.
 * 키보드 사용자가 헤더·내비게이션을 건너뛰고 본문으로 바로 이동한다.
 * DOM 상 가장 먼저 포커스를 받아야 하므로 앱 최상단에 둔다.
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a className="sr-only sr-only-focusable" href={`#${targetId}`}>
      본문 바로가기
    </a>
  )
}
