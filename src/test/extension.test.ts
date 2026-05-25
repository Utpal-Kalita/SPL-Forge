import * as assert from 'assert';
import * as vscode from 'vscode';
import type { ForgeConfig } from '../config/env';
import { getPanelHtml } from '../panels/assistant';
import { analyzePrompt, extractSpl, generateSplFromPrompt, summarizeIntent } from '../agent/generate';
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

		assert.ok(html.includes('Day 4 Splunk Connectivity'));
		assert.ok(html.includes('Generate + Run SPL'));
		assert.ok(html.includes('failed_login_auth.csv'));
		assert.ok(html.includes('Provider: mock'));
		assert.ok(html.includes('Query Plan'));
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

	test('rest splunk adapter reports missing credentials', async () => {
		const result = await executeSplSearch('index=main | head 1', {
			...mockConfig,
			splunkMode: 'rest',
		});

		assert.strictEqual(result.status, 'error');
		assert.ok(result.messages[0].includes('REST mode requires'));
	});

	test('mcp splunk adapter reports missing endpoint or token', async () => {
		const result = await executeSplSearch('index=main | head 1', {
			...mockConfig,
			splunkMode: 'mcp',
		});

		assert.strictEqual(result.status, 'error');
		assert.ok(result.messages[0].includes('MCP mode requires'));
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
