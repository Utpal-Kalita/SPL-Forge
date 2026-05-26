import * as fs from 'fs';
import * as path from 'path';
import { executeSplSearch } from '../splunk/execute';
import type { ForgeConfig, SplunkMode } from '../config/env';

const DEFAULT_VERIFY_SEARCH = 'index=_internal earliest=-15m | head 1';

type EnvMap = Record<string, string | undefined>;

async function main() {
	const env = loadEnv();
	const requestedMode = parseModeArg(process.argv.slice(2), env);
	const modes = resolveModes(requestedMode, env);
	const search = env.SPL_FORGE_VERIFY_SPL ?? DEFAULT_VERIFY_SEARCH;

	if (modes.length === 0) {
		throw new Error('No real Splunk mode configured. Set REST or MCP env values, or pass --mode rest|mcp|all.');
	}

	console.log(`SPL Forge live verification`);
	console.log(`Search: ${search}`);
	console.log(`Modes: ${modes.join(', ')}`);

	for (const mode of modes) {
		const config = buildConfig(mode, env);

		console.log(`\n[${mode}] running live check...`);
		const result = await executeSplSearch(search, config);

		console.log(`[${mode}] status=${result.status} rows=${result.rowCount} elapsedMs=${result.elapsedMs}`);
		for (const message of result.messages) {
			console.log(`[${mode}] ${message}`);
		}

		if (result.status !== 'success') {
			throw new Error(`[${mode}] live check failed.`);
		}

		if (result.rowCount === 0) {
			throw new Error(`[${mode}] live check returned 0 rows. Set SPL_FORGE_VERIFY_SPL to a real-data query that returns rows.`);
		}

		const firstRow = result.rows[0];
		if (firstRow) {
			console.log(`[${mode}] first row fields=${Object.keys(firstRow).join(', ')}`);
		}
	}

	console.log('\nLive Splunk verification passed.');
}

function loadEnv(): EnvMap {
	const fileEnv = parseEnvFile(path.resolve(process.cwd(), '.env.local'));
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

function parseModeArg(args: string[], env: EnvMap) {
	const modeIndex = args.indexOf('--mode');
	const raw = modeIndex >= 0 ? args[modeIndex + 1] : env.SPL_FORGE_VERIFY_MODE ?? env.SPL_FORGE_SPLUNK_MODE;

	if (raw === 'rest' || raw === 'mcp' || raw === 'all') {
		return raw;
	}

	return 'all';
}

function resolveModes(mode: 'all' | 'mcp' | 'rest', env: EnvMap): Array<Exclude<SplunkMode, 'mock'>> {
	if (mode === 'rest') {
		requireRestConfig(env);
		return ['rest'];
	}

	if (mode === 'mcp') {
		requireMcpConfig(env);
		return ['mcp'];
	}

	const modes: Array<Exclude<SplunkMode, 'mock'>> = [];

	if (hasRestConfig(env)) {
		modes.push('rest');
	}

	if (hasMcpConfig(env)) {
		modes.push('mcp');
	}

	return modes;
}

function buildConfig(mode: Exclude<SplunkMode, 'mock'>, env: EnvMap): ForgeConfig {
	if (mode === 'rest') {
		requireRestConfig(env);
	} else {
		requireMcpConfig(env);
	}

	return {
		groqApiKey: undefined,
		groqModel: env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
		llmApiKey: undefined,
		llmModel: 'mock-spl-forge-v1',
		llmProvider: 'mock',
		splunkAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED, parseBoolean(env.SPLUNK_VERIFY_SSL, false) === false),
		splunkMcpAllowSelfSigned: parseBoolean(env.SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED, false),
		splunkMcpEndpoint: env.SPL_FORGE_SPLUNK_MCP_ENDPOINT ?? env.SPLUNK_MCP_URL,
		splunkMcpToken: env.SPL_FORGE_SPLUNK_MCP_TOKEN ?? env.SPLUNK_MCP_TOKEN,
		splunkMode: mode,
		splunkPassword: env.SPL_FORGE_SPLUNK_PASSWORD ?? env.SPLUNK_PASSWORD,
		splunkRepairAutoRun: true,
		splunkSearchLimit: parseInteger(env.SPL_FORGE_SPLUNK_SEARCH_LIMIT, 10),
		splunkSource: env.SPL_FORGE_SPLUNK_SOURCE ?? 'remote',
		splunkToken: env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN,
		splunkUrl: env.SPL_FORGE_SPLUNK_URL ?? env.SPLUNK_HOST ?? 'https://localhost:8089',
		splunkUsername: env.SPL_FORGE_SPLUNK_USERNAME ?? env.SPLUNK_USERNAME,
		workspaceName: 'SPL-Forge',
	};
}

function hasRestConfig(env: EnvMap) {
	return Boolean((env.SPL_FORGE_SPLUNK_URL ?? env.SPLUNK_HOST) && ((env.SPL_FORGE_SPLUNK_TOKEN ?? env.SPLUNK_TOKEN) || ((env.SPL_FORGE_SPLUNK_USERNAME ?? env.SPLUNK_USERNAME) && (env.SPL_FORGE_SPLUNK_PASSWORD ?? env.SPLUNK_PASSWORD))));
}

function hasMcpConfig(env: EnvMap) {
	return Boolean((env.SPL_FORGE_SPLUNK_MCP_ENDPOINT ?? env.SPLUNK_MCP_URL) && (env.SPL_FORGE_SPLUNK_MCP_TOKEN ?? env.SPLUNK_MCP_TOKEN));
}

function requireRestConfig(env: EnvMap) {
	if (!hasRestConfig(env)) {
		throw new Error('REST verification requires SPL_FORGE_SPLUNK_URL plus SPL_FORGE_SPLUNK_TOKEN, or username/password.');
	}
}

function requireMcpConfig(env: EnvMap) {
	if (!hasMcpConfig(env)) {
		throw new Error('MCP verification requires SPL_FORGE_SPLUNK_MCP_ENDPOINT and SPL_FORGE_SPLUNK_MCP_TOKEN.');
	}
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
