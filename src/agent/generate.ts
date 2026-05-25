import type { ForgeConfig } from '../config/env';

export type GenerateSplInput = {
  prompt: string;
};

export type GenerateSplResult = {
  prompt: string;
  providerUsed: string;
  rawText: string;
  spl: string;
};

const generationSystemPrompt = [
  'You are SPL Forge, a Splunk SPL generation assistant.',
  'Return one raw Splunk Processing Language query for the user prompt.',
  'No explanation. No markdown unless unavoidable.',
  'Prefer realistic Splunk field names like user, src, country, user_agent, action.',
  'Prefer stats/timechart/top pipelines over prose.',
].join(' ');

export async function generateSplFromPrompt(input: GenerateSplInput, config: ForgeConfig): Promise<GenerateSplResult> {
  const normalizedPrompt = input.prompt.trim();

  if (!normalizedPrompt) {
    throw new Error('Prompt is empty.');
  }

  if (config.llmProvider === 'groq' && config.groqApiKey) {
    return generateWithGroq(normalizedPrompt, config);
  }

  if (config.llmProvider === 'openai' && config.llmApiKey) {
    return generateWithOpenAi(normalizedPrompt, config);
  }

  if (config.llmProvider === 'anthropic' && config.llmApiKey) {
    return generateWithAnthropic(normalizedPrompt, config);
  }

  const rawText = generateMockSpl(normalizedPrompt);

  return {
    prompt: normalizedPrompt,
    providerUsed: config.llmProvider === 'mock' ? config.llmModel : `${config.llmProvider} (mock fallback)`,
    rawText,
    spl: extractSpl(rawText),
  };
}

async function generateWithGroq(prompt: string, config: ForgeConfig): Promise<GenerateSplResult> {
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
          content: prompt,
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
    prompt,
    providerUsed: `groq:${config.groqModel}`,
    rawText,
    spl: extractSpl(rawText),
  };
}

async function generateWithOpenAi(prompt: string, config: ForgeConfig): Promise<GenerateSplResult> {
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
          content: prompt,
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
    prompt,
    providerUsed: `openai:${config.llmModel}`,
    rawText,
    spl: extractSpl(rawText),
  };
}

async function generateWithAnthropic(prompt: string, config: ForgeConfig): Promise<GenerateSplResult> {
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
          content: prompt,
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
    prompt,
    providerUsed: `anthropic:${config.llmModel}`,
    rawText,
    spl: extractSpl(rawText),
  };
}

export function extractSpl(rawText: string) {
  const fencedMatch = rawText.match(/```(?:spl)?\s*([\s\S]*?)```/i);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  return rawText.trim();
}

function generateMockSpl(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('failed login') && lowerPrompt.includes('country') && lowerPrompt.includes('user agent')) {
    return [
      'index=main sourcetype=csv action=failure',
      '| stats count by country user_agent',
      '| sort - count',
    ].join(' ');
  }

  if (lowerPrompt.includes('failed login') && lowerPrompt.includes('user')) {
    return 'index=main sourcetype=csv action=failure | stats count by user | sort - count';
  }

  if (lowerPrompt.includes('country')) {
    return 'index=main sourcetype=csv | stats count by country | sort - count';
  }

  return [
    'index=main sourcetype=csv',
    '| head 25',
  ].join(' ');
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
