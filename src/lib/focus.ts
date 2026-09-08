const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

/**
 * 요소가 실제로 보이는지 판단한다.
 *
 * `offsetParent` 는 position: fixed 요소에서 항상 null 이고 jsdom 에는 레이아웃이
 * 없어 쓸 수 없다. 지원하는 브라우저에서는 checkVisibility 를 쓰고,
 * 없으면 보이는 것으로 간주한다 (포커스를 잃는 쪽보다 안전하다).
 */
function isVisible(element: HTMLElement): boolean {
  if (element.hasAttribute('inert')) return false
  if (element.getAttribute('aria-hidden') === 'true') return false
  if (element.closest('[inert]') !== null) return false

  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })
  }

  return true
}

/** 컨테이너 안에서 실제로 포커스를 받을 수 있는 요소를 문서 순서로 반환한다. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible)
}
