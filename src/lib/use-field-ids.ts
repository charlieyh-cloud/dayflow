import { useId } from 'react'

export interface FieldIds {
  inputId: string
  hintId: string | undefined
  errorId: string | undefined
  /** aria-describedby 에 넣을 값. 연결할 것이 없으면 undefined. */
  describedBy: string | undefined
}

/**
 * 폼 컨트롤과 힌트·오류 메시지를 잇는 id 를 만든다.
 *
 * 오류 메시지가 `aria-describedby` 로 연결되지 않으면 스크린리더 사용자는
 * 무엇이 잘못됐는지 알 수 없다. 모든 폼 컴포넌트가 이 훅을 쓴다.
 */
export function useFieldIds(providedId: string | undefined, hasHint: boolean, hasError: boolean): FieldIds {
  const generated = useId()
  const inputId = providedId ?? generated
  const hintId = hasHint ? `${inputId}-hint` : undefined
  const errorId = hasError ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return { inputId, hintId, errorId, describedBy }
}
