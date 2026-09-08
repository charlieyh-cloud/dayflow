/**
 * Conventional Commits 규칙 (PRD 8.3).
 * type 과 scope 를 PRD 에 정의된 값으로 제한한다.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'a11y', 'perf', 'refactor', 'test', 'docs', 'chore', 'ci', 'build', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'tasks',
        'categories',
        'notifications',
        'sw',
        'chat',
        'map',
        'sync',
        'auth',
        'views',
        'ui',
        'db',
        'a11y',
        'deps',
        'config',
        'ci',
        'release',
      ],
    ],
    'scope-empty': [1, 'never'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}
