import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import type { SplunkAppPackage } from '../artifacts/package';
import type { ForgeConfig } from '../config/env';

export type SplunkPublishResult = {
  alert?: string;
  app: string;
  dashboard?: string;
  dashboardUrl?: string;
  owner: string;
  published: string[];
};

type SavedSearch = {
  description?: string;
  name: string;
  values: Record<string, string>;
};

export async function publishSplunkAppPackage(config: ForgeConfig, appPackage: SplunkAppPackage): Promise<SplunkPublishResult> {
  const app = config.splunkApp || 'search';
  const owner = config.splunkOwner || 'nobody';
  const published: string[] = [];
  const dashboard = findDashboard(appPackage);
  const alert = parseSavedSearch(appPackage.files['default/savedsearches.conf']);

  if (!dashboard && !alert) {
    throw new Error('No dashboard or saved search found in package.');
  }

  if (dashboard) {
    await publishDashboard(config, owner, app, dashboard.viewName, dashboard.xml);
    published.push(`dashboard:${dashboard.viewName}`);
  }

  if (alert) {
    await publishSavedSearch(config, owner, app, alert);
    published.push(`alert:${alert.name}`);
  }

  const uiBase = buildSplunkWebUrl(config);

  return {
    alert: alert?.name,
    app,
    dashboard: dashboard?.viewName,
    dashboardUrl: dashboard ? `${uiBase}/app/${encodeURIComponent(app)}/${encodeURIComponent(dashboard.viewName)}` : undefined,
    owner,
    published,
  };
}

function buildSplunkWebUrl(config: ForgeConfig) {
  if (config.splunkWebUrl) {
    return config.splunkWebUrl.replace(/\/$/, '');
  }

  const endpoint = new URL(config.splunkUrl);
  endpoint.protocol = 'http:';
  endpoint.port = '8000';
  endpoint.pathname = '';
  endpoint.search = '';
  endpoint.hash = '';
  return endpoint.toString().replace(/\/$/, '');
}

function findDashboard(appPackage: SplunkAppPackage) {
  const entry = Object.entries(appPackage.files).find(([relativePath]) => (
    relativePath.startsWith('default/data/ui/views/') && relativePath.endsWith('.xml')
  ));

  if (!entry) {
    return undefined;
  }

  const [relativePath, xml] = entry;
  return {
    viewName: path.basename(relativePath, '.xml'),
    xml,
  };
}

function parseSavedSearch(conf: string | undefined): SavedSearch | undefined {
  if (!conf) {
    return undefined;
  }

  const lines = conf.split(/\r?\n/);
  const firstStanza = lines.find((line) => /^\[[^\]]+\]$/.test(line.trim()));

  if (!firstStanza) {
    return undefined;
  }

  const name = firstStanza.trim().slice(1, -1);
  const values: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    values[key] = value;
  }

  if (!values.search) {
    return undefined;
  }

  return {
    description: values.description,
    name,
    values,
  };
}

function publishDashboard(config: ForgeConfig, owner: string, app: string, viewName: string, xml: string) {
  return postForm(config, `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/data/ui/views`, {
    'eai:data': xml,
    name: viewName,
  }).then((response) => {
    if (response.statusCode === 409) {
      return postForm(config, `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/data/ui/views/${encodeURIComponent(viewName)}`, {
        'eai:data': xml,
      });
    }

    return response;
  }).then((response) => {
    assertSuccess(response, 'Dashboard publish');
  });
}

function publishSavedSearch(config: ForgeConfig, owner: string, app: string, savedSearch: SavedSearch) {
  return postForm(config, `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/saved/searches`, {
    ...savedSearch.values,
    disabled: '1',
    name: savedSearch.name,
  }).then((response) => {
    if (response.statusCode === 409) {
      return postForm(config, `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/saved/searches/${encodeURIComponent(savedSearch.name)}`, {
        ...savedSearch.values,
        disabled: '1',
      });
    }

    return response;
  }).then((response) => {
    assertSuccess(response, 'Alert publish');
  });
}

function assertSuccess(response: { body: string; statusCode: number }, label: string) {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`${label} failed: HTTP ${response.statusCode} ${response.body.trim()}`);
  }
}

function postForm(config: ForgeConfig, pathname: string, values: Record<string, string>) {
  return new Promise<{ body: string; statusCode: number }>((resolve, reject) => {
    const endpoint = new URL(config.splunkUrl);
    const isHttps = endpoint.protocol === 'https:';
    const body = new URLSearchParams(values).toString();
    const headers: Record<string, string> = {
      'Content-Length': Buffer.byteLength(body).toString(),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (config.splunkToken) {
      headers.Authorization = `Bearer ${config.splunkToken}`;
    } else if (config.splunkUsername && config.splunkPassword) {
      headers.Authorization = `Basic ${Buffer.from(`${config.splunkUsername}:${config.splunkPassword}`).toString('base64')}`;
    } else {
      reject(new Error('Splunk publish requires SPL_FORGE_SPLUNK_TOKEN or username/password REST credentials.'));
      return;
    }

    const request = (isHttps ? https : http).request({
      headers,
      hostname: endpoint.hostname,
      method: 'POST',
      path: pathname,
      port: endpoint.port || (isHttps ? 443 : 80),
      protocol: endpoint.protocol,
      rejectUnauthorized: isHttps ? !config.splunkAllowSelfSigned : undefined,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve({
        body: Buffer.concat(chunks).toString('utf8'),
        statusCode: res.statusCode ?? 0,
      }));
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}
