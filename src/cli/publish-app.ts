import * as fs from 'fs';
import * as path from 'path';
import { runForgePrompt } from '../agent/workflow';
import { buildSplunkAppPackage } from '../artifacts/package';
import type { ForgeConfig, LlmProvider, SplunkMode } from '../config/env';
import { publishSplunkAppPackage } from '../splunk/publish';

type EnvMap = Record<string, string | undefined>;

const defaultPrompt = 'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.';

async function main() {
  const env = loadEnv();
  const prompt = readArg('--prompt') ?? env.SPL_FORGE_PUBLISH_PROMPT ?? defaultPrompt;
  const mode = normalizeMode(readArg('--mode') ?? env.SPL_FORGE_SPLUNK_MODE ?? 'mcp');
  const appId = readArg('--app-id') ?? env.SPL_FORGE_EXPORT_APP_ID ?? 'spl_forge_generated_app';
  const config = buildConfig(mode, env);
  const result = await runForgePrompt(prompt, config);
  const appPackage = buildSplunkAppPackage({ appId, result });
  const publishResult = await publishSplunkAppPackage(config, appPackage);

  console.log(`Published to Splunk app: ${publishResult.app}`);
  console.log(`Owner: ${publishResult.owner}`);
  console.log(`Published artifacts: ${publishResult.published.join(', ')}`);
  if (publishResult.dashboardUrl) {
    console.log(`Dashboard URL: ${publishResult.dashboardUrl}`);
  }
  console.log(`Rows verified before publish: ${result.execution.rowCount}`);
}

function buildConfig(mode: SplunkMode, env: EnvMap): ForgeConfig {
  return {
    groqApiKey: env.GROQ_API_KEY ?? env.SPL_FORGE_GROQ_API_KEY,
    groqModel: env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
    llmApiKey: env.SPL_FORGE_LLM_API_KEY,
    llmModel: env.SPL_FORGE_LLM_MODEL ?? 'mock-spl-forge-v1',
    llmProvider: normalizeProvider(env.SPL_FORGE_LLM_PROVIDER),
    splunkAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED, parseBoolean(env.SPLUNK_VERIFY_SSL, false) === false),
    splunkApp: env.SPL_FORGE_SPLUNK_APP ?? 'search',
    splunkMcpAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED, false),
    splunkMcpEndpoint: env.SPL_FORGE_SPLUNK_MCP_ENDPOINT ?? env.SPLUNK_MCP_URL,
    splunkMcpToken: env.SPL_FORGE_SPLUNK_MCP_TOKEN ?? env.SPLUNK_MCP_TOKEN,
    splunkMode: mode,
    splunkOwner: env.SPL_FORGE_SPLUNK_OWNER ?? 'nobody',
    splunkPassword: env.SPL_FORGE_SPLUNK_PASSWORD ?? env.SPLUNK_PASSWORD,
    splunkRepairAutoRun: parseBoolean(env.SPL_FORGE_REPAIR_AUTO_RUN, true),
    splunkSearchLimit: parseInteger(env.SPL_FORGE_SPLUNK_SEARCH_LIMIT, 10),
    splunkSource: env.SPL_FORGE_SPLUNK_SOURCE ?? 'self_hosted_trial',
    splunkToken: env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
    splunkUrl: env.SPL_FORGE_SPLUNK_URL ?? env.SPLUNK_HOST ?? 'https://localhost:8089',
    splunkWebUrl: env.SPLUNK_WEB_URL,
    splunkUsername: env.SPL_FORGE_SPLUNK_USERNAME ?? env.SPLUNK_USERNAME,
    workspaceName: 'SPL-Forge',
  };
}

function loadEnv(): EnvMap {
  const filePath = path.join(process.cwd(), '.env.local');
  const values: EnvMap = { ...process.env };

  if (!fs.existsSync(filePath)) {
    return values;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    values[key] = values[key] ?? trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
  }

  return values;
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeProvider(value: string | undefined): LlmProvider {
  if (value === 'groq' || value === 'openai' || value === 'anthropic' || value === 'local' || value === 'mock') {
    return value;
  }

  return 'mock';
}

function normalizeMode(value: string): SplunkMode {
  if (value === 'mcp' || value === 'rest' || value === 'mock') {
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
  return Number.isFinite(parsed) ? parsed : fallback;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
