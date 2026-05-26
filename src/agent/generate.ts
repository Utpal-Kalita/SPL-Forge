import type { ForgeConfig } from '../config/env';

export type GenerateSplInput = {
  prompt: string;
};

export type GenerateSplResult = {
  planSummary: string;
  prompt: string;
  providerUsed: string;
  rawText: string;
  spl: string;
};

export type PromptIntent = {
  artifact: 'search' | 'dashboard' | 'alert' | 'dashboard+alert';
  breakdowns: string[];
  focusField?: string;
  earliest?: string;
  latest?: string;
  threshold?: number;
  thresholdWindow?: string;
  wantsFailedLogins: boolean;
  wantsSuccessLogins: boolean;
  wantsTrend: boolean;
};

const sampleSchemaSummary = [
  'Known demo schema:',
  'index=main',
  'sourcetype=auth',
  'fields=timestamp,user,src,country,user_agent,action,sourcetype,index',
  'failure values use action=failure',
].join(' ');

const generationSystemPrompt = [
  'You are SPL Forge, a Splunk SPL generation assistant.',
  'Return exactly one raw Splunk Processing Language query.',
  'No explanation. No markdown unless unavoidable.',
  'Prefer realistic Splunk field names from provided schema.',
  'Use index=main sourcetype=auth when prompt matches failed-login demo data.',
  'Use action=failure for failed logins.',
  'Prefer stats, timechart, bin, sort, where pipelines over prose.',
  'When user asks for dashboard plus alert, return best primary search query only.',
].join(' ');

export async function generateSplFromPrompt(input: GenerateSplInput, config: ForgeConfig): Promise<GenerateSplResult> {
  const normalizedPrompt = input.prompt.trim();

  if (!normalizedPrompt) {
    throw new Error('Prompt is empty.');
  }

  const intent = analyzePrompt(normalizedPrompt);
  const planSummary = summarizeIntent(intent);

  if (config.llmProvider === 'groq' && config.groqApiKey) {
    return generateWithGroq(normalizedPrompt, config, intent, planSummary);
  }

  if (config.llmProvider === 'openai' && config.llmApiKey) {
    return generateWithOpenAi(normalizedPrompt, config, intent, planSummary);
  }

  if (config.llmProvider === 'anthropic' && config.llmApiKey) {
    return generateWithAnthropic(normalizedPrompt, config, intent, planSummary);
  }

  const rawText = generateMockSpl(intent);

  return {
    planSummary,
    prompt: normalizedPrompt,
    providerUsed: config.llmProvider === 'mock' ? config.llmModel : `${config.llmProvider} (mock fallback)`,
    rawText,
    spl: normalizeGeneratedSpl(extractSpl(rawText), intent),
  };
}

async function generateWithGroq(
  prompt: string,
  config: ForgeConfig,
  intent: PromptIntent,
  planSummary: string,
): Promise<GenerateSplResult> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: generationSystemPrompt,
        },
        {
          role: 'user',
          content: buildUserPrompt(prompt, intent),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const rawText = payload.choices[0]?.message?.content?.trim();

  if (!rawText) {
    throw new Error('Groq response missing content.');
  }

  return {
    planSummary,
    prompt,
    providerUsed: `groq:${config.groqModel}`,
    rawText,
    spl: normalizeGeneratedSpl(extractSpl(rawText), intent),
  };
}

async function generateWithOpenAi(
  prompt: string,
  config: ForgeConfig,
  intent: PromptIntent,
  planSummary: string,
): Promise<GenerateSplResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: generationSystemPrompt,
        },
        {
          role: 'user',
          content: buildUserPrompt(prompt, intent),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const rawText = payload.choices[0]?.message?.content?.trim();

  if (!rawText) {
    throw new Error('OpenAI response missing content.');
  }

  return {
    planSummary,
    prompt,
    providerUsed: `openai:${config.llmModel}`,
    rawText,
    spl: normalizeGeneratedSpl(extractSpl(rawText), intent),
  };
}

async function generateWithAnthropic(
  prompt: string,
  config: ForgeConfig,
  intent: PromptIntent,
  planSummary: string,
): Promise<GenerateSplResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.llmApiKey ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.llmModel,
      max_tokens: 400,
      temperature: 0.2,
      system: generationSystemPrompt,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(prompt, intent),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as AnthropicMessageResponse;
  const rawText = payload.content
    .map((item) => ('text' in item ? item.text : ''))
    .join('\n')
    .trim();

  if (!rawText) {
    throw new Error('Anthropic response missing content.');
  }

  return {
    planSummary,
    prompt,
    providerUsed: `anthropic:${config.llmModel}`,
    rawText,
    spl: normalizeGeneratedSpl(extractSpl(rawText), intent),
  };
}

