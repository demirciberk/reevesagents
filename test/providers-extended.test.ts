import { describe, it, expect } from 'vitest'
import { buildCommand } from '../src/core/providers.js'

describe('buildCommand: extended providers', () => {
  describe('hermes', () => {
    it('binary is hermes', () => {
      expect(buildCommand({ provider: 'hermes', permissions: 'ask', model: '' })[0]).toBe('hermes')
    })

    it('includes chat subcommand', () => {
      expect(buildCommand({ provider: 'hermes', permissions: 'ask', model: '' })).toContain('chat')
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'hermes', permissions: 'ask', model: 'claude-opus-4' })
      expect(cmd).toContain('--model')
      expect(cmd).toContain('claude-opus-4')
    })

    it('splits provider-prefixed model catalog values', () => {
      const cmd = buildCommand({ provider: 'hermes', permissions: 'ask', model: 'openrouter:anthropic/claude-sonnet-4.6' })
      expect(cmd).toEqual(['hermes', 'chat', '--provider', 'openrouter', '--model', 'anthropic/claude-sonnet-4.6'])
    })

    it('does not split plain model ids that contain colons', () => {
      const cmd = buildCommand({ provider: 'hermes', permissions: 'ask', model: 'gpt-oss:120b' })
      expect(cmd).toEqual(['hermes', 'chat', '--model', 'gpt-oss:120b'])
    })

    it('skip permissions includes --yolo', () => {
      const cmd = buildCommand({ provider: 'hermes', permissions: 'skip', model: '' })
      expect(cmd).toContain('--yolo')
    })

    it('ask permissions does not include --yolo', () => {
      const cmd = buildCommand({ provider: 'hermes', permissions: 'ask', model: '' })
      expect(cmd).not.toContain('--yolo')
    })
  })

  describe('kimi', () => {
    it('binary is kimi', () => {
      expect(buildCommand({ provider: 'kimi', permissions: 'ask', model: '' })[0]).toBe('kimi')
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'kimi', permissions: 'ask', model: 'kimi-code/kimi-for-coding' })
      expect(cmd).toEqual(['kimi', '--model', 'kimi-code/kimi-for-coding'])
    })

    it('skip permissions includes --yolo', () => {
      const cmd = buildCommand({ provider: 'kimi', permissions: 'skip', model: '' })
      expect(cmd).toContain('--yolo')
    })
  })

  describe('deepseek', () => {
    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'deepseek', permissions: 'ask', model: 'deepseek-coder:6.7b' })
      expect(cmd).toEqual(['deepseek', '--model', 'deepseek-coder:6.7b'])
    })

    it('skip permissions does not add undocumented flags', () => {
      expect(buildCommand({ provider: 'deepseek', permissions: 'skip', model: '' })).toEqual(['deepseek'])
    })
  })

  describe('pi', () => {
    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'pi', permissions: 'ask', model: 'sonnet' })
      expect(cmd).toEqual(['pi', '--model', 'sonnet'])
    })

    it('skip permissions does not add undocumented flags', () => {
      expect(buildCommand({ provider: 'pi', permissions: 'skip', model: '' })).toEqual(['pi'])
    })
  })

  describe('qwen', () => {
    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'qwen', permissions: 'ask', model: 'qwen3-coder-plus' })
      expect(cmd).toEqual(['qwen', '--model', 'qwen3-coder-plus'])
    })

    it('skip permissions uses approval mode yolo', () => {
      const cmd = buildCommand({ provider: 'qwen', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['qwen', '--approval-mode', 'yolo'])
    })
  })

  describe('aider', () => {
    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'aider', permissions: 'ask', model: 'deepseek/deepseek-chat' })
      expect(cmd).toEqual(['aider', '--model', 'deepseek/deepseek-chat'])
    })

    it('skip permissions uses yes-always', () => {
      const cmd = buildCommand({ provider: 'aider', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['aider', '--yes-always'])
    })
  })

  describe('gemini', () => {
    it('binary is gemini', () => {
      expect(buildCommand({ provider: 'gemini', permissions: 'ask', model: '' })[0]).toBe('gemini')
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'gemini', permissions: 'ask', model: 'gemini-3.5-flash' })
      expect(cmd).toEqual(['gemini', '--model', 'gemini-3.5-flash'])
    })

    it('skip permissions uses approval mode yolo, not the --yolo shorthand', () => {
      const cmd = buildCommand({ provider: 'gemini', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['gemini', '--approval-mode', 'yolo'])
    })

    it('ask permissions does not include approval mode', () => {
      const cmd = buildCommand({ provider: 'gemini', permissions: 'ask', model: '' })
      expect(cmd).not.toContain('--approval-mode')
      expect(cmd).not.toContain('yolo')
    })
  })

  describe('cline', () => {
    it('binary is cline and launches the TUI', () => {
      expect(buildCommand({ provider: 'cline', permissions: 'ask', model: '' })).toEqual(['cline', '--tui'])
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'cline', permissions: 'ask', model: 'anthropic/claude-sonnet-4-6' })
      expect(cmd).toEqual(['cline', '--tui', '--model', 'anthropic/claude-sonnet-4-6'])
    })

    it('skip permissions uses interactive auto-approve', () => {
      const cmd = buildCommand({ provider: 'cline', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['cline', '--tui', '--auto-approve', 'true'])
    })

    it('ask permissions does not include auto-approve', () => {
      const cmd = buildCommand({ provider: 'cline', permissions: 'ask', model: '' })
      expect(cmd).not.toContain('--auto-approve')
    })
  })

  describe('crush', () => {
    it('binary is crush', () => {
      expect(buildCommand({ provider: 'crush', permissions: 'ask', model: '' })).toEqual(['crush'])
    })

    it('skip permissions includes --yolo', () => {
      const cmd = buildCommand({ provider: 'crush', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['crush', '--yolo'])
    })

    it('interactive session has no model flag, so the model knob is not launched', () => {
      const cmd = buildCommand({ provider: 'crush', permissions: 'ask', model: 'anthropic/claude-sonnet-4-6' })
      expect(cmd).toEqual(['crush'])
    })
  })

  describe('goose', () => {
    it('binary is goose and launches the session subcommand', () => {
      expect(buildCommand({ provider: 'goose', permissions: 'ask', model: '' })).toEqual(['goose', 'session'])
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'goose', permissions: 'ask', model: 'claude-sonnet-4-6' })
      expect(cmd).toEqual(['goose', 'session', '--model', 'claude-sonnet-4-6'])
    })

    it('skip permissions adds no flag; goose reads GOOSE_MODE from its config', () => {
      expect(buildCommand({ provider: 'goose', permissions: 'skip', model: '' })).toEqual(['goose', 'session'])
    })
  })

  describe('kilo', () => {
    it('binary is kilo', () => {
      expect(buildCommand({ provider: 'kilo', permissions: 'ask', model: '' })).toEqual(['kilo'])
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'kilo', permissions: 'ask', model: 'kilo/~google/gemini-pro-latest' })
      expect(cmd).toEqual(['kilo', '--model', 'kilo/~google/gemini-pro-latest'])
    })

    it('skip permissions includes --auto', () => {
      const cmd = buildCommand({ provider: 'kilo', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['kilo', '--auto'])
    })
  })

  describe('letta', () => {
    it('binary is letta', () => {
      expect(buildCommand({ provider: 'letta', permissions: 'ask', model: '' })).toEqual(['letta', '--new'])
    })

    it('includes --model when set', () => {
      const cmd = buildCommand({ provider: 'letta', permissions: 'ask', model: 'zai-org/GLM-5.3-max' })
      expect(cmd).toEqual(['letta', '--new', '--model', 'zai-org/GLM-5.3-max'])
    })

    it('skip permissions uses permission mode unrestricted', () => {
      const cmd = buildCommand({ provider: 'letta', permissions: 'skip', model: '' })
      expect(cmd).toEqual(['letta', '--new', '--permission-mode', 'unrestricted'])
    })
  })
})
