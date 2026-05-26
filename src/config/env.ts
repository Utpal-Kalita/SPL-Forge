import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type LlmProvider = 'groq' | 'openai' | 'anthropic' | 'local' | 'mock';
export type SplunkMode = 'mcp' | 'mock' | 'rest';

export type ForgeConfig = {
  llmApiKey?: string;
  groqApiKey?: string;
  groqModel: string;
  llmModel: string;
  llmProvider: LlmProvider;
  splunkMcpAllowSelfSigned: boolean;
  splunkMcpEndpoint?: string;
  splunkMcpToken?: string;
  splunkAllowSelfSigned: boolean;
  splunkMode: SplunkMode;
  splunkPassword?: string;
  splunkRepairAutoRun: boolean;
  splunkSearchLimit: number;
  splunkSource: string;
  splunkToken?: string;
  splunkUrl: string;
  splunkUsername?: string;
  workspaceName: string;
};

type LoadForgeConfigOptions = {
  extensionRootPath?: string;
};

export function loadForgeConfig(options: LoadForgeConfigOptions = {}): ForgeConfig {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const workspaceName = workspaceFolder?.name ?? 'workspace';
  const workspaceEnvValues = workspaceFolder ? parseEnvFile(path.join(workspaceFolder.uri.fsPath, '.env.local')) : {};
  const extensionEnvValues = options.extensionRootPath ? parseEnvFile(path.join(options.extensionRootPath, '.env.local')) : {};

  const envValue = (key: string) => process.env[key] ?? workspaceEnvValues[key] ?? extensionEnvValues[key];
  const llmProvider = normalizeProvider(envValue('SPL_FORGE_LLM_PROVIDER'));
  const splunkMode = normalizeSplunkMode(envValue('SPL_FORGE_SPLUNK_MODE'));

  return {
    llmApiKey: envValue('SPL_FORGE_LLM_API_KEY'),
    groqApiKey: envValue('GROQ_API_KEY') ?? envValue('SPL_FORGE_GROQ_API_KEY'),
    groqModel: envValue('GROQ_MODEL') ?? 'llama-3.1-8b-instant',
    llmModel: envValue('SPL_FORGE_LLM_MODEL') ?? defaultModelForProvider(llmProvider),
    llmProvider,
    splunkMcpAllowSelfSigned: parseBoolean(envValue('SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED'), false),
    splunkMcpEndpoint: envValue('SPL_FORGE_SPLUNK_MCP_ENDPOINT') ?? envValue('SPLUNK_MCP_URL'),
    splunkMcpToken: envValue('SPL_FORGE_SPLUNK_MCP_TOKEN') ?? envValue('SPLUNK_MCP_TOKEN'),
    splunkAllowSelfSigned: parseBoolean(
      envValue('SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED'),
      parseBoolean(envValue('SPLUNK_VERIFY_SSL'), false) === false,
    ),
    splunkMode,
    splunkPassword: envValue('SPL_FORGE_SPLUNK_PASSWORD') ?? envValue('SPLUNK_PASSWORD'),
    splunkRepairAutoRun: parseBoolean(envValue('SPL_FORGE_REPAIR_AUTO_RUN'), true),
    splunkSearchLimit: parseInteger(envValue('SPL_FORGE_SPLUNK_SEARCH_LIMIT'), 10),
    splunkSource: envValue('SPL_FORGE_SPLUNK_SOURCE') ?? 'self_hosted_trial',
    splunkToken: envValue('SPL_FORGE_SPLUNK_TOKEN'),
    splunkUrl: envValue('SPL_FORGE_SPLUNK_URL') ?? envValue('SPLUNK_HOST') ?? 'https://localhost:8089',
    splunkUsername: envValue('SPL_FORGE_SPLUNK_USERNAME') ?? envValue('SPLUNK_USERNAME'),
    workspaceName,
  };
}

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const entries = raw.split(/\r?\n/);
  const result: Record<string, string> = {};

  for (const entry of entries) {
    const trimmed = entry.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    result[key] = value;
  }

  return result;
}

function normalizeProvider(value: string | undefined): LlmProvider {
  if (value === 'groq' || value === 'openai' || value === 'anthropic' || value === 'local' || value === 'mock') {
    return value;
  }

  return 'mock';
}

function normalizeSplunkMode(value: string | undefined): SplunkMode {
  if (value === 'mcp' || value === 'mock' || value === 'rest') {
    return value;
  }

  return 'mock';
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

function parseInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function defaultModelForProvider(provider: LlmProvider) {
  switch (provider) {
    case 'groq':
      return 'llama-3.1-8b-instant';
    case 'openai':
      return 'gpt-4.1-mini';
    case 'anthropic':
      return 'claude-3-5-sonnet-latest';
    case 'local':
      return 'local-spl-forge';
    case 'mock':
    default:
      return 'mock-spl-forge-v1';
  }
}
