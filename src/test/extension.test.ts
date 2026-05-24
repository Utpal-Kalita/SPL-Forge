import * as assert from 'assert';
import * as vscode from 'vscode';
import { getPanelHtml } from '../panels/assistant';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('panel html shows day 1 scaffold state', () => {
		const html = getPanelHtml({
			cspSource: 'vscode-resource:',
			extensionUri: 'file:///tmp/spl-forge',
			mode: 'mock',
			source: 'self_hosted_trial',
			workspaceName: 'SPL-Forge',
		});

		assert.ok(html.includes('Day 1 scaffold ready'));
		assert.ok(html.includes('failed_login_auth.csv'));
		assert.ok(html.includes('Mode: mock'));
	});
});
