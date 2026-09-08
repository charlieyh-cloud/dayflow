import { Route, Routes } from 'react-router-dom'
import { PlaceholderPage } from '@/app/PlaceholderPage'

/**
 * STEP 1 의 라우트는 자리표시자다.
 * STEP 2 에서 일정 CRUD, STEP 3 에서 캘린더 뷰가 이 자리에 들어간다.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PlaceholderPage
            title="오늘"
            description="현재 시각을 기준으로 지금 해야 할 일과 다음 일정을 보여줍니다."
            step="STEP 3"
          />
        }
      />
      <Route
        path="/calendar"
        element={
          <PlaceholderPage
            title="캘린더"
            description="일간 타임라인, 주간 그리드, 월간 달력으로 일정을 확인합니다."
            step="STEP 3"
          />
        }
      />
      <Route
        path="/list"
        element={
          <PlaceholderPage
            title="목록"
            description="시간을 정하지 않은 할 일을 카테고리·우선순위·마감 임박순으로 봅니다."
            step="STEP 2"
          />
        }
      />
      <Route
        path="/settings"
        element={
          <PlaceholderPage
            title="설정"
            description="테마, 글자 크기, 알림 기본값, 방해 금지 시간대를 조정합니다."
            step="STEP 4"
          />
        }
      />
      <Route
        path="*"
        element={
          <PlaceholderPage
            title="페이지를 찾을 수 없습니다"
            description="주소를 다시 확인해 주세요. 상단 메뉴에서 원하는 화면으로 이동할 수 있습니다."
          />
        }
      />
    </Routes>
  )
}
