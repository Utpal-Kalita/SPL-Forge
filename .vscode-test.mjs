import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	launchArgs: [
		'--disable-gpu',
		'--disable-dev-shm-usage',
		'--no-sandbox',
	],
	mocha: {
		timeout: 10000,
	},
});
