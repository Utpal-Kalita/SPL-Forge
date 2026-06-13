import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type LlmProvider = 'splunk' | 'local' | 'mock';
export type SplunkMode = 'mcp' | 'mock' | 'rest';

export type ForgeConfig = {
  llmModel: string;
  llmProvider: LlmProvider;
  splunkModelEndpoint?: string;
  splunkModelToken?: string;
  splunkModelTool: string;
  splunkMcpAllowSelfSigned: boolean;
  splunkMcpEndpoint?: string;
  splunkMcpToken?: string;
  splunkAllowSelfSigned: boolean;
  splunkMode: SplunkMode;
  splunkPassword?: string;
  splunkApp: string;
  splunkOwner: string;
  splunkRepairAutoRun: boolean;
  splunkSearchLimit: number;
  splunkSource: string;
  splunkToken?: string;
  splunkUrl: string;
  splunkWebUrl?: string;
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
    llmModel: envValue('SPL_FORGE_LLM_MODEL') ?? defaultModelForProvider(llmProvider),
    llmProvider,
    splunkModelEndpoint: envValue('SPL_FORGE_SPLUNK_MODEL_ENDPOINT'),
    splunkModelToken: envValue('SPL_FORGE_SPLUNK_MODEL_TOKEN') ?? envValue('SPL_FORGE_SPLUNK_TOKEN') ?? envValue('SPLUNK_TOKEN'),
    splunkModelTool: envValue('SPL_FORGE_SPLUNK_MODEL_TOOL') ?? 'saia_generate_spl',
    splunkMcpAllowSelfSigned: parseBoolean(envValue('SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED'), false),
    splunkMcpEndpoint: envValue('SPL_FORGE_SPLUNK_MCP_ENDPOINT') ?? envValue('SPLUNK_MCP_URL'),
    splunkMcpToken: envValue('SPL_FORGE_SPLUNK_MCP_TOKEN') ?? envValue('SPLUNK_MCP_TOKEN'),
    splunkAllowSelfSigned: parseBoolean(
      envValue('SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED'),
      parseBoolean(envValue('SPLUNK_VERIFY_SSL'), false) === false,
    ),
    splunkMode,
    splunkPassword: envValue('SPL_FORGE_SPLUNK_PASSWORD') ?? envValue('SPLUNK_PASSWORD'),
    splunkApp: envValue('SPL_FORGE_SPLUNK_APP') ?? 'search',
    splunkOwner: envValue('SPL_FORGE_SPLUNK_OWNER') ?? 'nobody',
    splunkRepairAutoRun: parseBoolean(envValue('SPL_FORGE_REPAIR_AUTO_RUN'), true),
    splunkSearchLimit: parseInteger(envValue('SPL_FORGE_SPLUNK_SEARCH_LIMIT'), 10),
    splunkSource: envValue('SPL_FORGE_SPLUNK_SOURCE') ?? 'self_hosted_trial',
    splunkToken: envValue('SPL_FORGE_SPLUNK_TOKEN'),
    splunkUrl: envValue('SPL_FORGE_SPLUNK_URL') ?? envValue('SPLUNK_HOST') ?? 'https://localhost:8089',
    splunkWebUrl: envValue('SPLUNK_WEB_URL'),
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
  if (value === 'splunk' || value === 'local' || value === 'mock') {
    return value;
  }

  return 'splunk';
}

function normalizeSplunkMode(value: string | undefined): SplunkMode {
  if (value === 'mcp' || value === 'mock' || value === 'rest') {
    return value;
  }

  return 'mcp';
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
    case 'splunk':
      return 'splunk-hosted-model';
    case 'local':
      return 'local-spl-forge';
    case 'mock':
    default:
      return 'mock-spl-forge-v1';
  }
}
