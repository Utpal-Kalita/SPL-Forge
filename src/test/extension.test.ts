import * as assert from 'assert';
import * as vscode from 'vscode';
import type { ForgeConfig } from '../config/env';
import { getPanelHtml } from '../panels/assistant';
import { extractSpl } from '../agent/generate';

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
				status: 'idle',
			},
		});

		assert.ok(html.includes('Day 2 LLM integration'));
		assert.ok(html.includes('Generate Raw SPL'));
		assert.ok(html.includes('failed_login_auth.csv'));
		assert.ok(html.includes('Provider: mock'));
	});

	test('extract spl removes fenced markdown', () => {
		const parsed = extractSpl('```spl\nindex=main | head 10\n```');

		assert.strictEqual(parsed, 'index=main | head 10');
	});
});
