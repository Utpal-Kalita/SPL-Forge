import * as http from 'http';
import * as https from 'https';
import type { ForgeConfig } from '../config/env';

export type SplunkSearchStatus = 'error' | 'success';

export type SplunkSearchResult = {
  elapsedMs: number;
  fields: string[];
  mode: ForgeConfig['splunkMode'];
  messages: string[];
  rowCount: number;
  rows: Array<Record<string, string>>;
  search: string;
  status: SplunkSearchStatus;
};

type SplunkExportRecord = {
  messages?: Array<{
    text?: string;
    type?: string;
  }>;
  result?: Record<string, unknown>;
};

type JsonRpcResponse = {
  error?: {
    code?: number;
    message?: string;
  };
  result?: {
    content?: Array<{
      json?: unknown;
      text?: string;
      type?: string;
    }>;
    structuredContent?: unknown;
  };
};

const mockEvents = [
  { _time: '2026-05-24T10:15:23Z', action: 'failure', country: 'US', src: '192.168.1.100', user: 'jdoe', user_agent: 'Mozilla/5.0' },
  { _time: '2026-05-24T10:16:45Z', action: 'failure', country: 'India', src: '203.45.67.89', user: 'msmith', user_agent: 'Mozilla/5.0' },
  { _time: '2026-05-24T10:17:12Z', action: 'failure', country: 'China', src: '150.23.45.67', user: 'kchen', user_agent: 'Chrome/91.0' },
  { _time: '2026-05-24T10:18:03Z', action: 'success', country: 'US', src: '192.168.1.100', user: 'jdoe', user_agent: 'Safari/14.0' },
  { _time: '2026-05-24T10:19:27Z', action: 'failure', country: 'Brazil', src: '45.67.89.123', user: 'agarcia', user_agent: 'Firefox/89.0' },
  { _time: '2026-05-24T10:20:14Z', action: 'failure', country: 'Germany', src: '88.24.11.200', user: 'admin', user_agent: 'Chrome/123.0' },
  { _time: '2026-05-24T10:22:39Z', action: 'success', country: 'Singapore', src: '10.1.5.22', user: 'svc-ci', user_agent: 'curl/8.5.0' },
  { _time: '2026-05-24T10:24:10Z', action: 'failure', country: 'US', src: '192.168.1.100', user: 'jdoe', user_agent: 'Mozilla/5.0' },
  { _time: '2026-05-24T10:24:48Z', action: 'failure', country: 'India', src: '203.45.67.89', user: 'msmith', user_agent: 'Edge/124.0' },
  { _time: '2026-05-24T10:25:51Z', action: 'failure', country: 'Germany', src: '88.24.11.200', user: 'admin', user_agent: 'Chrome/123.0' },
];

export async function executeSplSearch(search: string, config: ForgeConfig): Promise<SplunkSearchResult> {
  const startedAt = Date.now();

  try {
    if (config.splunkMode === 'mock') {
      return withElapsed(executeMockSearch(search, config), startedAt);
    }

    if (config.splunkMode === 'rest') {
      return withElapsed(await executeRestSearch(search, config), startedAt);
    }

    return withElapsed(await executeMcpSearch(search, config), startedAt);
  } catch (error) {
    return withElapsed({
      fields: [],
      messages: [formatNetworkError(error)],
      mode: config.splunkMode,
      rowCount: 0,
      rows: [],
      search,
      status: 'error',
    }, startedAt);
  }
}

