import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type LlmProvider = 'groq' | 'openai' | 'anthropic' | 'local' | 'mock';

export type ForgeConfig = {
  llmApiKey?: string;
  groqApiKey?: string;
  groqModel: string;
  llmModel: string;
  llmProvider: LlmProvider;
  splunkMode: string;
  splunkSource: string;
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

  return {
    llmApiKey: envValue('SPL_FORGE_LLM_API_KEY'),
    groqApiKey: envValue('GROQ_API_KEY') ?? envValue('SPL_FORGE_GROQ_API_KEY'),
    groqModel: envValue('GROQ_MODEL') ?? 'llama-3.1-8b-instant',
    llmModel: envValue('SPL_FORGE_LLM_MODEL') ?? defaultModelForProvider(llmProvider),
    llmProvider,
    splunkMode: envValue('SPL_FORGE_SPLUNK_MODE') ?? 'rest',
    splunkSource: envValue('SPL_FORGE_SPLUNK_SOURCE') ?? 'self_hosted_trial',
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
