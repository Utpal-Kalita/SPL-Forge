import * as http from 'http';
import * as https from 'https';
import type { ForgeConfig } from '../config/env';
import { executeSplSearch } from './execute';

export type SplunkSchemaSummary = {
	fields: string[];
	indexes: string[];
	messages: string[];
	sourcetypes: string[];
};

const validationSchema: SplunkSchemaSummary = {
	fields: ['_time', 'action', 'country', 'src', 'user', 'user_agent'],
	indexes: ['main'],
	messages: ['Using built-in failed-login validation schema.'],
	sourcetypes: ['auth'],
};

export async function inspectSplunkSchema(search: string, config: ForgeConfig): Promise<SplunkSchemaSummary> {
	if (config.splunkMode === 'mock') {
		return validationSchema;
	}

	if (config.splunkMode === 'mcp') {
		return inspectMcpSchema(search, config);
	}

	const index = search.match(/\bindex=([^\s|]+)/)?.[1] ?? 'main';
	const sourcetype = search.match(/\bsourcetype=([^\s|]+)/)?.[1] ?? 'auth';
	const probeSearch = `index=${index} sourcetype=${sourcetype} earliest=0 | head ${Math.min(config.splunkSearchLimit, 5)}`;
	const result = await executeSplSearch(probeSearch, {
		...config,
		splunkSource: config.splunkSource === 'self_hosted_trial' ? 'remote' : config.splunkSource,
	});

	const fields = result.fields.length > 0 ? result.fields : validationSchema.fields;
	const indexes = [...new Set([index, ...validationSchema.indexes])];
	const sourcetypes = [...new Set([sourcetype, ...validationSchema.sourcetypes])];

	return {
		fields,
		indexes,
		messages: [
			`Schema probe: ${probeSearch}`,
			...result.messages,
		],
		sourcetypes,
	};
}

async function inspectMcpSchema(search: string, config: ForgeConfig): Promise<SplunkSchemaSummary> {
	const fallback = await inspectProbeSchema(search, config);
	const messages = [...fallback.messages];
	const indexes = new Set(fallback.indexes);
	const sourcetypes = new Set(fallback.sourcetypes);

	for (const tool of [
		{ name: 'splunk_get_indexes', args: {} },
		{ name: 'splunk_get_metadata', args: { index: fallback.indexes[0] ?? 'main' } },
	]) {
		const response = await callMcpTool(config, tool.name, tool.args);

		if (response.error) {
			messages.push(`MCP schema ${tool.name}: ${response.error}`);
			continue;
		}

		const parsed = collectSchemaValues(response.payload);
		parsed.indexes.forEach((value) => indexes.add(value));
		parsed.sourcetypes.forEach((value) => sourcetypes.add(value));
		messages.push(`MCP schema ${tool.name}: ok`);
	}

	return {
		fields: fallback.fields,
		indexes: [...indexes],
		messages,
		sourcetypes: [...sourcetypes],
	};
}

async function inspectProbeSchema(search: string, config: ForgeConfig): Promise<SplunkSchemaSummary> {
	const index = search.match(/\bindex=([^\s|]+)/)?.[1] ?? 'main';
	const sourcetype = search.match(/\bsourcetype=([^\s|]+)/)?.[1] ?? 'auth';
	const probeSearch = `index=${index} sourcetype=${sourcetype} earliest=0 | head ${Math.min(config.splunkSearchLimit, 5)}`;
	const result = await executeSplSearch(probeSearch, {
		...config,
		splunkSource: config.splunkSource === 'self_hosted_trial' ? 'remote' : config.splunkSource,
	});

	return {
		fields: result.fields.length > 0 ? result.fields : validationSchema.fields,
		indexes: [...new Set([index, ...validationSchema.indexes])],
		messages: [
			`Schema probe: ${probeSearch}`,
			...result.messages,
		],
		sourcetypes: [...new Set([sourcetype, ...validationSchema.sourcetypes])],
	};
}

function callMcpTool(config: ForgeConfig, name: string, args: Record<string, unknown>) {
	return new Promise<{ error?: string; payload?: unknown }>((resolve) => {
		if (!config.splunkMcpEndpoint || !config.splunkMcpToken) {
			resolve({ error: 'missing MCP endpoint or token' });
			return;
		}

		const endpoint = new URL(config.splunkMcpEndpoint);
		const isHttps = endpoint.protocol === 'https:';
		const transport = isHttps ? https : http;
		const body = JSON.stringify({
			id: `spl-forge-schema-${Date.now()}`,
			jsonrpc: '2.0',
			method: 'tools/call',
			params: {
				arguments: args,
				name,
			},
		});
		const request = transport.request({
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
		}, (res: import('http').IncomingMessage) => {
			const chunks: Buffer[] = [];
			res.on('data', (chunk: Buffer) => chunks.push(chunk));
			res.on('end', () => {
				const raw = Buffer.concat(chunks).toString('utf8');
				try {
					const parsed = JSON.parse(parseSseData(raw)) as {
						error?: { message?: string };
						result?: { content?: Array<{ json?: unknown; text?: string }>; structuredContent?: unknown };
					};

					if (parsed.error) {
						resolve({ error: parsed.error.message ?? 'MCP schema tool failed' });
						return;
					}

					resolve({
						payload: [
							parsed.result?.structuredContent,
							...(parsed.result?.content?.map((item) => item.json ?? item.text) ?? []),
						],
					});
				} catch {
					resolve({ error: raw.trim() || 'invalid MCP schema response' });
				}
			});
		});

		request.on('error', (error: Error) => resolve({ error: error.message }));
		request.write(body);
		request.end();
	});
}

function parseSseData(raw: string) {
	const trimmed = raw.trim();

	if (!trimmed.startsWith('event:') && !trimmed.startsWith('data:')) {
		return trimmed;
	}

	return trimmed
		.split(/\r?\n/)
		.find((line) => line.startsWith('data:'))
		?.slice('data:'.length)
		.trim() ?? trimmed;
}

function collectSchemaValues(payload: unknown): { indexes: string[]; sourcetypes: string[] } {
	const indexes = new Set<string>();
	const sourcetypes = new Set<string>();
	const visit = (value: unknown) => {
		if (typeof value === 'string') {
			try {
				visit(JSON.parse(value));
			} catch {
				if (/^[\w.-]+$/.test(value) && ['main', '_internal'].includes(value)) {
					indexes.add(value);
				}
			}
			return;
		}

		if (Array.isArray(value)) {
			value.forEach(visit);
			return;
		}

		if (typeof value !== 'object' || value === null) {
			return;
		}

		for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
			if ((key === 'name' || key === 'index') && typeof nested === 'string') {
				indexes.add(nested);
			}
			if ((key === 'sourcetype' || key === 'sourcetypes') && typeof nested === 'string') {
				sourcetypes.add(nested);
			}
			if ((key === 'indexes' || key === 'sourcetypes') && Array.isArray(nested)) {
				nested
					.filter((item): item is string => typeof item === 'string')
					.forEach((item) => {
						if (key === 'indexes') {
							indexes.add(item);
						} else {
							sourcetypes.add(item);
						}
					});
			}
			visit(nested);
		}
	};

	visit(payload);
	return {
		indexes: [...indexes],
		sourcetypes: [...sourcetypes],
	};
}
