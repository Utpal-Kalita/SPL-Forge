import type { ForgeConfig } from '../config/env';
import { executeSplSearch, type SplunkSearchResult } from '../splunk/execute';
import { inspectSplunkSchema, type SplunkSchemaSummary } from '../splunk/schema';
import { analyzePrompt, generateSplFromPrompt, type GenerateSplResult } from './generate';
import { repairSplWithLlm } from './repair';

export type ForgeRunAttempt = {
	execution: SplunkSearchResult;
	repairReason?: string;
	schema?: SplunkSchemaSummary;
	spl: string;
};

export type ForgeRunResult = GenerateSplResult & {
	attempts: ForgeRunAttempt[];
	execution: SplunkSearchResult;
	repairSummary: string;
};

const maxRepairAttempts = 2;

export async function runForgePrompt(prompt: string, config: ForgeConfig): Promise<ForgeRunResult> {
	const generation = await generateSplFromPrompt({ prompt }, config);
	const intent = analyzePrompt(prompt);
	const attempts: ForgeRunAttempt[] = [];
	let currentSpl = generation.spl;

	for (let attemptIndex = 0; attemptIndex <= maxRepairAttempts; attemptIndex += 1) {
		const execution = await executeSplSearch(currentSpl, config);
		attempts.push({ execution, spl: currentSpl });

		if (execution.status === 'success' && execution.rowCount > 0) {
			return finish(generation, attempts);
		}

		if (attemptIndex === maxRepairAttempts) {
			return finish(generation, attempts);
		}

		const schema = await inspectSplunkSchema(currentSpl, config);
		const repair = await repairSplWithLlm(prompt, intent, currentSpl, execution, schema, config);
		attempts[attempts.length - 1] = {
			...attempts[attempts.length - 1],
			repairReason: repair.reason,
			schema,
		};

		if (!repair.shouldRetry || !config.splunkRepairAutoRun) {
			return finish(generation, attempts);
		}

		currentSpl = repair.repairedSpl;
	}

	return finish(generation, attempts);
}

function finish(generation: GenerateSplResult, attempts: ForgeRunAttempt[]): ForgeRunResult {
	const finalAttempt = attempts[attempts.length - 1];
	const repairs = attempts.filter((attempt) => attempt.repairReason);

	return {
		...generation,
		attempts,
		execution: finalAttempt.execution,
		repairSummary: repairs.length > 0
			? repairs.map((attempt, index) => `Repair ${index + 1}: ${attempt.repairReason}`).join('\n')
			: 'No repair needed.',
		spl: finalAttempt.spl,
	};
}
