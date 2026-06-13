import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { runForgePrompt } from '../agent/workflow';
import { buildSplunkAppPackage } from '../artifacts/package';
import type { ForgeConfig, LlmProvider, SplunkMode } from '../config/env';
import { publishSplunkAppPackage } from '../splunk/publish';

type EnvMap = Record<string, string | undefined>;

let lastAppPackage: ReturnType<typeof buildSplunkAppPackage> | undefined;

async function main() {
  const env = loadEnv();
  const port = parseInteger(readArg('--port') ?? env.SPL_FORGE_DASHBOARD_PORT, 5178);
  const mode = normalizeMode(readArg('--mode') ?? env.SPL_FORGE_SPLUNK_MODE ?? 'mcp');
  const config = buildConfig(mode, env);
  const publicRoot = path.join(process.cwd(), 'web');

  const server = http.createServer((request, response) => {
    void handleRequest(request, response, config, publicRoot);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`SPL Forge dashboard: http://127.0.0.1:${port}`);
    console.log(`Mode: ${config.splunkMode}`);
    console.log(`Provider: ${config.llmProvider}`);
  });
}

async function handleRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  config: ForgeConfig,
  publicRoot: string,
) {
  try {
    if (request.method === 'GET' && (request.url === '/' || request.url === '/index.html')) {
      sendFile(response, path.join(publicRoot, 'index.html'), 'text/html; charset=utf-8');
      return;
    }

    if (request.method === 'GET' && request.url === '/api/config') {
      sendJson(response, {
        llmModel: config.llmModel,
        llmProvider: config.llmProvider,
        splunkMode: config.splunkMode,
        splunkSource: config.splunkSource,
      });
      return;
    }

    if (request.method === 'POST' && request.url === '/api/run') {
      const body = await readJsonBody<{ prompt?: string }>(request);
      const prompt = body.prompt?.trim();

      if (!prompt) {
        sendJson(response, { error: 'Prompt is empty.' }, 400);
        return;
      }

      const result = await runForgePrompt(prompt, config);
      lastAppPackage = buildSplunkAppPackage({ result });
      sendJson(response, {
        alert: result.alert,
        appPackage: lastAppPackage.manifest,
        dashboard: result.dashboard,
        execution: result.execution,
        planSummary: result.planSummary,
        providerUsed: result.providerUsed,
        repairSummary: result.repairSummary,
        spl: result.spl,
      });
      return;
    }

    if (request.method === 'POST' && request.url === '/api/export') {
      if (!lastAppPackage) {
        sendJson(response, { error: 'No app package yet. Run a prompt first.' }, 400);
        return;
      }

      const root = writeSplunkAppPackage(lastAppPackage);
      sendJson(response, {
        fileCount: Object.keys(lastAppPackage.files).length,
        root,
      });
      return;
    }

    if (request.method === 'POST' && request.url === '/api/publish') {
      if (!lastAppPackage) {
        sendJson(response, { error: 'No app package yet. Run a prompt first.' }, 400);
        return;
      }

      sendJson(response, await publishSplunkAppPackage(config, lastAppPackage));
      return;
    }

    sendJson(response, { error: 'Not found.' }, 404);
  } catch (error) {
    sendJson(response, { error: error instanceof Error ? error.message : String(error) }, 500);
  }
}

function sendFile(response: http.ServerResponse, filePath: string, contentType: string) {
  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  response.end(fs.readFileSync(filePath, 'utf8'));
}

function sendJson(response: http.ServerResponse, payload: unknown, statusCode = 200) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody<T>(request: http.IncomingMessage) {
  return new Promise<T>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as T);
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function writeSplunkAppPackage(appPackage: ReturnType<typeof buildSplunkAppPackage>) {
  const root = path.resolve('exports', appPackage.appId);

  fs.rmSync(root, { force: true, recursive: true });

  for (const [relativePath, content] of Object.entries(appPackage.files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${content}\n`, 'utf8');
  }

  return root;
}

function buildConfig(mode: SplunkMode, env: EnvMap): ForgeConfig {
  return {
    llmModel: env.SPL_FORGE_LLM_MODEL ?? (normalizeProvider(env.SPL_FORGE_LLM_PROVIDER) === 'mock' ? 'mock-spl-forge-v1' : 'splunk-hosted-model'),
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
    splunkModelEndpoint: env.SPL_FORGE_SPLUNK_MODEL_ENDPOINT,
    splunkModelToken: env.SPL_FORGE_SPLUNK_MODEL_TOKEN ?? env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
    splunkModelTool: env.SPL_FORGE_SPLUNK_MODEL_TOOL ?? 'saia_generate_spl',
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
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
