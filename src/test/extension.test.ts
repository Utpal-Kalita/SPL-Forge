import * as assert from 'assert';
import * as http from 'http';
import * as vscode from 'vscode';
import { generateAlertArtifact } from '../artifacts/alert';
import { buildClassicDashboardXml, generateDashboardArtifact } from '../artifacts/dashboard';
import { buildSplunkAppPackage } from '../artifacts/package';
import type { ForgeConfig } from '../config/env';
import { getPanelHtml } from '../panels/assistant';
import { analyzePrompt, extractSpl, generateSplFromPrompt, normalizeGeneratedSpl, summarizeIntent } from '../agent/generate';
import { repairSplQuery } from '../agent/repair';
import { runForgePrompt } from '../agent/workflow';
import { executeSplSearch, rewriteDemoFixtureSearch, widenDemoFixtureTimeRange } from '../splunk/execute';
import { publishSplunkAppPackage } from '../splunk/publish';
import { inspectSplunkSchema } from '../splunk/schema';

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
		splunkApp: 'search',
		splunkMode: 'mock',
		splunkOwner: 'nobody',
		splunkPassword: undefined,
		splunkRepairAutoRun: true,
		splunkSearchLimit: 10,
		splunkSource: 'self_hosted_trial',
		splunkToken: undefined,
		splunkUrl: 'https://localhost:8089',
		splunkWebUrl: 'http://localhost:8000',
		splunkUsername: undefined,
		workspaceName: 'SPL-Forge',
	};

	test('panel html shows day 1 scaffold state', () => {
		const html = getPanelHtml({
			config: mockConfig,
			cspSource: 'vscode-resource:',
			extensionUri: 'file:///tmp/spl-forge',
			state: {
				history: [],
				lastPrompt: 'Create failed login dashboard',
				lastPlanSummary: 'Artifact: dashboard | Focus: failed logins',
				status: 'idle',
			},
		});

		assert.ok(html.includes('Agentic Splunk Artifact Loop'));
		assert.ok(html.includes('Generate + Run SPL'));
    assert.ok(html.includes('Export App'));
    assert.ok(html.includes('Publish to Splunk'));
		assert.ok(html.includes('failed_login_auth.csv'));
		assert.ok(html.includes('Provider: mock'));
		assert.ok(html.includes('Query Plan'));
    assert.ok(html.includes('Repair History'));
    assert.ok(html.includes('Repair: auto-rerun'));
    assert.ok(html.includes('Execution Summary'));
    assert.ok(html.includes('Dashboard Artifact'));
    assert.ok(html.includes('Alert Artifact'));
    assert.ok(html.includes('Query History'));
    assert.ok(html.includes('Error Log'));
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
		assert.ok(result.spl.includes('| timechart span=15m count as failed_logins by country'));
	});

  test('normalization preserves requested trend breakdown after unsafe provider output fallback', () => {
    const intent = analyzePrompt('Create a failed login trend dashboard by country for the last 30 minutes. Alert if failed attempts exceed 3 in 5 minutes.');
    const normalized = normalizeGeneratedSpl([
      'index=main sourcetype=auth action=failure',
      '| timechart span=5min count as failed_logins by country',
      '| sendalert alert="Failed Logins Exceeded" to="admin"',
      '| timechart span=5min count as failed_logins by country',
    ].join(' '), intent);

    assert.ok(normalized.includes('earliest=-30m latest=now'));
    assert.ok(normalized.includes('| timechart span=5m count as failed_logins by country'));
    assert.ok(!normalized.includes('sendalert'));
  });

  test('complex top source-ip prompt keeps limit and threshold window', async () => {
    const generated = await generateSplFromPrompt({
      prompt: 'Show top 3 source IPs with failed logins today.',
    }, mockConfig);
    const alertGenerated = await generateSplFromPrompt({
      prompt: 'Alert if failed logins by source IP exceed 2 in 5 minutes.',
    }, mockConfig);

    assert.ok(generated.planSummary.includes('Limit: top 3'));
    assert.ok(generated.spl.includes('action=failure'));
    assert.ok(generated.spl.includes('by src'));
    assert.ok(generated.spl.includes('| head 3'));
    assert.ok(alertGenerated.spl.includes('| stats count as failed_logins by _time src'));
  });

	test('time parser handles today wording', () => {
		const intent = analyzePrompt('Show successful login counts by user today.');

		assert.strictEqual(intent.earliest, '@d');
		assert.strictEqual(intent.wantsSuccessLogins, true);
	});

  test('successful login dashboard prompt uses success action and success metric', async () => {
    const result = await generateSplFromPrompt({
      prompt: 'Create a successful login dashboard by user and country for today. Alert if successful logins exceed 5 in 5 minutes.',
    }, mockConfig);

    assert.ok(result.planSummary.includes('Focus: successful logins'));
    assert.ok(result.spl.includes('action=success'));
    assert.ok(result.spl.includes('earliest=@d latest=now'));
    assert.ok(result.spl.includes('| stats count as successful_logins by country user'));
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
    assert.ok(result.dashboard);
    assert.strictEqual(result.dashboard.visualizationType, 'bar');
    assert.ok(result.dashboard.dashboardJson.includes('"type": "ds.search"'));
    assert.ok(result.dashboard.classicXml.includes('<dashboard version="1.1">'));
    assert.strictEqual(result.dashboard.viewName, 'failed_login_dashboard');
    assert.strictEqual(result.alert, undefined);
  });

  test('forge workflow returns alert artifact for dashboard plus alert prompt', async () => {
    const result = await runForgePrompt(
      'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.',
      mockConfig,
    );

    assert.ok(result.dashboard);
    assert.ok(result.alert);
    assert.strictEqual(result.alert.condition, 'failed_logins > 100 in 5 minutes');
    assert.ok(result.alert.alertSearch.includes('| bin _time span=5m'));
    assert.ok(result.alert.savedSearchConf.includes('disabled = 1'));
  });

  test('dashboard artifact generates dashboard studio json from result schema', () => {
    const intent = analyzePrompt('Create a failed login dashboard by country and user agent.');
    const dashboard = generateDashboardArtifact(
      'Create a failed login dashboard by country and user agent.',
      intent,
      'index=main sourcetype=auth action=failure | stats count as failed_logins by country user_agent | sort - failed_logins',
      {
        elapsedMs: 5,
        fields: ['country', 'user_agent', 'failed_logins'],
        messages: [],
        mode: 'mock',
        rowCount: 2,
        rows: [],
        search: 'index=main sourcetype=auth action=failure | stats count as failed_logins by country user_agent | sort - failed_logins',
        status: 'success',
      },
    );

    assert.ok(dashboard);
    assert.strictEqual(dashboard.title, 'Failed Login Dashboard');
    assert.strictEqual(dashboard.visualizationType, 'bar');
    assert.ok(dashboard.dashboardJson.includes('"viz_primary"'));
    assert.ok(dashboard.dashboardJson.includes('"splunk.bar"'));
    assert.ok(dashboard.dashboardJson.includes('"ds.search"'));
    assert.ok(dashboard.classicXml.includes('<option name="charting.chart">bar</option>'));
    assert.strictEqual(dashboard.viewName, 'failed_login_dashboard');
  });

  test('classic dashboard xml escapes executable search', () => {
    const xml = buildClassicDashboardXml(
      'Failed Login Dashboard',
      'index=main sourcetype=auth | where user!="root" AND failed_logins > 0',
      'bar',
    );

    assert.ok(xml.includes('Failed Login Dashboard'));
    assert.ok(xml.includes('user!=&quot;root&quot;'));
    assert.ok(xml.includes('failed_logins &gt; 0'));
  });

  test('alert artifact generates saved search preview from threshold intent', () => {
    const intent = analyzePrompt('Alert if failed attempts exceed 100 in 5 minutes.');
    const alert = generateAlertArtifact(
      'Alert if failed attempts exceed 100 in 5 minutes.',
      intent,
      'index=main sourcetype=auth action=failure latest=now | stats count as failed_logins by country user_agent user | sort - failed_logins',
    );

    assert.ok(alert);
    assert.strictEqual(alert.title, 'Failed Login Threshold Alert');
    assert.strictEqual(alert.cronSchedule, '*/5 * * * *');
    assert.ok(alert.alertSearch.includes('| where failed_logins > 100'));
    assert.ok(alert.savedSearchConf.includes('alert_type = number of events'));
  });

  test('splunk app package contains app config, dashboard, saved search, metadata, and readme', async () => {
    const result = await runForgePrompt(
      'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.',
      mockConfig,
    );
    const appPackage = buildSplunkAppPackage({ appId: 'SPL Forge Generated App', result });

    assert.strictEqual(appPackage.appId, 'spl_forge_generated_app');
    assert.ok(appPackage.files['default/app.conf'].includes('SPL Forge Generated App'));
    assert.ok(appPackage.files['metadata/default.meta'].includes('export = system'));
    assert.ok(appPackage.files['default/savedsearches.conf'].includes('[Failed Login Threshold Alert]'));
    assert.ok(appPackage.files['default/savedsearches.conf'].includes('| bin _time span=5m'));
    assert.ok(appPackage.files['default/data/ui/views/failed_login_dashboard.xml'].includes('<dashboard version="1.1">'));
    assert.ok(appPackage.files['README.md'].includes('Rows verified before export'));
    assert.ok(appPackage.files['spl-forge-manifest.json'].includes('"rowCount"'));
  });

  test('splunk publisher posts dashboard and disabled alert through REST', async () => {
    const requests: Array<{ body: string; path: string }> = [];
    const server = http.createServer((request, response) => {
      const chunks: Buffer[] = [];

      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        requests.push({
          body: Buffer.concat(chunks).toString('utf8'),
          path: request.url ?? '',
        });
        response.writeHead(201, { 'Content-Type': 'application/xml' });
        response.end('<response />');
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
      const address = server.address();
      assert.ok(address && typeof address === 'object');
      const result = await runForgePrompt(
        'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.',
        mockConfig,
      );
      const appPackage = buildSplunkAppPackage({ result });
      const published = await publishSplunkAppPackage({
        ...mockConfig,
        splunkMode: 'rest',
        splunkPassword: 'changeme',
        splunkUrl: `http://127.0.0.1:${address.port}`,
        splunkUsername: 'admin',
      }, appPackage);

      assert.strictEqual(published.dashboard, 'failed_login_dashboard');
      assert.strictEqual(published.alert, 'Failed Login Threshold Alert');
      assert.strictEqual(requests.length, 2);
      assert.ok(requests.some((entry) => entry.path === '/servicesNS/nobody/search/data/ui/views'));
      const alertRequest = requests.find((entry) => entry.path === '/servicesNS/nobody/search/saved/searches');
      assert.ok(alertRequest);
      assert.ok(alertRequest.body.includes('disabled=1'));
      assert.ok(alertRequest.body.includes('Failed+Login+Threshold+Alert'));
    } finally {
      server.close();
    }
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

	test('mcp schema inspection calls metadata tools', async () => {
		const calls: string[] = [];
		const server = http.createServer((req, res) => {
			const chunks: Buffer[] = [];
			req.on('data', (chunk: Buffer) => chunks.push(chunk));
			req.on('end', () => {
				const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
					params?: {
						name?: string;
					};
				};
				const toolName = payload.params?.name ?? 'unknown';
				calls.push(toolName);
				res.writeHead(200, { 'Content-Type': 'application/json' });

				if (toolName === 'splunk_get_info') {
					res.end(JSON.stringify({
						jsonrpc: '2.0',
						result: { content: [{ text: JSON.stringify({ messages: ['connected'] }), type: 'text' }] },
					}));
					return;
				}

				if (toolName === 'splunk_run_query') {
					res.end(JSON.stringify({
						jsonrpc: '2.0',
						result: {
							structuredContent: {
								messages: ['schema probe ok'],
								results: [{ action: 'failure', country: 'US', user_agent: 'Firefox' }],
							},
						},
					}));
					return;
				}

				if (toolName === 'splunk_get_indexes') {
					res.end(JSON.stringify({
						jsonrpc: '2.0',
						result: { structuredContent: { indexes: [{ name: 'main' }, { name: '_internal' }] } },
					}));
					return;
				}

				assert.strictEqual(toolName, 'splunk_get_metadata');
				res.end(JSON.stringify({
					jsonrpc: '2.0',
					result: { structuredContent: { sourcetypes: ['auth', 'splunkd'] } },
				}));
			});
		});

		await listen(server);

		try {
			const address = server.address();
			assert.ok(address && typeof address === 'object');

			const schema = await inspectSplunkSchema('index=main sourcetype=auth action=failure | head 1', {
				...mockConfig,
				splunkMcpEndpoint: `http://127.0.0.1:${address.port}/mcp`,
				splunkMcpToken: 'mcp-token',
				splunkMode: 'mcp',
				splunkSource: 'remote',
			});

			assert.deepStrictEqual(calls, ['splunk_get_info', 'splunk_run_query', 'splunk_get_indexes', 'splunk_get_metadata']);
			assert.ok(schema.indexes.includes('main'));
			assert.ok(schema.indexes.includes('_internal'));
			assert.ok(schema.sourcetypes.includes('auth'));
			assert.ok(schema.sourcetypes.includes('splunkd'));
			assert.ok(schema.messages.includes('MCP schema splunk_get_indexes: ok'));
			assert.ok(schema.messages.includes('MCP schema splunk_get_metadata: ok'));
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
