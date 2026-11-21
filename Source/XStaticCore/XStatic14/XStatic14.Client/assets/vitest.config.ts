import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		setupFiles: ['src/test-setup.ts'],
		include: ['src/**/*.test.ts'],
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/api/**', 'src/**/*.test.ts', 'src/test-setup.ts', 'src/vite-env.d.ts'],
			reporter: ['text', 'text-summary'],
		},
	},
});
