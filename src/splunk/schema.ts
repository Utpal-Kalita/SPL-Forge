import type { ForgeConfig } from '../config/env';
import { executeSplSearch } from './execute';

export type SplunkSchemaSummary = {
	fields: string[];
	indexes: string[];
	messages: string[];
	sourcetypes: string[];
};

const demoSchema: SplunkSchemaSummary = {
	fields: ['_time', 'action', 'country', 'src', 'user', 'user_agent'],
	indexes: ['main'],
	messages: ['Using built-in failed-login demo schema.'],
	sourcetypes: ['auth'],
};

export async function inspectSplunkSchema(search: string, config: ForgeConfig): Promise<SplunkSchemaSummary> {
	if (config.splunkMode === 'mock') {
		return demoSchema;
	}

	const index = search.match(/\bindex=([^\s|]+)/)?.[1] ?? 'main';
	const sourcetype = search.match(/\bsourcetype=([^\s|]+)/)?.[1] ?? 'auth';
	const probeSearch = `index=${index} sourcetype=${sourcetype} earliest=0 | head ${Math.min(config.splunkSearchLimit, 5)}`;
	const result = await executeSplSearch(probeSearch, {
		...config,
		splunkSource: config.splunkSource === 'self_hosted_trial' ? 'remote' : config.splunkSource,
	});

	const fields = result.fields.length > 0 ? result.fields : demoSchema.fields;
	const indexes = [...new Set([index, ...demoSchema.indexes])];
	const sourcetypes = [...new Set([sourcetype, ...demoSchema.sourcetypes])];

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