async function executeMcpSearch(search: string, config: ForgeConfig): Promise<Omit<SplunkSearchResult, 'elapsedMs'>> {
  if (!config.splunkMcpEndpoint || !config.splunkMcpToken) {
    throw new Error('MCP mode requires SPL_FORGE_SPLUNK_MCP_ENDPOINT and SPL_FORGE_SPLUNK_MCP_TOKEN.');
  }

  const preflightMessages = await runMcpPreflight(config);
  const messages = [...preflightMessages];

  const searchAttempts = buildSearchAttempts(search, config);

  for (let attemptIndex = 0; attemptIndex < searchAttempts.length; attemptIndex += 1) {
    const searchAttempt = searchAttempts[attemptIndex];
    const query = normalizeSearchCommand(searchAttempt.query);
    const toolAttempts = [
      { query, max_results: config.splunkSearchLimit },
      { query },
      { search: query },
    ];

    for (const args of toolAttempts) {
      const response = await postJsonRpcToMcp(config, {
        id: `spl-forge-run-query-${Date.now()}`,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          arguments: args,
          name: 'splunk_run_query',
        },
      });

      if (response.error) {
        messages.push(response.error.message ?? `MCP error ${response.error.code ?? 'unknown'}`);
        continue;
      }

      const parsed = parseMcpToolResult(response);
      const hasRetry = attemptIndex < searchAttempts.length - 1;

      if (parsed.rows.length === 0 && hasRetry) {
        const retryReason = searchAttempts[attemptIndex + 1]?.reason;

        if (retryReason) {
          messages.push(retryReason);
        }
        break;
      }

      return {
        fields: collectFields(parsed.rows),
        messages: [
          ...messages,
          ...(parsed.messages.length > 0 ? parsed.messages : [`MCP splunk_run_query returned ${parsed.rows.length} row(s).`]),
        ],
        mode: config.splunkMode,
        rowCount: parsed.rows.length,
        rows: parsed.rows.slice(0, config.splunkSearchLimit),
        search: searchAttempt.query,
        status: 'success',
      };
    }
  }

  return {
    fields: [],
    messages: messages.length > 0 ? messages : ['MCP splunk_run_query failed with no response details.'],
    mode: config.splunkMode,
    rowCount: 0,
    rows: [],
    search,
    status: 'error',
  };
}

function executeMockSearch(search: string, config: ForgeConfig): Omit<SplunkSearchResult, 'elapsedMs'> {
  const filtered = search.includes('action=failure')
    ? mockEvents.filter((event) => event.action === 'failure')
    : search.includes('action=success')
      ? mockEvents.filter((event) => event.action === 'success')
      : mockEvents;

  if (search.includes('timechart')) {
    const metric = search.match(/\bcount\s+as\s+(\w+)/)?.[1] ?? 'event_count';
    const splitField = search.match(/\btimechart\b[\s\S]*?\bby\s+(\w+)/i)?.[1];
    const row: Record<string, string> = { _time: '2026-05-24T10:15:00Z' };

    if (splitField) {
      const grouped = new Map<string, number>();

      for (const event of filtered) {
        const value = event[splitField as keyof typeof event] ?? 'unknown';
        grouped.set(value, (grouped.get(value) ?? 0) + 1);
      }

      for (const [value, count] of grouped) {
        row[value] = String(count);
      }
    } else {
      row[metric] = String(filtered.length);
    }

    const rows = [row];

    return mockSuccess(search, config, rows);
  }

  const statsMatch = search.match(/\|\s*stats\s+count\s+as\s+(\w+)\s+by\s+([\w\s_]+)/);

  if (statsMatch) {
    const [, countField, groupText] = statsMatch;
    const groupFields = groupText
      .trim()
      .split(/\s+/)
      .filter((field) => !['sort', 'where'].includes(field));
    const grouped = new Map<string, Record<string, string>>();

    for (const event of filtered) {
      const key = groupFields.map((field) => event[field as keyof typeof event] ?? '').join('\u0000');
      const existing = grouped.get(key);

      if (existing) {
        existing[countField] = String(Number(existing[countField]) + 1);
      } else {
        grouped.set(key, {
          ...Object.fromEntries(groupFields.map((field) => [field, event[field as keyof typeof event] ?? ''])),
          [countField]: '1',
        });
      }
    }

    const rows = [...grouped.values()]
      .sort((left, right) => Number(right[countField]) - Number(left[countField]))
      .slice(0, config.splunkSearchLimit);

    return mockSuccess(search, config, rows);
  }

  return mockSuccess(search, config, filtered.slice(0, config.splunkSearchLimit));
}

function mockSuccess(search: string, config: ForgeConfig, rows: Array<Record<string, string>>) {
  return {
    fields: collectFields(rows),
    messages: [`Mock search returned ${rows.length} row(s) from failed_login_auth.csv.`],
    mode: config.splunkMode,
    rowCount: rows.length,
    rows,
    search,
    status: 'success' as const,
  };
}

