import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { generateSplFromPrompt } from '../agent/generate';
import type { ForgeConfig, SplunkMode } from '../config/env';
import { executeSplSearch } from '../splunk/execute';

type EnvMap = Record<string, string | undefined>;

const HACKATHON_START_DATE = '2026-05-18';
const DEFAULT_MODEL_PROMPT = 'Show failed login counts by user for the last 15 minutes.';
const DEFAULT_VERIFY_SEARCH = 'index=_internal earliest=-15m | head 1';

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const env = loadEnv(repoRoot);
  const config = buildConfig(env);
  const failures: string[] = [];
  const warnings: string[] = [];

  checkFile(repoRoot, 'LICENSE', failures, 'Missing root LICENSE file.');
  checkFile(repoRoot, 'architecture_diagram.md', failures, 'Missing root architecture_diagram.md file.');
  checkProviderConfig(config, failures);
  checkCommitWindow(repoRoot, failures);
  checkRemoteReachability(repoRoot, failures, warnings);

  const generationPrompt = env.SPL_FORGE_VERIFY_PROMPT ?? DEFAULT_MODEL_PROMPT;
  const verifySearch = env.SPL_FORGE_VERIFY_SPL ?? DEFAULT_VERIFY_SEARCH;

  try {
    const generation = await generateSplFromPrompt({ prompt: generationPrompt }, config);
    if (!generation.providerUsed.startsWith('splunk:')) {
      failures.push(`Generation did not use a Splunk provider. providerUsed=${generation.providerUsed}`);
    }
    if (!generation.spl.trim()) {
      failures.push('Splunk model generation returned empty SPL.');
    }
  } catch (error) {
    failures.push(`Live Splunk model generation failed: ${formatError(error)}`);
  }

  try {
    const result = await executeSplSearch(verifySearch, config);
    if (result.status !== 'success') {
      failures.push(`Live Splunk search failed: ${result.messages.join(' | ') || 'unknown error'}`);
    } else if (result.rowCount === 0) {
      failures.push('Live Splunk search returned 0 rows. Set SPL_FORGE_VERIFY_SPL to a query that returns data.');
    }
  } catch (error) {
    failures.push(`Live Splunk search failed: ${formatError(error)}`);
  }

  if (failures.length > 0) {
    console.log('SPL Forge submission verification FAILED\n');
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
    if (warnings.length > 0) {
      console.log('\nWarnings:');
      for (const warning of warnings) {
        console.log(`- ${warning}`);
      }
    }
    process.exit(1);
  }

  console.log('SPL Forge submission verification passed.');
  console.log(`- License file present`);
  console.log(`- Architecture diagram present`);
  console.log(`- Commit history includes work on or after ${HACKATHON_START_DATE}`);
  console.log(`- Git remote is reachable`);
  console.log(`- Splunk model generation succeeded with provider=${config.llmProvider} model=${config.llmModel}`);
  console.log(`- Live Splunk search succeeded in mode=${config.splunkMode}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
}

function loadEnv(repoRoot: string): EnvMap {
  const fileEnv = parseEnvFile(path.join(repoRoot, '.env.local'));
  return {
    ...fileEnv,
    ...process.env,
  };
}

function parseEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values: EnvMap = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }

  return values;
}

function buildConfig(env: EnvMap): ForgeConfig {
  const mode = normalizeMode(env.SPL_FORGE_SPLUNK_MODE);

  return {
    llmModel: env.SPL_FORGE_LLM_MODEL ?? 'splunk-hosted-model',
    llmProvider: 'splunk',
    splunkModelEndpoint: env.SPL_FORGE_SPLUNK_MODEL_ENDPOINT,
    splunkModelToken: env.SPL_FORGE_SPLUNK_MODEL_TOKEN ?? env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
    splunkModelTool: env.SPL_FORGE_SPLUNK_MODEL_TOOL ?? 'saia_generate_spl',
    splunkMcpAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED, false),
    splunkMcpEndpoint: env.SPL_FORGE_SPLUNK_MCP_ENDPOINT ?? env.SPLUNK_MCP_URL,
    splunkMcpToken: env.SPL_FORGE_SPLUNK_MCP_TOKEN ?? env.SPLUNK_MCP_TOKEN,
    splunkAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED, parseBoolean(env.SPLUNK_VERIFY_SSL, false) === false),
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

function checkProviderConfig(config: ForgeConfig, failures: string[]) {
  if (config.llmProvider !== 'splunk') {
    failures.push(`SPL_FORGE_LLM_PROVIDER must resolve to splunk. Current value: ${config.llmProvider}`);
  }

  if (config.splunkMode === 'mock') {
    failures.push('SPL_FORGE_SPLUNK_MODE must be mcp or rest for hackathon verification. Mock mode is not acceptable.');
  }

  const hasMcpModel = Boolean(config.splunkMcpEndpoint && config.splunkMcpToken);
  const hasDirectModel = Boolean(config.splunkModelEndpoint);

  if (!hasMcpModel && !hasDirectModel) {
    failures.push('Splunk model generation is not configured. Set SPL_FORGE_SPLUNK_MCP_ENDPOINT plus SPL_FORGE_SPLUNK_MCP_TOKEN, or SPL_FORGE_SPLUNK_MODEL_ENDPOINT.');
  }

  if (config.splunkMode === 'mcp' && !hasMcpModel) {
    failures.push('MCP mode requires SPL_FORGE_SPLUNK_MCP_ENDPOINT and SPL_FORGE_SPLUNK_MCP_TOKEN.');
  }

  const hasRestAuth = Boolean(config.splunkToken || (config.splunkUsername && config.splunkPassword));

  if (config.splunkMode === 'rest' && !hasRestAuth) {
    failures.push('REST mode requires SPL_FORGE_SPLUNK_TOKEN, or SPL_FORGE_SPLUNK_USERNAME plus SPL_FORGE_SPLUNK_PASSWORD.');
  }
}

function checkFile(repoRoot: string, relativePath: string, failures: string[], message: string) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    failures.push(message);
  }
}

function checkCommitWindow(repoRoot: string, failures: string[]) {
  const output = execGit(repoRoot, ['log', '--since', HACKATHON_START_DATE, '--oneline']);
  if (!output.trim()) {
    failures.push(`No commits found on or after ${HACKATHON_START_DATE}.`);
  }
}

function checkRemoteReachability(repoRoot: string, failures: string[], warnings: string[]) {
  try {
    execGit(repoRoot, ['ls-remote', 'origin', 'HEAD']);
  } catch (error) {
    failures.push(`Could not verify remote repository reachability: ${formatError(error)}`);
    return;
  }

  warnings.push('Public GitHub visibility still needs a manual incognito browser check.');
}

function execGit(repoRoot: string, args: string[]) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function normalizeMode(value: string | undefined): SplunkMode {
  if (value === 'mcp' || value === 'rest') {
    return value;
  }

  if (value === 'mock') {
    return 'mock';
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

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
