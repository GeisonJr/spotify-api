import tseslint from 'typescript-eslint'

export default tseslint.config([
  {
    files: [
      '**/*.ts'
    ],
    ignores: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/dist/**',
      '**/jest.config.js'
    ]
  },
  tseslint.configs.recommended
])