async function executeRestSearch(search: string, config: ForgeConfig): Promise<Omit<SplunkSearchResult, 'elapsedMs'>> {
  if (!config.splunkToken && (!config.splunkUsername || !config.splunkPassword)) {
    throw new Error('REST mode requires SPL_FORGE_SPLUNK_TOKEN or SPL_FORGE_SPLUNK_USERNAME plus SPL_FORGE_SPLUNK_PASSWORD.');
  }

  const messages: string[] = [];

  const searchAttempts = buildSearchAttempts(search, config);

  for (let attemptIndex = 0; attemptIndex < searchAttempts.length; attemptIndex += 1) {
    const searchAttempt = searchAttempts[attemptIndex];
    const payload = new URLSearchParams({
      count: String(config.splunkSearchLimit),
      output_mode: 'json',
      search: normalizeSearchCommand(searchAttempt.query),
    }).toString();
    const response = await postToSplunk('/services/search/jobs/export', payload, config);
    const parsed = parseExportResponse(response.body);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return {
        fields: [],
        messages: parsed.messages.length > 0 ? parsed.messages : [`Splunk REST request failed with HTTP ${response.statusCode}.`],
        mode: config.splunkMode,
        rowCount: 0,
        rows: [],
        search: searchAttempt.query,
        status: 'error',
      };
    }

    if (parsed.rows.length === 0 && attemptIndex < searchAttempts.length - 1) {
      const retryReason = searchAttempts[attemptIndex + 1]?.reason;

      if (retryReason) {
        messages.push(retryReason);
      }
      continue;
    }

    return {
      fields: collectFields(parsed.rows),
      messages: [
        ...messages,
        ...(parsed.messages.length > 0 ? parsed.messages : [`Splunk REST search returned ${parsed.rows.length} row(s).`]),
      ],
      mode: config.splunkMode,
      rowCount: parsed.rows.length,
      rows: parsed.rows.slice(0, config.splunkSearchLimit),
      search: searchAttempt.query,
      status: 'success',
    };
  }

  return {
    fields: [],
    messages,
    mode: config.splunkMode,
    rowCount: 0,
    rows: [],
    search,
    status: 'success',
  };
}

async function runMcpPreflight(config: ForgeConfig) {
  const response = await postJsonRpcToMcp(config, {
    id: `spl-forge-get-info-${Date.now()}`,
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      arguments: {},
      name: 'splunk_get_info',
    },
  });

  if (response.error) {
    return [`MCP preflight warning: ${response.error.message ?? 'splunk_get_info failed'}`];
  }

  const parsed = parseMcpToolResult(response);
  return parsed.messages.length > 0 ? parsed.messages.map((message) => `MCP info: ${message}`) : [];
}

type SearchAttempt = {
  query: string;
  reason?: string;
};

function buildSearchAttempts(search: string, config: ForgeConfig): SearchAttempt[] {
  const normalized = rewriteDemoFixtureSearch(search, config);
  const attempts: SearchAttempt[] = [{ query: normalized }];
  const widened = widenDemoFixtureTimeRange(normalized, config);

  if (widened !== normalized) {
    attempts.push({
      query: widened,
      reason: 'No rows with prompt time window. Retried with earliest=0 for local validation fixture timestamps.',
    });
  }

  return attempts;
}

export function widenDemoFixtureTimeRange(search: string, config: ForgeConfig) {
  if (config.splunkSource !== 'self_hosted_trial') {
    return search;
  }

  if (!/index=main/.test(search) || !/sourcetype=auth/.test(search)) {
    return search;
  }

  if (/earliest=0\b/.test(search)) {
    return search;
  }

  if (/\bearliest=/.test(search)) {
    return search.replace(/\bearliest=[^\s|]+/, 'earliest=0');
  }

  const trimmed = search.trim();
  const pipeIndex = trimmed.indexOf('|');

  if (pipeIndex === -1) {
    return `${trimmed} earliest=0`;
  }

  const head = trimmed.slice(0, pipeIndex).trimEnd();
  const tail = trimmed.slice(pipeIndex);
  return `${head} earliest=0 ${tail}`;
}

