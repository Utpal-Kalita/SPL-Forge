import * as fs from 'fs';
import * as path from 'path';
import { runForgePrompt } from '../agent/workflow';
import type { ForgeConfig, LlmProvider, SplunkMode } from '../config/env';

type EnvMap = Record<string, string | undefined>;

type PromptCase = {
  name: string;
  prompt: string;
  requireAlert?: boolean;
  requireDashboard?: boolean;
  requireRows?: boolean;
  requiredSpl?: string[];
};

const promptCases: PromptCase[] = [
  {
    name: 'failed-login-dashboard-alert',
    prompt: 'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.',
    requireAlert: true,
    requireDashboard: true,
    requireRows: true,
    requiredSpl: ['action=failure', 'stats count as failed_logins by country user_agent user'],
  },
  {
    name: 'failed-login-trend-country',
    prompt: 'Create a failed login trend dashboard by country for the last 30 minutes. Alert if failed attempts exceed 3 in 5 minutes.',
    requireAlert: true,
    requireDashboard: true,
    requireRows: true,
    requiredSpl: ['action=failure', 'timechart span=5m count as failed_logins by country'],
  },
  {
    name: 'successful-login-dashboard',
    prompt: 'Create a successful login dashboard by user and country for today. Alert if successful logins exceed 5 in 5 minutes.',
    requireAlert: true,
    requireDashboard: true,
    requireRows: true,
    requiredSpl: ['action=success', 'successful_logins'],
  },
  {
    name: 'top-source-ip-search',
    prompt: 'Show top 3 source IPs with failed logins today.',
    requireRows: true,
    requiredSpl: ['action=failure', 'stats count as failed_logins by src', 'head 3'],
  },
  {
    name: 'source-ip-threshold-alert',
    prompt: 'Alert if failed logins by source IP exceed 2 in 5 minutes.',
    requireAlert: true,
    requiredSpl: ['action=failure', 'stats count as failed_logins by _time src', 'where failed_logins > 2'],
  },
  {
    name: 'browser-breakdown-dashboard',
    prompt: 'Create a dashboard of failed logins by browser and country for the past 2 hours.',
    requireDashboard: true,
    requireRows: true,
    requiredSpl: ['action=failure', 'stats count as failed_logins by country user_agent'],
  },
  {
    name: 'user-failed-login-search',
    prompt: 'Show failed login counts by user for the last hour.',
    requireRows: true,
    requiredSpl: ['action=failure', 'stats count as failed_logins by user'],
  },
  {
    name: 'success-trend-user',
    prompt: 'Create a successful login trend by user over time for the past 2 hours.',
    requireRows: true,
    requiredSpl: ['action=success', 'timechart span=15m count as successful_logins by user'],
  },
  {
    name: 'failed-login-alert-country',
    prompt: 'Alert if failed logins by country exceed 1 in 5 minutes.',
    requireAlert: true,
    requiredSpl: ['action=failure', 'stats count as failed_logins by _time country', 'where failed_logins > 1'],
  },
  {
    name: 'generic-auth-head',
    prompt: 'Show the latest auth events for investigation.',
    requireRows: true,
    requiredSpl: ['index=main', 'sourcetype=auth'],
  },
];

const complexPromptCases: PromptCase[] = [
  {
    name: 'complex-high-risk-dashboard',
    prompt: 'Create a high-risk authentication dashboard using sourcetype auth_complex. Show max risk score and event count by country, app, role, and user. Alert if risk_score exceeds 90.',
    requireDashboard: true,
    requireRows: true,
    requiredSpl: [
      'sourcetype=auth_complex',
      'stats count as auth_events max(risk_score) as max_risk avg(risk_score) as avg_risk',
      'where max_risk > 90',
    ],
  },
  {
    name: 'complex-privileged-activity',
    prompt: 'Create a suspicious privileged activity dashboard using sourcetype auth_complex. Find privileged or admin users with failed, blocked, or privileged_action events. Break down by user, src, app, country, and role. Alert if risk_score over 85.',
    requireDashboard: true,
    requireRows: true,
    requiredSpl: [
      'sourcetype=auth_complex',
      'role="admin" OR role="privileged" OR action="privileged_action"',
      'stats count as privileged_events max(risk_score) as max_risk',
      'where max_risk > 85',
    ],
  },
  {
    name: 'complex-mfa-investigation',
    prompt: 'Create an MFA failure investigation dashboard using sourcetype auth_complex. Show users where mfa_result is denied, timeout, or not_challenged, grouped by user, src, country, device, app, and mfa_result.',
    requireDashboard: true,
    requireRows: true,
    requiredSpl: [
      'sourcetype=auth_complex',
      'mfa_result="denied" OR mfa_result="timeout" OR mfa_result="not_challenged"',
      'stats count as mfa_events max(risk_score) as max_risk by user src country device app mfa_result',
    ],
  },
  {
    name: 'complex-service-account-monitoring',
    prompt: 'Create a service account monitoring dashboard using sourcetype auth_complex. Track service role activity for api_token and pipeline_deploy actions by user, src, app, dest, action, and outcome.',
    requireDashboard: true,
    requireRows: true,
    requiredSpl: [
      'sourcetype=auth_complex',
      'role="service" OR action="api_token" OR action="pipeline_deploy"',
      'stats count as service_events max(risk_score) as max_risk values(outcome) as outcomes by user src app dest action outcome',
    ],
  },
  {
    name: 'complex-impossible-travel',
    prompt: 'Create an impossible-travel style dashboard using sourcetype auth_complex. Find the same user logging in from multiple countries or unknown devices. Group by user, country, src, device, app, and session_id.',
    requireDashboard: true,
    requireRows: true,
    requiredSpl: [
      'sourcetype=auth_complex',
      'stats dc(country) as country_count',
      'where country_count > 1',
    ],
  },
  {
    name: 'complex-blocked-failed-overview',
    prompt: 'Show blocked and failed auth_complex events by outcome, app, country, role, and device with max risk score.',
    requireRows: true,
    requiredSpl: [
      'sourcetype=auth_complex',
      'where outcome="failure" OR outcome="blocked"',
      'stats count as auth_events max(risk_score) as max_risk',
    ],
  },
];

