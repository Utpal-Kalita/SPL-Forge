import type { SplunkSearchResult } from '../splunk/execute';
import type { SplunkSchemaSummary } from '../splunk/schema';

export type RepairDecision = {
	diagnostics: string[];
	reason: string;
	repairedSpl: string;
	shouldRetry: boolean;
};

const fieldAliases: Record<string, string> = {
	browser: 'user_agent',
	client_ip: 'src',
	clientip: 'src',
	geo: 'country',
	ip: 'src',
	location: 'country',
	result: 'action',
	source_ip: 'src',
	src_ip: 'src',
	status: 'action',
	useragent: 'user_agent',
	username: 'user',
};

export function repairSplQuery(spl: string, execution: SplunkSearchResult, schema: SplunkSchemaSummary): RepairDecision {
	const diagnostics = [
		`Execution status: ${execution.status}`,
		`Rows: ${execution.rowCount}`,
		`Messages: ${execution.messages.length > 0 ? execution.messages.join(' | ') : 'none'}`,
		`Known fields: ${schema.fields.join(', ')}`,
	];
	let repaired = spl;
	const changes: string[] = [];

	repaired = replaceMissingIndex(repaired, schema, changes);
	repaired = replaceMissingSourcetype(repaired, schema, changes);
	repaired = normalizeFailureFilters(repaired, changes);
	repaired = replaceFieldAliases(repaired, schema, changes);

	if (execution.rowCount === 0 && !/\bearliest=0\b/.test(repaired)) {
		repaired = widenTimeRange(repaired);
		changes.push('widened time range to earliest=0 for verification retry');
	}

	if (changes.length === 0) {
		return {
			diagnostics,
			reason: 'No deterministic repair rule matched.',
			repairedSpl: spl,
			shouldRetry: false,
		};
	}

	return {
		diagnostics,
		reason: changes.join('; '),
		repairedSpl: repaired,
		shouldRetry: repaired !== spl,
	};
}

function replaceMissingIndex(spl: string, schema: SplunkSchemaSummary, changes: string[]) {
	const preferred = schema.indexes.includes('main') ? 'main' : schema.indexes[0];

	if (!preferred) {
		return spl;
	}

	if (!/\bindex=/.test(spl)) {
		changes.push(`added index=${preferred}`);
		return `index=${preferred} ${spl}`;
	}

	return spl.replace(/\bindex=([^\s|]+)/, (match, value: string) => {
		if (schema.indexes.includes(value)) {
			return match;
		}

		changes.push(`replaced index=${value} with index=${preferred}`);
		return `index=${preferred}`;
	});
}

function replaceMissingSourcetype(spl: string, schema: SplunkSchemaSummary, changes: string[]) {
	const preferred = schema.sourcetypes.includes('auth') ? 'auth' : schema.sourcetypes[0];

	if (!preferred) {
		return spl;
	}

	if (!/\bsourcetype=/.test(spl)) {
		changes.push(`added sourcetype=${preferred}`);
		return spl.replace(/\bindex=[^\s|]+/, (match) => `${match} sourcetype=${preferred}`);
	}

	return spl.replace(/\bsourcetype=([^\s|]+)/, (match, value: string) => {
		if (schema.sourcetypes.includes(value)) {
			return match;
		}

		changes.push(`replaced sourcetype=${value} with sourcetype=${preferred}`);
		return `sourcetype=${preferred}`;
	});
}

function normalizeFailureFilters(spl: string, changes: string[]) {
	let repaired = spl;
	const before = repaired;

	repaired = repaired
		.replace(/\baction=(failed|failure_login|login_failure)\b/gi, 'action=failure')
		.replace(/\b(status|outcome|result)=(failed|failure|fail)\b/gi, 'action=failure')
		.replace(/\b(status|outcome|result)=(success|successful)\b/gi, 'action=success');

	if (repaired !== before) {
		changes.push('normalized login outcome filter to action=failure/action=success');
	}

	return repaired;
}

function replaceFieldAliases(spl: string, schema: SplunkSchemaSummary, changes: string[]) {
	let repaired = spl;

	for (const [alias, target] of Object.entries(fieldAliases)) {
		if (!schema.fields.includes(target)) {
			continue;
		}

		const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'g');
		if (!pattern.test(repaired)) {
			continue;
		}

		repaired = repaired.replace(pattern, target);
		changes.push(`replaced field ${alias} with ${target}`);
	}

	return repaired;
}

function widenTimeRange(spl: string) {
	if (/\bearliest=/.test(spl)) {
		return spl.replace(/\bearliest=[^\s|]+/, 'earliest=0');
	}

	const pipeIndex = spl.indexOf('|');

	if (pipeIndex === -1) {
		return `${spl} earliest=0`;
	}

	return `${spl.slice(0, pipeIndex).trimEnd()} earliest=0 ${spl.slice(pipeIndex)}`;
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

