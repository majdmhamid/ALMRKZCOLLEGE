import { describe, expect, it } from 'vitest'

import { isSitePath } from '@/lib/preview'

describe('isSitePath (preview / exit-preview redirects)', () => {
  it.each(['/', '/ar', '/he/news/some-slug', '/ar#graduates', '/ar/course/x?y=1'])('allows %s', (p) =>
    expect(isSitePath(p)).toBe(true),
  )
  it.each(['//evil.example', '/\\evil.example', '\\\\evil.example', 'https://evil.example', 'evil', '/\t/evil.example', ''])(
    'refuses %s',
    (p) => expect(isSitePath(p)).toBe(false),
  )
})
