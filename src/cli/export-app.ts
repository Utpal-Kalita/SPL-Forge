import * as fs from 'fs';
import * as path from 'path';
import { runForgePrompt } from '../agent/workflow';
import { buildSplunkAppPackage } from '../artifacts/package';
import type { ForgeConfig, LlmProvider, SplunkMode } from '../config/env';

type EnvMap = Record<string, string | undefined>;

const defaultPrompt = 'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.';

async function main() {
  const env = loadEnv();
  const prompt = readArg('--prompt') ?? env.SPL_FORGE_EXPORT_PROMPT ?? defaultPrompt;
  const mode = normalizeMode(readArg('--mode') ?? env.SPL_FORGE_SPLUNK_MODE ?? 'mcp');
  const outputDir = readArg('--out') ?? env.SPL_FORGE_EXPORT_DIR ?? path.join('exports', 'spl-forge-generated-app');
  const appId = readArg('--app-id') ?? env.SPL_FORGE_EXPORT_APP_ID ?? 'spl_forge_generated_app';
  const config = buildConfig(mode, env);
  const result = await runForgePrompt(prompt, config);
  const appPackage = buildSplunkAppPackage({ appId, result });
  const root = path.resolve(outputDir);

  fs.rmSync(root, { force: true, recursive: true });

  for (const [relativePath, content] of Object.entries(appPackage.files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${content}\n`, 'utf8');
  }

  console.log(`Exported Splunk app folder: ${root}`);
  console.log(`App id: ${appPackage.appId}`);
  console.log(`Files: ${Object.keys(appPackage.files).length}`);
  console.log(`Rows verified before export: ${result.execution.rowCount}`);
  if (result.dashboard) {
    console.log(`Dashboard: default/data/ui/views/${result.dashboard.viewName}.xml`);
  }
  if (result.alert) {
    console.log(`Alert: ${result.alert.title}`);
  }
}

function buildConfig(mode: SplunkMode, env: EnvMap): ForgeConfig {
  return {
    llmModel: env.SPL_FORGE_LLM_MODEL ?? 'splunk-hosted-model',
    llmProvider: normalizeProvider(env.SPL_FORGE_LLM_PROVIDER),
    splunkModelEndpoint: env.SPL_FORGE_SPLUNK_MODEL_ENDPOINT,
    splunkModelToken: env.SPL_FORGE_SPLUNK_MODEL_TOKEN ?? env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
    splunkModelTool: env.SPL_FORGE_SPLUNK_MODEL_TOOL ?? 'saia_generate_spl',
    splunkAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED, parseBoolean(env.SPLUNK_VERIFY_SSL, false) === false),
    splunkMcpAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED, false),
    splunkMcpEndpoint: env.SPL_FORGE_SPLUNK_MCP_ENDPOINT ?? env.SPLUNK_MCP_URL,
    splunkMcpToken: env.SPL_FORGE_SPLUNK_MCP_TOKEN ?? env.SPLUNK_MCP_TOKEN,
    splunkMode: mode,
    splunkPassword: env.SPL_FORGE_SPLUNK_PASSWORD ?? env.SPLUNK_PASSWORD,
    splunkApp: env.SPL_FORGE_SPLUNK_APP ?? 'search',
    splunkOwner: env.SPL_FORGE_SPLUNK_OWNER ?? 'nobody',
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
  if (value === 'splunk' || value === 'local' || value === 'mock') {
    return value;
  }

  return 'splunk';
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
