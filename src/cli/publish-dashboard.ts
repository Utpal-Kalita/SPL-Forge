import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { runForgePrompt } from '../agent/workflow';
import { buildClassicDashboardXml } from '../artifacts/dashboard';
import type { ForgeConfig, LlmProvider, SplunkMode } from '../config/env';

type EnvMap = Record<string, string | undefined>;

const defaultPrompt = 'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.';

async function main() {
  const env = loadEnv();
  const prompt = readArg('--prompt') ?? env.SPL_FORGE_PUBLISH_PROMPT ?? defaultPrompt;
  const mode = normalizeMode(readArg('--mode') ?? env.SPL_FORGE_SPLUNK_MODE ?? 'mcp');
  const config = buildConfig(mode, env);
  const result = await runForgePrompt(prompt, config);

  if (!result.dashboard) {
    throw new Error('Prompt did not produce dashboard artifact.');
  }

  const app = env.SPL_FORGE_SPLUNK_APP ?? 'search';
  const owner = env.SPL_FORGE_SPLUNK_OWNER ?? 'nobody';
  const viewName = env.SPL_FORGE_DASHBOARD_VIEW ?? result.dashboard.viewName;
  const executableXml = buildClassicDashboardXml(result.dashboard.title, result.execution.search, result.dashboard.visualizationType);
  await publishDashboard(config, owner, app, viewName, executableXml);

  const uiBase = env.SPLUNK_WEB_URL ?? config.splunkUrl.replace(/:8089\b/, ':8000').replace(/\/$/, '');
  console.log(`Published dashboard: ${viewName}`);
  console.log(`Splunk UI: ${uiBase}/app/${encodeURIComponent(app)}/${encodeURIComponent(viewName)}`);
  console.log(`Published search: ${result.execution.search}`);
  console.log(`Rows verified before publish: ${result.execution.rowCount}`);
}

function publishDashboard(config: ForgeConfig, owner: string, app: string, viewName: string, xml: string) {
  return postForm(config, `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/data/ui/views`, {
    'eai:data': xml,
    name: viewName,
  }).then((response) => {
    if (response.statusCode === 409) {
      return postForm(config, `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/data/ui/views/${encodeURIComponent(viewName)}`, {
        'eai:data': xml,
      });
    }

    return response;
  }).then((response) => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Dashboard publish failed: HTTP ${response.statusCode} ${response.body.trim()}`);
    }
  });
}

function postForm(config: ForgeConfig, pathname: string, values: Record<string, string>) {
  return new Promise<{ body: string; statusCode: number }>((resolve, reject) => {
    const endpoint = new URL(config.splunkUrl);
    const isHttps = endpoint.protocol === 'https:';
    const body = new URLSearchParams(values).toString();
    const headers: Record<string, string> = {
      'Content-Length': Buffer.byteLength(body).toString(),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (config.splunkToken) {
      headers.Authorization = `Bearer ${config.splunkToken}`;
    } else if (config.splunkUsername && config.splunkPassword) {
      headers.Authorization = `Basic ${Buffer.from(`${config.splunkUsername}:${config.splunkPassword}`).toString('base64')}`;
    } else {
      reject(new Error('Dashboard publish requires SPL_FORGE_SPLUNK_TOKEN or username/password REST credentials.'));
      return;
    }

    const request = (isHttps ? https : http).request({
      headers,
      hostname: endpoint.hostname,
      method: 'POST',
      path: pathname,
      port: endpoint.port || (isHttps ? 443 : 80),
      protocol: endpoint.protocol,
      rejectUnauthorized: isHttps ? !config.splunkAllowSelfSigned : undefined,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve({
        body: Buffer.concat(chunks).toString('utf8'),
        statusCode: res.statusCode ?? 0,
      }));
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function buildConfig(mode: SplunkMode, env: EnvMap): ForgeConfig {
  return {
    groqApiKey: env.GROQ_API_KEY ?? env.SPL_FORGE_GROQ_API_KEY,
    groqModel: env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
    llmApiKey: env.SPL_FORGE_LLM_API_KEY,
    llmModel: env.SPL_FORGE_LLM_MODEL ?? 'mock-spl-forge-v1',
    llmProvider: normalizeProvider(env.SPL_FORGE_LLM_PROVIDER),
    splunkAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED, parseBoolean(env.SPLUNK_VERIFY_SSL, false) === false),
    splunkMcpAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED, false),
    splunkMcpEndpoint: env.SPL_FORGE_SPLUNK_MCP_ENDPOINT ?? env.SPLUNK_MCP_URL,
    splunkMcpToken: env.SPL_FORGE_SPLUNK_MCP_TOKEN ?? env.SPLUNK_MCP_TOKEN,
    splunkMode: mode,
    splunkPassword: env.SPL_FORGE_SPLUNK_PASSWORD ?? env.SPLUNK_PASSWORD,
    splunkRepairAutoRun: parseBoolean(env.SPL_FORGE_REPAIR_AUTO_RUN, true),
    splunkSearchLimit: parseInteger(env.SPL_FORGE_SPLUNK_SEARCH_LIMIT, 10),
    splunkSource: env.SPL_FORGE_SPLUNK_SOURCE ?? 'self_hosted_trial',
    splunkToken: env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
    splunkUrl: env.SPL_FORGE_SPLUNK_URL ?? env.SPLUNK_HOST ?? 'https://localhost:8089',
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