export function extractSpl(rawText: string) {
  const fencedMatch = rawText.match(/```(?:spl)?\s*([\s\S]*?)```/i);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  return rawText.trim();
}

export function normalizeGeneratedSpl(spl: string, intent: PromptIntent) {
  const normalized = spl
    .replace(/\|\s*alert\b[^\n|]*/gi, '')
    .replace(/\|\s*bin\s+\w+\s+over\s+\d+\s*/gi, '')
    .replace(/\bby\s+([^\n|]+)/gi, (match, fields: string) => `by ${fields.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim()}`)
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (hasUnsafeGeneratedShape(normalized)) {
    return generateMockSpl(intent);
  }

  return normalized;
}

function hasUnsafeGeneratedShape(spl: string) {
  if (/\|\s*(alert|sendemail|outputlookup|delete|collect)\b/i.test(spl)) {
    return true;
  }

  if (/\|\s*stats\b[\s\S]*\|\s*timechart\b/i.test(spl)) {
    return true;
  }

  if (/\|\s*bin\s+\w+\s+over\s+\d+/i.test(spl)) {
    return true;
  }

  return false;
}

function buildUserPrompt(prompt: string, intent: PromptIntent) {
  return [
    `User request: ${prompt}`,
    sampleSchemaSummary,
    `Interpreted intent: ${summarizeIntent(intent)}`,
    'Return one SPL query only.',
  ].join('\n');
}

export function analyzePrompt(prompt: string): PromptIntent {
  const lowerPrompt = prompt.toLowerCase();
  const dashboard = /(dashboard|panel|visuali[sz]ation|chart|graph)/.test(lowerPrompt);
  const alert = /(alert|notify|threshold|trigger)/.test(lowerPrompt);
  const breakdowns = new Set<string>();
  const focusField = inferFocusField(lowerPrompt);

  if (/\bcountry\b|geo|location/.test(lowerPrompt)) {
    breakdowns.add('country');
  }

  if (/user agent|browser/.test(lowerPrompt)) {
    breakdowns.add('user_agent');
  }

  if (/\buser\b|username/.test(lowerPrompt)) {
    breakdowns.add('user');
  }

  if (/\bsrc\b|source ip|ip address|\bip\b/.test(lowerPrompt)) {
    breakdowns.add('src');
  }

  const thresholdMatch = lowerPrompt.match(/(?:exceed|over|above|greater than)\s+(\d+)/);
  const thresholdWindowMatch = lowerPrompt.match(/in\s+(\d+)\s+(minutes|minute|hours|hour|days|day)/);

  return {
    artifact: dashboard && alert ? 'dashboard+alert' : dashboard ? 'dashboard' : alert ? 'alert' : 'search',
    breakdowns: [...breakdowns],
    focusField,
    earliest: normalizeTimeWindow(lowerPrompt),
    latest: 'now',
    threshold: thresholdMatch ? Number(thresholdMatch[1]) : undefined,
    thresholdWindow: thresholdWindowMatch ? `${thresholdWindowMatch[1]} ${thresholdWindowMatch[2]}` : undefined,
    wantsFailedLogins: /failed login|failed auth|login failure|auth failure|unsuccessful login|login errors?/.test(lowerPrompt),
    wantsSuccessLogins: /successful login|success login|login success|successful auth/.test(lowerPrompt),
    wantsTrend: /\bover time\b|trend|timeline|timechart|per minute|per hour/.test(lowerPrompt),
  };
}

export function summarizeIntent(intent: PromptIntent) {
  const parts = [`Artifact: ${intent.artifact}`];

  if (intent.wantsFailedLogins) {
    parts.push('Focus: failed logins');
  }

  if (intent.breakdowns.length > 0) {
    parts.push(`Breakdowns: ${intent.breakdowns.join(', ')}`);
  }

  if (intent.focusField) {
    parts.push(`Focus field: ${intent.focusField}`);
  }

  if (intent.earliest) {
    parts.push(`Time: ${intent.earliest} to ${intent.latest ?? 'now'}`);
  }

  if (intent.threshold !== undefined) {
    parts.push(`Threshold: > ${intent.threshold}${intent.thresholdWindow ? ` in ${intent.thresholdWindow}` : ''}`);
  }

  if (intent.wantsTrend) {
    parts.push('Shape: time trend');
  }

  return parts.join(' | ');
}

