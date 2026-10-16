// Single source of truth for the helper tool CLIs reevesagents advertises to
// agents: web search, remote GPU/TPU runtimes, the model hub, local or cloud
// models. These are not providers (they cannot take a chat task and are never
// spawned into a run); they are utilities an agent runs from its own shell.
// The CLI `tools` command, the MCP list_tools tool, and the doctor tools check
// all derive from this map, so adding a tool is one entry here.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { binaryOnPath } from './providers.js'

export type Tool = 'pplx' | 'colab' | 'hf' | 'ollama'

export interface ToolDef {
  id: Tool
  bin: string
  displayName: string
  color: string
  // One sentence, English, what the tool is for.
  purpose: string
  // Environment variables whose presence means signed in.
  authEnv: readonly string[]
  // Filesystem paths whose existence means signed in. Existence only: the file
  // is never read, it holds credentials. A leading ~/ resolves against the
  // home dir.
  authFiles?: readonly string[]
  // A status command judged only by its exit code (0 means yes). stdin is
  // closed and output is discarded: it can contain account names. Use only
  // commands verified against the tool's real behavior; a probe that cannot
  // run counts as unknown.
  authCheckArgs?: readonly string[]
  // What the auth probe reports for this tool, shown by every surface
  // ('signed in' for credential checks, 'reachable' for a service check).
  stateLabel: string
  // A verified command line an agent can run as a starting point.
  example: string
  docsUrl: string
}

// Insertion order here is the canonical tool order used by every surface.
export const TOOL_REGISTRY: Record<Tool, ToolDef> = {
  pplx: {
    id: 'pplx',
    bin: 'pplx',
    displayName: 'Perplexity CLI',
    color: '#3f7f8d', // muted Perplexity teal
    purpose: 'Web search and page snippets from Perplexity, as JSON.',
    authEnv: ['PERPLEXITY_API_KEY'],
    authFiles: ['~/.config/perplexity/credentials.json'],
    stateLabel: 'signed in',
    example: 'pplx search web "node 24 release date" --limit 3',
    docsUrl: 'https://github.com/perplexityai/perplexity-cli',
  },
  colab: {
    id: 'colab',
    bin: 'colab',
    displayName: 'Google Colab CLI',
    color: '#d9a13d', // muted Colab amber
    purpose: 'CPU, GPU and TPU runtimes on Google Colab: run scripts and notebooks remotely.',
    authEnv: [],
    // --auth=oauth2 must precede the subcommand; never adc, which would use
    // this machine's gcloud Application Default Credentials.
    authCheckArgs: ['--auth=oauth2', 'whoami'],
    stateLabel: 'signed in',
    example: 'colab --auth=oauth2 run job.py',
    docsUrl: 'https://github.com/googlecolab/google-colab-cli',
  },
  hf: {
    id: 'hf',
    bin: 'hf',
    displayName: 'Hugging Face CLI',
    color: '#d4c04e', // muted Hugging Face yellow
    purpose: 'Download and upload models and datasets, run jobs on the Hugging Face Hub.',
    authEnv: ['HF_TOKEN'],
    authCheckArgs: ['auth', 'whoami'],
    stateLabel: 'signed in',
    example: 'hf download Qwen/Qwen3-0.6B config.json',
    docsUrl: 'https://huggingface.co/docs/huggingface_hub/en/guides/cli',
  },
  ollama: {
    id: 'ollama',
    bin: 'ollama',
    displayName: 'Ollama',
    color: '#8b93a6', // slate gray, the monochrome Ollama brand
    purpose: 'Run local or Ollama cloud models from the terminal.',
    authEnv: [],
    // The CLI always needs a running ollama server; there is no non-interactive
    // sign-in status command, so `ollama list` reports the server instead.
    authCheckArgs: ['list'],
    stateLabel: 'reachable',
    example: 'ollama run gemma4:31b-cloud "summarize README.md"',
    docsUrl: 'https://github.com/ollama/ollama/tree/main/docs',
  },
}

export const TOOL_DEFS: readonly ToolDef[] = Object.values(TOOL_REGISTRY)

export const TOOLS = Object.keys(TOOL_REGISTRY) as Tool[]

export type ToolState = 'yes' | 'no' | 'unknown'

const TOOL_AUTH_CHECK_TIMEOUT_MS = 3000

function authFilePresent(path: string, home: string): boolean {
  if (!path.startsWith('~/')) return existsSync(path)
  return existsSync(join(home, path.slice(2)))
}

// State for one tool: yes when an authEnv variable is set or an authFiles path
// exists; otherwise a declared authCheckArgs command is judged by exit code
// alone (stdin closed, output discarded); anything else (no probe, or the probe
// could not run) is unknown.
export function toolState(def: ToolDef, env: Record<string, string | undefined> = process.env, home = homedir()): ToolState {
  if (def.authEnv.some(name => Boolean(env[name]))) return 'yes'
  if ((def.authFiles ?? []).some(path => authFilePresent(path, home))) return 'yes'
  if (!def.authCheckArgs) return 'unknown'
  try {
    const checked = spawnSync(def.bin, [...def.authCheckArgs], {
      stdio: 'ignore',
      timeout: TOOL_AUTH_CHECK_TIMEOUT_MS,
    })
    if (checked.error) return 'unknown'
    return checked.status === 0 ? 'yes' : 'no'
  } catch {
    return 'unknown'
  }
}

export interface ToolStatus {
  id: Tool
  bin: string
  display_name: string
  color: string
  purpose: string
  example: string
  docs_url: string
  installed: boolean
  state: ToolState
  // What `state` means for this tool: 'signed in' or 'reachable'.
  state_means: string
}

// One row per tool for the CLI, MCP, and doctor surfaces, in registry order.
export function detectToolStatuses(
  env: Record<string, string | undefined> = process.env,
  home = homedir(),
): ToolStatus[] {
  return TOOL_DEFS.map(def => ({
    id: def.id,
    bin: def.bin,
    display_name: def.displayName,
    color: def.color,
    purpose: def.purpose,
    example: def.example,
    docs_url: def.docsUrl,
    installed: binaryOnPath(def.bin),
    state: toolState(def, env, home),
    state_means: def.stateLabel,
  }))
}
