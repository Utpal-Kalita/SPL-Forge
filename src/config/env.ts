import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type LlmProvider = 'gemini' | 'openai' | 'anthropic' | 'local' | 'mock';

export type ForgeConfig = {
  llmApiKey?: string;
  geminiApiKey?: string;
  geminiModel: string;
  llmModel: string;
  llmProvider: LlmProvider;
  splunkMode: string;
  splunkSource: string;
  workspaceName: string;
};

let cachedConfig: ForgeConfig | undefined;

export function loadForgeConfig(): ForgeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const workspaceName = workspaceFolder?.name ?? 'workspace';
  const localEnvValues = workspaceFolder ? parseEnvFile(path.join(workspaceFolder.uri.fsPath, '.env.local')) : {};

  const envValue = (key: string) => process.env[key] ?? localEnvValues[key];
  const llmProvider = normalizeProvider(envValue('SPL_FORGE_LLM_PROVIDER'));

  cachedConfig = {
    llmApiKey: envValue('SPL_FORGE_LLM_API_KEY'),
    geminiApiKey: envValue('SPL_FORGE_GEMINI_API_KEY') ?? envValue('GEMINI_API_KEY') ?? envValue('GOOGLE_API_KEY'),
    geminiModel: envValue('SPL_FORGE_GEMINI_MODEL') ?? 'gemini-2.0-flash',
    llmModel: envValue('SPL_FORGE_LLM_MODEL') ?? defaultModelForProvider(llmProvider),
    llmProvider,
    splunkMode: envValue('SPL_FORGE_SPLUNK_MODE') ?? 'rest',
    splunkSource: envValue('SPL_FORGE_SPLUNK_SOURCE') ?? 'self_hosted_trial',
    workspaceName,
  };

  return cachedConfig;
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
  if (value === 'gemini' || value === 'openai' || value === 'anthropic' || value === 'local' || value === 'mock') {
    return value;
  }

  return 'mock';
}

function defaultModelForProvider(provider: LlmProvider) {
  switch (provider) {
    case 'gemini':
      return 'gemini-2.0-flash';
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