function generateMockSpl(intent: PromptIntent) {
  const head = ['index=main', 'sourcetype=auth'];

  if (intent.wantsFailedLogins) {
    head.push('action=failure');
  }

  if (intent.wantsSuccessLogins) {
    head.push('action=success');
  }

  if (intent.earliest) {
    head.push(`earliest=${intent.earliest}`);
  }

  if (intent.latest) {
    head.push(`latest=${intent.latest}`);
  }

  const pipeline = buildPipeline(intent);
  return [head.join(' '), ...pipeline].join(' ');
}

function buildPipeline(intent: PromptIntent) {
  if (intent.wantsTrend) {
    return [`| timechart span=${resolveTrendSpan(intent)} count as ${metricName(intent)}`];
  }

  if ((intent.artifact === 'dashboard' || intent.artifact === 'dashboard+alert') && intent.breakdowns.length > 0) {
    return [
      `| stats count as ${metricName(intent)} by ${intent.breakdowns.join(' ')}`,
      `| sort - ${metricName(intent)}`,
    ];
  }

  if (intent.threshold !== undefined && intent.thresholdWindow) {
    const thresholdSpan = toSplunkSpan(intent.thresholdWindow);
    return [
      `| bin _time span=${thresholdSpan}`,
      `| stats count as ${metricName(intent)} by _time`,
      `| where ${metricName(intent)} > ${intent.threshold}`,
      '| sort _time',
    ];
  }

  if (intent.breakdowns.length > 0) {
    return [
      `| stats count as ${metricName(intent)} by ${intent.breakdowns.join(' ')}`,
      `| sort - ${metricName(intent)}`,
    ];
  }

  if (intent.artifact === 'alert' && intent.threshold !== undefined) {
    return [
      `| stats count as ${metricName(intent)} by ${intent.focusField ?? 'user'}`,
      `| where ${metricName(intent)} > ${intent.threshold}`,
      `| sort - ${metricName(intent)}`,
    ];
  }

  if (intent.wantsFailedLogins || intent.wantsSuccessLogins) {
    return [`| stats count as ${metricName(intent)} by ${intent.focusField ?? 'user'}`, `| sort - ${metricName(intent)}`];
  }

  return ['| head 25'];
}

function metricName(intent: PromptIntent) {
  if (intent.wantsSuccessLogins) {
    return 'successful_logins';
  }

  if (intent.wantsFailedLogins) {
    return 'failed_logins';
  }

  return 'event_count';
}

function resolveTrendSpan(intent: PromptIntent) {
  if (!intent.earliest) {
    return '5m';
  }

  if (intent.earliest.endsWith('m')) {
    return '5m';
  }

  if (intent.earliest.endsWith('h')) {
    return '15m';
  }

  if (intent.earliest.endsWith('d')) {
    return '1h';
  }

  return '5m';
}

function toSplunkSpan(window: string) {
  const match = window.match(/(\d+)\s+(minute|minutes|hour|hours|day|days)/);

  if (!match) {
    return '5m';
  }

  const [, amount, unit] = match;

  if (unit.startsWith('minute')) {
    return `${amount}m`;
  }

  if (unit.startsWith('hour')) {
    return `${amount}h`;
  }

  if (unit.startsWith('day')) {
    return `${amount}d`;
  }

  return '5m';
}

function normalizeTimeWindow(prompt: string) {
  const lastMinutes = prompt.match(/(?:last|past|previous)\s+(\d+)\s+minute/);
  if (lastMinutes) {
    return `-${lastMinutes[1]}m`;
  }

  const lastHours = prompt.match(/(?:last|past|previous)\s+(\d+)\s+hour/);
  if (lastHours) {
    return `-${lastHours[1]}h`;
  }

  const lastDays = prompt.match(/(?:last|past|previous)\s+(\d+)\s+day/);
  if (lastDays) {
    return `-${lastDays[1]}d`;
  }

  if (/\blast hour\b/.test(prompt)) {
    return '-1h';
  }

  if (/\btoday\b/.test(prompt)) {
    return '@d';
  }

  if (/\byesterday\b/.test(prompt)) {
    return '-1d@d';
  }

  return undefined;
}

function inferFocusField(prompt: string) {
  if (/country|geo|location/.test(prompt)) {
    return 'country';
  }

  if (/user agent|browser/.test(prompt)) {
    return 'user_agent';
  }

  if (/source ip|ip address|\bip\b|\bsrc\b/.test(prompt)) {
    return 'src';
  }

  if (/\buser\b|username/.test(prompt)) {
    return 'user';
  }

  return undefined;
}

type OpenAiChatCompletionResponse = {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type AnthropicMessageResponse = {
  content: Array<
    | {
        text: string;
        type: 'text';
      }
    | {
        type: string;
      }
  >;
};
