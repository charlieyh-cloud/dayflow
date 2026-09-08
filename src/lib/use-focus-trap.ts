import { useEffect, type RefObject } from 'react'
import { getFocusableElements } from '@/lib/focus'

/**
 * 컨테이너 안에 키보드 포커스를 가둔다.
 *
 * 열릴 때 첫 포커스 가능 요소로 이동하고, 닫힐 때 열기 전 포커스를 복원한다.
 * 포커스가 뒤로 새면 키보드 사용자는 모달 뒤 콘텐츠를 조작하게 되므로
 * 모든 모달·다이얼로그는 이 훅을 써야 한다.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isActive: boolean): void {
  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusFirst = (): void => {
      const focusable = getFocusableElements(container)
      const target = focusable[0] ?? container
      target.focus()
    }
    focusFirst()

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      const active = document.activeElement

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      // 열기 전 위치로 포커스를 되돌린다.
      previouslyFocused?.focus?.()
    }
  }, [containerRef, isActive])
}
