/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/forward': 'http://localhost:8000',
			'/probe': 'http://localhost:8000'
		}
	},
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['src/**/*.{test,spec}.{ts,svelte.ts}'],
		alias: {
			'svelte/internal/server': 'svelte/internal/client'
		}
	},
	resolve: mode === 'test' ? { conditions: ['browser'] } : undefined
}));
