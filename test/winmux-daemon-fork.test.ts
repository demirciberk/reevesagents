// hideForkedConsoles defaults windowsHide on child_process.fork for both overloads.
import childProcess from 'node:child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hideForkedConsoles } from '../src/core/winmux-daemon.js'

describe('hideForkedConsoles', () => {
  const original = childProcess.fork
  afterEach(() => { childProcess.fork = original })

  it('adds windowsHide without overriding explicit options', () => {
    const spy = vi.fn()
    childProcess.fork = spy as unknown as typeof childProcess.fork
    hideForkedConsoles()
    childProcess.fork('agent.js', ['42'])
    childProcess.fork('agent.js', { cwd: 'x' })
    childProcess.fork('agent.js', undefined, { windowsHide: false })
    expect(spy.mock.calls).toEqual([
      ['agent.js', ['42'], { windowsHide: true }],
      ['agent.js', [], { windowsHide: true, cwd: 'x' }],
      ['agent.js', [], { windowsHide: false }],
    ])
  })
})