export function rewriteDemoFixtureSearch(search: string, config: ForgeConfig) {
  if (config.splunkSource !== 'self_hosted_trial') {
    return search;
  }

  if (/index=main/.test(search) && /sourcetype=auth_complex/.test(search)) {
    return rewriteComplexAuthFixtureSearch(search);
  }

  if (!/index=main/.test(search) || !/sourcetype=auth/.test(search) || /rex\s+field=_raw/.test(search)) {
    return search;
  }

  const trimmed = search.trim();
  const pipeIndex = trimmed.indexOf('|');
  const head = pipeIndex === -1 ? trimmed : trimmed.slice(0, pipeIndex).trim();
  const tail = pipeIndex === -1 ? '' : trimmed.slice(pipeIndex);
  const actionValue = head.match(/\baction=(failure|success)\b/)?.[1];
  const normalizedHead = head
    .replace(/\baction=(failure|success)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const extractionPipeline = [
    '| rex field=_raw "^(?<timestamp>[^,]+),(?<user>[^,]+),(?<src>[^,]+),(?<country>[^,]+),(?<user_agent>[^,]+),(?<action>[^,]+),(?<row_sourcetype>[^,]+),(?<row_index>[^,]+)$"',
  ].join(' ');
  const filterPipeline = actionValue
    ? ` | where timestamp!="timestamp" AND action="${actionValue}"`
    : ' | where timestamp!="timestamp"';

  return `${normalizedHead} ${extractionPipeline}${filterPipeline}${tail ? ` ${tail}` : ''}`.trim();
}

function rewriteComplexAuthFixtureSearch(search: string) {
  if (/rex\s+field=_raw/.test(search)) {
    return search;
  }

  const trimmed = search.trim();
  const pipeIndex = trimmed.indexOf('|');
  const head = pipeIndex === -1 ? trimmed : trimmed.slice(0, pipeIndex).trim();
  const tail = pipeIndex === -1 ? '' : trimmed.slice(pipeIndex);
  const normalizedHead = head
    .replace(/\s+/g, ' ')
    .trim();
  const extractionPipeline = [
    '| rex field=_raw "^(?<timestamp>[^,]+),(?<user>[^,]+),(?<src>[^,]+),(?<dest>[^,]+),(?<app>[^,]+),(?<country>[^,]+),(?<user_agent>[^,]+),(?<action>[^,]+),(?<outcome>[^,]+),(?<risk_score>[^,]+),(?<mfa_result>[^,]+),(?<role>[^,]+),(?<device>[^,]+),(?<session_id>[^,]+),(?<row_sourcetype>[^,]+),(?<row_index>[^,]+)$"',
    '| where timestamp!="timestamp"',
    '| eval risk_score=tonumber(risk_score)',
  ].join(' ');

  return `${normalizedHead} ${extractionPipeline}${tail ? ` ${tail}` : ''}`.trim();
}

function formatNetworkError(error: unknown) {
  if (error instanceof AggregateError && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors
      .map((cause) => cause instanceof Error ? cause.message : String(cause))
      .join(' | ');
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown Splunk execution failure.';
}

function postToSplunk(pathname: string, payload: string, config: ForgeConfig) {
  return new Promise<{ body: string; statusCode: number }>((resolve, reject) => {
    const baseUrl = new URL(config.splunkUrl);
    const isHttps = baseUrl.protocol === 'https:';
    const request = isHttps ? https.request : http.request;
    const headers: Record<string, string> = {
      'Content-Length': Buffer.byteLength(payload).toString(),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (config.splunkToken) {
      headers.Authorization = `Bearer ${config.splunkToken}`;
    } else if (config.splunkUsername && config.splunkPassword) {
      headers.Authorization = `Basic ${Buffer.from(`${config.splunkUsername}:${config.splunkPassword}`).toString('base64')}`;
    }

    const req = request({
      headers,
      hostname: baseUrl.hostname,
      method: 'POST',
      path: pathname,
      port: baseUrl.port || (isHttps ? 443 : 80),
      protocol: baseUrl.protocol,
      rejectUnauthorized: isHttps ? !config.splunkAllowSelfSigned : undefined,
    }, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          body: Buffer.concat(chunks).toString('utf8'),
          statusCode: res.statusCode ?? 0,
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function postJsonRpcToMcp(config: ForgeConfig, payload: Record<string, unknown>) {
  return new Promise<JsonRpcResponse>((resolve, reject) => {
    const endpoint = new URL(config.splunkMcpEndpoint ?? '');
    const isHttps = endpoint.protocol === 'https:';
    const request = isHttps ? https.request : http.request;
    const body = JSON.stringify(payload);
    const req = request({
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${config.splunkMcpToken}`,
        'Content-Length': Buffer.byteLength(body).toString(),
        'Content-Type': 'application/json',
      },
      hostname: endpoint.hostname,
      method: 'POST',
      path: `${endpoint.pathname}${endpoint.search}`,
      port: endpoint.port || (isHttps ? 443 : 80),
      protocol: endpoint.protocol,
      rejectUnauthorized: isHttps ? !config.splunkMcpAllowSelfSigned : undefined,
    }, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const parsed = parseJsonRpcBody(raw);

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          resolve({
            error: {
              code: res.statusCode,
              message: extractJsonRpcError(parsed) ?? raw.trim() ?? `MCP HTTP ${res.statusCode}`,
            },
          });
          return;
        }

        resolve(parsed);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseJsonRpcBody(raw: string): JsonRpcResponse {
  const trimmed = raw.trim();

  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('event:') || trimmed.startsWith('data:')) {
    const dataLine = trimmed
      .split(/\r?\n/)
      .find((line) => line.startsWith('data:'));

    if (dataLine) {
      return parseJsonRpcBody(dataLine.slice('data:'.length).trim());
    }
  }

  try {
    return JSON.parse(trimmed) as JsonRpcResponse;
  } catch {
    return {
      result: {
        content: [{ text: trimmed, type: 'text' }],
      },
    };
  }
}

function parseMcpToolResult(response: JsonRpcResponse) {
  const rows: Array<Record<string, string>> = [];
  const messages: string[] = [];
  const candidates = [
    response.result?.structuredContent,
    ...(response.result?.content?.map((item) => item.json ?? item.text) ?? []),
  ];

  for (const candidate of candidates) {
    if (candidate === undefined) {
      continue;
    }

    const normalized = normalizeMcpCandidate(candidate);
    rows.push(...normalized.rows);
    messages.push(...normalized.messages);
  }

  return { messages, rows };
}

function normalizeMcpCandidate(candidate: unknown): { messages: string[]; rows: Array<Record<string, string>> } {
  if (typeof candidate === 'string') {
    try {
      return normalizeMcpCandidate(JSON.parse(candidate));
    } catch {
      return { messages: [candidate], rows: [] };
    }
  }

  if (Array.isArray(candidate)) {
    return {
      messages: [],
      rows: candidate.filter(isRecord).map(stringifyRow),
    };
  }

  if (!isRecord(candidate)) {
    return { messages: [], rows: [] };
  }

  const messages = collectMcpMessages(candidate);
  const rowSource = candidate.results ?? candidate.rows ?? candidate.events ?? candidate.result;

  if (Array.isArray(rowSource)) {
    return {
      messages,
      rows: rowSource.filter(isRecord).map(stringifyRow),
    };
  }

  if (isRecord(rowSource)) {
    return {
      messages,
      rows: [stringifyRow(rowSource)],
    };
  }

  return { messages, rows: [] };
}

function collectMcpMessages(candidate: Record<string, unknown>) {
  const rawMessages = candidate.messages ?? candidate.message ?? candidate.error;

  if (Array.isArray(rawMessages)) {
    return rawMessages.map((message) => typeof message === 'string' ? message : JSON.stringify(message));
  }

  if (typeof rawMessages === 'string') {
    return [rawMessages];
  }

  return [];
}

function parseExportResponse(body: string) {
  const rows: Array<Record<string, string>> = [];
  const messages: string[] = [];

  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const record = JSON.parse(trimmed) as SplunkExportRecord;

      if (record.result) {
        rows.push(stringifyRow(record.result));
      }

      if (record.messages) {
        messages.push(...record.messages.map((message) => message.text ?? message.type ?? 'Splunk message'));
      }
    } catch {
      messages.push(trimmed);
    }
  }

  return { messages, rows };
}

function stringifyRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractJsonRpcError(response: JsonRpcResponse) {
  return response.error?.message;
}

function collectFields(rows: Array<Record<string, string>>) {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

function normalizeSearchCommand(search: string) {
  const trimmed = search.trim();

  if (trimmed.startsWith('|') || /^search\s+/i.test(trimmed)) {
    return trimmed;
  }

  return `search ${trimmed}`;
}

function withElapsed(result: Omit<SplunkSearchResult, 'elapsedMs'>, startedAt: number): SplunkSearchResult {
  return {
    ...result,
    elapsedMs: Date.now() - startedAt,
  };
}
