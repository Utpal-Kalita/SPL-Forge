import * as assert from 'assert';
import * as http from 'http';
import * as vscode from 'vscode';
import type { ForgeConfig } from '../config/env';
import { getPanelHtml } from '../panels/assistant';
import { analyzePrompt, extractSpl, generateSplFromPrompt, normalizeGeneratedSpl, summarizeIntent } from '../agent/generate';
import { repairSplQuery } from '../agent/repair';
import { runForgePrompt } from '../agent/workflow';
import { executeSplSearch, rewriteDemoFixtureSearch, widenDemoFixtureTimeRange } from '../splunk/execute';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	const mockConfig: ForgeConfig = {
		groqApiKey: undefined,
		groqModel: 'llama-3.1-8b-instant',
		llmModel: 'mock-spl-forge-v1',
		llmProvider: 'mock',
		splunkMcpAllowSelfSigned: false,
		splunkMcpEndpoint: undefined,
		splunkMcpToken: undefined,
		splunkAllowSelfSigned: true,
		splunkMode: 'mock',
		splunkPassword: undefined,
		splunkSearchLimit: 10,
		splunkSource: 'self_hosted_trial',
		splunkToken: undefined,
		splunkUrl: 'https://localhost:8089',
		splunkUsername: undefined,
		workspaceName: 'SPL-Forge',
	};

	test('panel html shows day 1 scaffold state', () => {
		const html = getPanelHtml({
			config: mockConfig,
			cspSource: 'vscode-resource:',
			extensionUri: 'file:///tmp/spl-forge',
			state: {
				lastPrompt: 'Create failed login dashboard',
				lastPlanSummary: 'Artifact: dashboard | Focus: failed logins',
				status: 'idle',
			},
		});

		assert.ok(html.includes('Day 5 Self-Debugging Loop'));
		assert.ok(html.includes('Generate + Run SPL'));
		assert.ok(html.includes('failed_login_auth.csv'));
		assert.ok(html.includes('Provider: mock'));
		assert.ok(html.includes('Query Plan'));
		assert.ok(html.includes('Repair History'));
		assert.ok(html.includes('Execution Summary'));
	});

	test('extract spl removes fenced markdown', () => {
		const parsed = extractSpl('```spl\nindex=main | head 10\n```');

		assert.strictEqual(parsed, 'index=main | head 10');
	});

	test('analyze prompt captures day 3 intent', () => {
		const intent = analyzePrompt('Create a failed login dashboard by country and user agent for the last 30 minutes. Alert if failed attempts exceed 100 in 5 minutes.');

		assert.deepStrictEqual(intent.breakdowns, ['country', 'user_agent', 'user']);
		assert.strictEqual(intent.artifact, 'dashboard+alert');
		assert.strictEqual(intent.focusField, 'country');
		assert.strictEqual(intent.earliest, '-30m');
		assert.strictEqual(intent.threshold, 100);
		assert.ok(summarizeIntent(intent).includes('Threshold: > 100 in 5 minutes'));
	});

	test('mock fallback generates structured failed login spl', async () => {
		const result = await generateSplFromPrompt({
			prompt: 'Create a failed login dashboard by country and user agent for the last 30 minutes.',
		}, mockConfig);

		assert.ok(result.planSummary.includes('Breakdowns: country, user_agent'));
		assert.ok(result.spl.includes('index=main sourcetype=auth action=failure earliest=-30m latest=now'));
		assert.ok(result.spl.includes('| stats count as failed_logins by country user_agent'));
	});

	test('mock fallback shapes threshold alert queries', async () => {
		const result = await generateSplFromPrompt({
			prompt: 'Alert if failed logins exceed 100 in 5 minutes.',
		}, mockConfig);

		assert.ok(result.planSummary.includes('Artifact: alert'));
		assert.ok(result.spl.includes('| bin _time span=5m'));
		assert.ok(result.spl.includes('| where failed_logins > 100'));
	});

	test('generated spl normalization falls back from malformed dashboard alert pipeline', () => {
		const intent = analyzePrompt('Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.');
		const normalized = normalizeGeneratedSpl([
			'index=main sourcetype=auth action=failure',
			'| stats count as failed_logins by country, user_agent, user',
			'| timechart span=5m sum(failed_logins) as failed_logins_5m by country',
			'| bin user_agent over 10',
			'| alert action=failure-exceeded threshold=100 duration=5m',
		].join(' '), intent);

		assert.ok(normalized.includes('| stats count as failed_logins by country user_agent user'));
		assert.ok(normalized.includes('| sort - failed_logins'));
		assert.ok(!normalized.includes('| alert'));
		assert.ok(!normalized.includes('bin user_agent over'));
	});

	test('mock fallback shapes trend queries for broader time windows', async () => {
		const result = await generateSplFromPrompt({
			prompt: 'Show failed login trend by country over time for past 2 hours.',
		}, mockConfig);

		assert.ok(result.planSummary.includes('Time: -2h to now'));
		assert.ok(result.spl.includes('earliest=-2h latest=now'));
		assert.ok(result.spl.includes('| timechart span=15m count as failed_logins'));
	});

	test('time parser handles today wording', () => {
		const intent = analyzePrompt('Show successful login counts by user today.');

		assert.strictEqual(intent.earliest, '@d');
		assert.strictEqual(intent.wantsSuccessLogins, true);
	});

	test('mock splunk adapter returns grouped rows', async () => {
		const result = await executeSplSearch('index=main sourcetype=auth action=failure | stats count as failed_logins by country user_agent | sort - failed_logins', mockConfig);

		assert.strictEqual(result.status, 'success');
		assert.strictEqual(result.mode, 'mock');
		assert.ok(result.rowCount > 0);
		assert.ok(result.fields.includes('country'));
		assert.ok(result.fields.includes('failed_logins'));
	});

	test('forge workflow returns final execution with no repair when first run succeeds', async () => {
		const result = await runForgePrompt('Create a failed login dashboard by country.', mockConfig);

		assert.strictEqual(result.execution.status, 'success');
		assert.strictEqual(result.attempts.length, 1);
		assert.strictEqual(result.repairSummary, 'No repair needed.');
		assert.ok(result.spl.includes('index=main sourcetype=auth action=failure'));
	});

	test('repair loop rewrites common wrong fields and auth source hints', () => {
		const repair = repairSplQuery(
			'index=security sourcetype=linux_secure status=failed earliest=-30m | stats count as failed_logins by source_ip useragent',
			{
				elapsedMs: 5,
				fields: [],
				messages: ['No matching fields found.'],
				mode: 'mcp',
				rowCount: 0,
				rows: [],
				search: 'index=security sourcetype=linux_secure status=failed earliest=-30m | stats count as failed_logins by source_ip useragent',
				status: 'success',
			},
			{
				fields: ['action', 'country', 'src', 'user', 'user_agent'],
				indexes: ['main'],
				messages: ['schema ok'],
				sourcetypes: ['auth'],
			},
		);

		assert.strictEqual(repair.shouldRetry, true);
		assert.ok(repair.repairedSpl.includes('index=main sourcetype=auth action=failure earliest=0'));
		assert.ok(repair.repairedSpl.includes('by src user_agent'));
		assert.ok(repair.reason.includes('replaced index=security'));
		assert.ok(repair.reason.includes('replaced field source_ip with src'));
	});

	test('rest splunk adapter reports missing credentials', async () => {
		const result = await executeSplSearch('index=main | head 1', {
			...mockConfig,
			splunkMode: 'rest',
		});

		assert.strictEqual(result.status, 'error');
		assert.ok(result.messages[0].includes('REST mode requires'));
	});

	test('rest splunk adapter executes against local export endpoint', async () => {
		const seenPayloads: string[] = [];
		const server = http.createServer((req, res) => {
			assert.strictEqual(req.method, 'POST');
			assert.strictEqual(req.url, '/services/search/jobs/export');
			assert.strictEqual(req.headers.authorization, 'Bearer test-token');

			const chunks: Buffer[] = [];
			req.on('data', (chunk: Buffer) => chunks.push(chunk));
			req.on('end', () => {
				const payload = Buffer.concat(chunks).toString('utf8');
				seenPayloads.push(payload);

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end([
					JSON.stringify({ result: { country: 'US', failed_logins: 2 } }),
					JSON.stringify({ messages: [{ text: 'rest ok' }] }),
				].join('\n'));
			});
		});

		await listen(server);

		try {
			const address = server.address();
			assert.ok(address && typeof address === 'object');

			const result = await executeSplSearch('index=main sourcetype=auth action=failure | stats count as failed_logins by country', {
				...mockConfig,
				splunkMode: 'rest',
				splunkSource: 'remote',
				splunkToken: 'test-token',
				splunkUrl: `http://127.0.0.1:${address.port}`,
			});

			assert.strictEqual(result.status, 'success');
			assert.strictEqual(result.mode, 'rest');
			assert.strictEqual(result.rowCount, 1);
			assert.deepStrictEqual(result.rows[0], { country: 'US', failed_logins: '2' });
			assert.ok(result.fields.includes('country'));
			assert.ok(result.messages.includes('rest ok'));
			assert.ok(seenPayloads[0].includes('search=search+index%3Dmain'));
		} finally {
			await close(server);
		}
	});

	test('mcp splunk adapter reports missing endpoint or token', async () => {
		const result = await executeSplSearch('index=main | head 1', {
			...mockConfig,
			splunkMode: 'mcp',
		});

		assert.strictEqual(result.status, 'error');
		assert.ok(result.messages[0].includes('MCP mode requires'));
	});

	test('mcp splunk adapter executes against local json-rpc endpoint', async () => {
		const calls: Array<Record<string, unknown>> = [];
		const server = http.createServer((req, res) => {
			assert.strictEqual(req.method, 'POST');
			assert.strictEqual(req.headers.authorization, 'Bearer mcp-token');

			const chunks: Buffer[] = [];
			req.on('data', (chunk: Buffer) => chunks.push(chunk));
			req.on('end', () => {
				const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
					params?: {
						arguments?: Record<string, unknown>;
						name?: string;
					};
				};
				calls.push(payload as Record<string, unknown>);

				res.writeHead(200, { 'Content-Type': 'application/json' });

				if (payload.params?.name === 'splunk_get_info') {
					res.end(JSON.stringify({
						jsonrpc: '2.0',
						result: {
							content: [{ text: JSON.stringify({ messages: ['connected'] }), type: 'text' }],
						},
					}));
					return;
				}

				assert.strictEqual(payload.params?.name, 'splunk_run_query');
				assert.strictEqual(payload.params?.arguments?.query, 'search index=main | head 1');
				assert.strictEqual(payload.params?.arguments?.max_results, 10);
				res.end(JSON.stringify({
					jsonrpc: '2.0',
					result: {
						structuredContent: {
							messages: ['mcp ok'],
							results: [{ host: 'splunk-local', count: 1 }],
						},
					},
				}));
			});
		});

		await listen(server);

		try {
			const address = server.address();
			assert.ok(address && typeof address === 'object');

			const result = await executeSplSearch('index=main | head 1', {
				...mockConfig,
				splunkMcpEndpoint: `http://127.0.0.1:${address.port}/mcp`,
				splunkMcpToken: 'mcp-token',
				splunkMode: 'mcp',
				splunkSource: 'remote',
			});

			assert.strictEqual(result.status, 'success');
			assert.strictEqual(result.mode, 'mcp');
			assert.strictEqual(result.rowCount, 1);
			assert.deepStrictEqual(result.rows[0], { host: 'splunk-local', count: '1' });
			assert.ok(result.messages.includes('MCP info: connected'));
			assert.ok(result.messages.includes('mcp ok'));
			assert.strictEqual(calls.length, 2);
		} finally {
			await close(server);
		}
	});

	test('demo fixture time range rewrites auth queries to all time', () => {
		const widened = widenDemoFixtureTimeRange(
			'index=main sourcetype=auth action=failure earliest=-30m latest=now | stats count by country',
			mockConfig,
		);

		assert.ok(widened.includes('earliest=0'));
		assert.ok(!widened.includes('earliest=-30m'));
		assert.ok(widened.includes('| stats count by country'));
	});

	test('demo fixture time range leaves unrelated searches untouched', () => {
		const untouched = widenDemoFixtureTimeRange('index=_internal earliest=-15m | head 5', mockConfig);

		assert.strictEqual(untouched, 'index=_internal earliest=-15m | head 5');
	});

	test('demo fixture rewrite parses csv fields before auth filtering', () => {
		const rewritten = rewriteDemoFixtureSearch(
			'index=main sourcetype=auth action=failure earliest=0 | stats count by country user_agent',
			mockConfig,
		);

		assert.ok(rewritten.includes('| rex field=_raw'));
		assert.ok(rewritten.includes('| where timestamp!="timestamp" AND action="failure"'));
		assert.ok(rewritten.includes('| stats count by country user_agent'));
	});

	test('demo fixture rewrite leaves unrelated searches untouched', () => {
		const untouched = rewriteDemoFixtureSearch('index=_internal earliest=-15m | head 5', mockConfig);

		assert.strictEqual(untouched, 'index=_internal earliest=-15m | head 5');
	});
});

function listen(server: http.Server) {
	return new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			server.off('error', reject);
			resolve();
		});
	});
}

function close(server: http.Server) {
	return new Promise<void>((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		});
	});
}
