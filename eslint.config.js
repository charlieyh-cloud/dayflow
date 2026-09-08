import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules', 'dev-dist'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.serviceworker },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 접근성 규칙 전체를 오류로 승격한다. 경고는 무시되기 쉽다.
      ...Object.fromEntries(Object.keys(jsxA11y.rules).map((rule) => [`jsx-a11y/${rule}`, 'error'])),

      // 아래 두 규칙만 예외로 둔다. 나머지 jsx-a11y 규칙은 전부 오류다.
      //
      // prefer-tag-over-role: <output> 은 계산 결과를 위한 요소이고,
      // 네이티브 <dialog> 는 showModal() 로 top layer 에 올려야 해서
      // 포털 기반 모달과 동작이 다르다. role 을 명시하는 편이 정확하다.
      // 실제 접근성은 axe(브라우저) 검사와 스크린리더 테스트로 확인한다.
      'jsx-a11y/prefer-tag-over-role': 'off',
      // label-has-for: 사용이 권장되지 않는 규칙이다.
      // label-has-associated-control 이 대체하며 그 규칙은 켜져 있다.
      'jsx-a11y/label-has-for': 'off',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── CLAUDE.md 규칙 강제 ──
      // any 금지
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // default export 금지 (설정 파일은 아래에서 예외 처리)
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true, named: true } }],

      // 상대경로 상위 이동 금지 — @/ 별칭을 쓴다
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './../*'],
              message: '상위 경로 대신 @/ 절대경로 별칭을 사용하세요.',
            },
          ],
        },
      ],

      // 앱 데이터는 IndexedDB 에 저장한다
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: '앱 데이터는 IndexedDB(Dexie)에 저장하세요.' },
        { name: 'sessionStorage', message: '앱 데이터는 IndexedDB(Dexie)에 저장하세요.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: '앱 데이터는 IndexedDB(Dexie)에 저장하세요.' },
        {
          object: 'window',
          property: 'sessionStorage',
          message: '앱 데이터는 IndexedDB(Dexie)에 저장하세요.',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // Service Worker
  {
    files: ['src/sw.ts'],
    languageOptions: { globals: globals.serviceworker },
  },

  // 설정 파일과 스크립트는 default export 가 필요하다
  {
    files: [
      '*.config.{ts,js}',
      'eslint.config.js',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'commitlint.config.js',
      'scripts/**/*.mjs',
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: false },
    },
    rules: {
      // 타입 정보가 필요한 규칙을 끈다. spread 를 rules 안에서 해야
      // 아래 항목과 병합된다 (바깥에서 하면 통째로 덮어써진다).
      ...tseslint.configs.disableTypeChecked.rules,
      'no-restricted-exports': 'off',
      'no-console': 'off',
    },
  },

  // 테스트
  {
    files: ['tests/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      'no-restricted-exports': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Prettier 와 충돌하는 포맷 규칙을 끈다. 반드시 마지막에 둔다.
  prettier,
)
