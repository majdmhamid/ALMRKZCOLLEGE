import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Images are already resized to WebP by Payload (media sizes), so plain <img> is fine.
    files: ['src/components/site/**'],
    rules: { '@next/next/no-img-element': 'off' },
  },
  {
    // public/pdfjs/ = pdf.js copied in by `postinstall` (gitignored, minified third-party code)
    ignores: ['.next/', 'public/pdfjs/', 'src/payload-types.ts', 'src/payload-generated-schema.ts', 'src/migrations/', 'src/app/(payload)/admin/importMap.js'],
  },
]

export default eslintConfig