async function main() {
  const env = loadEnv();
  const mode = normalizeMode(readArg('--mode') ?? env.SPL_FORGE_SPLUNK_MODE ?? 'mcp');
  const config = buildConfig(mode, env);
  const cases = selectPromptCases();
  const delayMs = parseInteger(readArg('--delay-ms'), 0);
  const failures: string[] = [];

  console.log(`SPL Forge prompt verification`);
  console.log(`Mode: ${mode}`);
  console.log(`Cases: ${cases.length}`);
  console.log(`Delay: ${delayMs}ms`);

  for (const [index, promptCase] of cases.entries()) {
    const label = `${index + 1}/${cases.length} ${promptCase.name}`;

    try {
      const result = await runForgePrompt(promptCase.prompt, config);
      const haystack = `${result.spl}\n${result.execution.search}`.replace(/\s+/g, ' ');
      const problems = validateResult(promptCase, result, haystack);

      if (problems.length > 0) {
        failures.push(`${label}: ${problems.join('; ')}`);
        console.log(`FAIL ${label}`);
        console.log(`  prompt=${promptCase.prompt}`);
        console.log(`  spl=${result.spl}`);
        console.log(`  execution=${result.execution.status} rows=${result.execution.rowCount}`);
        continue;
      }

      console.log(`PASS ${label}: rows=${result.execution.rowCount} status=${result.execution.status}`);
      console.log(`  spl=${result.spl}`);
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`FAIL ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (delayMs > 0 && index < cases.length - 1) {
      await sleep(delayMs);
    }
  }

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('\nAll prompt verification cases passed.');
}

function selectPromptCases() {
  if (hasArg('--complex')) {
    return complexPromptCases;
  }

  if (hasArg('--all')) {
    return [...promptCases, ...complexPromptCases];
  }

  return promptCases;
}

function validateResult(promptCase: PromptCase, result: Awaited<ReturnType<typeof runForgePrompt>>, haystack: string) {
  const problems: string[] = [];

  if (result.execution.status !== 'success') {
    problems.push(`execution status ${result.execution.status}`);
  }

  if (promptCase.requireRows && result.execution.rowCount <= 0) {
    problems.push('expected rows');
  }

  if (promptCase.requireDashboard && !result.dashboard) {
    problems.push('expected dashboard');
  }

  if (promptCase.requireAlert && !result.alert) {
    problems.push('expected alert');
  }

  for (const required of promptCase.requiredSpl ?? []) {
    if (!haystack.includes(required)) {
      problems.push(`missing SPL fragment: ${required}`);
    }
  }

  return problems;
}

function buildConfig(mode: SplunkMode, env: EnvMap): ForgeConfig {
  return {
    llmModel: env.SPL_FORGE_LLM_MODEL ?? 'splunk-hosted-model',
    llmProvider: normalizeProvider(env.SPL_FORGE_LLM_PROVIDER),
    splunkModelEndpoint: env.SPL_FORGE_SPLUNK_MODEL_ENDPOINT,
    splunkModelToken: env.SPL_FORGE_SPLUNK_MODEL_TOKEN ?? env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
    splunkModelTool: env.SPL_FORGE_SPLUNK_MODEL_TOOL ?? 'saia_generate_spl',
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

function hasArg(name: string) {
  return process.argv.includes(name);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
