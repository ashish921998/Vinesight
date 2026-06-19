import { describe, it, expect } from 'vitest'
import { buildJoinMessage } from '../join-message'

describe('buildJoinMessage', () => {
  it('includes the organization name and the join code', () => {
    const message = buildJoinMessage('Green Valley Agronomy', 'green-valley')
    expect(message).toContain('Green Valley Agronomy')
    expect(message).toContain('green-valley')
  })

  it('quotes the organization name in the message', () => {
    expect(buildJoinMessage('Green Valley Agronomy', 'green-valley')).toContain(
      '"Green Valley Agronomy"'
    )
  })

  it('falls back to "your consultant" when the name is empty', () => {
    const message = buildJoinMessage('', 'green-valley')
    expect(message).toContain('your consultant')
    expect(message).not.toContain('""')
    expect(message).toContain('green-valley')
  })

  it('falls back to "your consultant" when the name is whitespace-only', () => {
    const message = buildJoinMessage('   ', 'green-valley')
    expect(message).toContain('your consultant')
    expect(message).not.toContain('"   "')
  })
})
