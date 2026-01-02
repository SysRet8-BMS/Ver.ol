import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{ts}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname, 
        project: ['./tsconfig.json'],        
      },
    },
    extends: [
      tseslint.configs.recommended,
    ],
  },
])
