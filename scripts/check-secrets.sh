#!/usr/bin/env sh
#
# 스테이징된 변경분에서 API 키·시크릿으로 보이는 문자열을 찾는다.
# husky pre-commit 에서 실행되며, 하나라도 걸리면 커밋을 막는다.
#
# .gitignore 는 파일 이름에만 의존하므로 오타 하나로 뚫린다.
# (실제로 .env 를 .emv.md 로 저장해 커밋 직전까지 간 적이 있다.)
# 이 검사는 이름이 아니라 내용을 본다.
#
# 오탐이 확실한 경우에만: git commit --no-verify

set -e

# 스테이징된 파일 목록 (삭제된 파일 제외)
FILES=$(git diff --cached --name-only --diff-filter=ACM)
[ -z "$FILES" ] && exit 0

# 검사에서 제외할 경로 — 예시 파일과 이 스크립트 자신
EXCLUDE='^(\.env\.example|scripts/check-secrets\.sh|docs/)'

FOUND=0

# 패턴: 이름 | 정규식
# 접두사가 뚜렷한 키만 잡아 오탐을 줄인다.
check() {
  label="$1"
  pattern="$2"

  for file in $FILES; do
    echo "$file" | grep -qE "$EXCLUDE" && continue
    [ -f "$file" ] || continue

    # 스테이징된 내용(작업 트리가 아니라)을 검사한다.
    if git show ":$file" 2>/dev/null | grep -nEq "$pattern"; then
      line=$(git show ":$file" | grep -nE "$pattern" | head -1 | cut -d: -f1)
      echo "  [$label]  $file:$line"
      FOUND=1
    fi
  done
}

echo "시크릿 검사 중..."

check "OpenRouter 키"   'sk-or-v1-[A-Za-z0-9]{16,}'
check "Anthropic 키"    'sk-ant-[A-Za-z0-9_-]{16,}'
check "OpenAI 키"       'sk-(proj-)?[A-Za-z0-9]{32,}'
check "AWS 액세스 키"   'AKIA[0-9A-Z]{16}'
check "Google API 키"   'AIza[0-9A-Za-z_-]{35}'
check "GitHub 토큰"     'gh[pousr]_[A-Za-z0-9]{36,}'
check "Slack 토큰"      'xox[baprs]-[A-Za-z0-9-]{10,}'
check "Supabase 서비스 키" 'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.'
check "개인 키 블록"    'BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY'
check "VAPID 개인 키"   'VAPID_PRIVATE_KEY=[A-Za-z0-9_-]{20,}'

# 클라이언트 번들에 들어가는 VITE_ 접두사에 비밀 키를 붙이는 실수를 막는다.
check "VITE_ 접두사가 붙은 비밀 키" 'VITE_[A-Z_]*(SECRET|PRIVATE|SERVICE_ROLE|API_KEY|TOKEN)[A-Z_]*=[^[:space:]]{8,}'

if [ "$FOUND" -eq 1 ]; then
  cat <<'MSG'

커밋을 중단했습니다. 위 위치에 시크릿으로 보이는 값이 있습니다.

이 저장소는 공개되어 있습니다. 공개 저장소에 올라간 키는 몇 분 안에
자동으로 수집되므로, 커밋을 되돌리는 것만으로는 안전해지지 않습니다.

조치:
  1) 해당 값을 코드에서 지우고 .env 로 옮기세요 (.env 는 커밋되지 않습니다).
  2) 이미 노출됐다면 발급처에서 키를 폐기하고 새로 발급하세요.
  3) 예시 값이라 오탐이 확실하면: git commit --no-verify

MSG
  exit 1
fi

echo "시크릿 검사 통과"
exit 0
