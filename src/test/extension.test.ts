import * as assert from 'assert';
import * as vscode from 'vscode';
import type { ForgeConfig } from '../config/env';
import { getPanelHtml } from '../panels/assistant';
import { analyzePrompt, extractSpl, generateSplFromPrompt, summarizeIntent } from '../agent/generate';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('panel html shows day 1 scaffold state', () => {
		const config: ForgeConfig = {
			groqApiKey: undefined,
			groqModel: 'llama-3.1-8b-instant',
			llmModel: 'mock-spl-forge-v1',
			llmProvider: 'mock',
			splunkMode: 'mock',
			splunkSource: 'self_hosted_trial',
			workspaceName: 'SPL-Forge',
		};

		const html = getPanelHtml({
			config,
			cspSource: 'vscode-resource:',
			extensionUri: 'file:///tmp/spl-forge',
			state: {
				lastPrompt: 'Create failed login dashboard',
				lastPlanSummary: 'Artifact: dashboard | Focus: failed logins',
				status: 'idle',
			},
		});

		assert.ok(html.includes('Day 3 Query Generation'));
		assert.ok(html.includes('Generate Query Plan + SPL'));
		assert.ok(html.includes('failed_login_auth.csv'));
		assert.ok(html.includes('Provider: mock'));
		assert.ok(html.includes('Query Plan'));
	});

	test('extract spl removes fenced markdown', () => {
		const parsed = extractSpl('```spl\nindex=main | head 10\n```');

		assert.strictEqual(parsed, 'index=main | head 10');
	});

	test('analyze prompt captures day 3 intent', () => {
		const intent = analyzePrompt('Create a failed login dashboard by country and user agent for the last 30 minutes. Alert if failed attempts exceed 100 in 5 minutes.');

		assert.deepStrictEqual(intent.breakdowns, ['country', 'user_agent']);
		assert.strictEqual(intent.artifact, 'dashboard+alert');
		assert.strictEqual(intent.focusField, 'country');
		assert.strictEqual(intent.earliest, '-30m');
		assert.strictEqual(intent.threshold, 100);
		assert.ok(summarizeIntent(intent).includes('Threshold: > 100 in 5 minutes'));
	});

	test('mock fallback generates structured failed login spl', async () => {
		const config: ForgeConfig = {
			groqApiKey: undefined,
			groqModel: 'llama-3.1-8b-instant',
			llmModel: 'mock-spl-forge-v1',
			llmProvider: 'mock',
			splunkMode: 'mock',
			splunkSource: 'self_hosted_trial',
			workspaceName: 'SPL-Forge',
		};

		const result = await generateSplFromPrompt({
			prompt: 'Create a failed login dashboard by country and user agent for the last 30 minutes.',
		}, config);

		assert.ok(result.planSummary.includes('Breakdowns: country, user_agent'));
		assert.ok(result.spl.includes('index=main sourcetype=auth action=failure earliest=-30m latest=now'));
		assert.ok(result.spl.includes('| stats count as failed_logins by country user_agent'));
	});

	test('mock fallback shapes threshold alert queries', async () => {
		const config: ForgeConfig = {
			groqApiKey: undefined,
			groqModel: 'llama-3.1-8b-instant',
			llmModel: 'mock-spl-forge-v1',
			llmProvider: 'mock',
			splunkMode: 'mock',
			splunkSource: 'self_hosted_trial',
			workspaceName: 'SPL-Forge',
		};

		const result = await generateSplFromPrompt({
			prompt: 'Alert if failed logins exceed 100 in 5 minutes.',
		}, config);

		assert.ok(result.planSummary.includes('Artifact: alert'));
		assert.ok(result.spl.includes('| bin _time span=5m'));
		assert.ok(result.spl.includes('| where failed_logins > 100'));
	});

	test('mock fallback shapes trend queries for broader time windows', async () => {
		const config: ForgeConfig = {
			groqApiKey: undefined,
			groqModel: 'llama-3.1-8b-instant',
			llmModel: 'mock-spl-forge-v1',
			llmProvider: 'mock',
			splunkMode: 'mock',
			splunkSource: 'self_hosted_trial',
			workspaceName: 'SPL-Forge',
		};

		const result = await generateSplFromPrompt({
			prompt: 'Show failed login trend by country over time for past 2 hours.',
		}, config);

		assert.ok(result.planSummary.includes('Time: -2h to now'));
		assert.ok(result.spl.includes('earliest=-2h latest=now'));
		assert.ok(result.spl.includes('| timechart span=15m count as failed_logins'));
	});

	test('time parser handles today wording', () => {
		const intent = analyzePrompt('Show successful login counts by user today.');

		assert.strictEqual(intent.earliest, '@d');
		assert.strictEqual(intent.wantsSuccessLogins, true);
	});
});
