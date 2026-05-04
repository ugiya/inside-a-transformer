import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal localStorage mock for jsdom (jsdom provides one but we want a clean slate per test)
function freshLocalStorage() {
	let store: Record<string, string> = {};
	return {
		getItem: (k: string) => (k in store ? store[k] : null),
		setItem: (k: string, v: string) => {
			store[k] = String(v);
		},
		removeItem: (k: string) => {
			delete store[k];
		},
		clear: () => {
			store = {};
		},
		key: (i: number) => Object.keys(store)[i] ?? null,
		get length() {
			return Object.keys(store).length;
		}
	};
}

describe('primers registry', () => {
	beforeEach(() => {
		vi.resetModules();
		Object.defineProperty(globalThis, 'localStorage', {
			value: freshLocalStorage(),
			writable: true,
			configurable: true
		});
	});

	it('starts with no terms dismissed', async () => {
		const { primers } = await import('./primers.svelte');
		expect(primers.isDismissed('logits')).toBe(false);
	});

	it('dismiss(term) marks a term as dismissed', async () => {
		const { primers } = await import('./primers.svelte');
		primers.dismiss('logits');
		expect(primers.isDismissed('logits')).toBe(true);
		expect(primers.isDismissed('softmax')).toBe(false);
	});

	it('persists dismissed terms across module re-imports via localStorage', async () => {
		const first = await import('./primers.svelte');
		first.primers.dismiss('softmax');

		// Reset module cache; the stored value must survive into the new instance.
		vi.resetModules();
		const second = await import('./primers.svelte');
		expect(second.primers.isDismissed('softmax')).toBe(true);
	});

	it('clearAll() resets all dismissed state and clears storage', async () => {
		const { primers } = await import('./primers.svelte');
		primers.dismiss('logits');
		primers.dismiss('softmax');
		primers.clearAll();
		expect(primers.isDismissed('logits')).toBe(false);
		expect(primers.isDismissed('softmax')).toBe(false);
		// New instance after clearAll should be empty too
		vi.resetModules();
		const reloaded = await import('./primers.svelte');
		expect(reloaded.primers.isDismissed('logits')).toBe(false);
	});

	it('uses a self-contained localStorage key (not coupled to GameState)', async () => {
		const { primers } = await import('./primers.svelte');
		primers.dismiss('logits');
		// The slice's documented private key:
		const raw = localStorage.getItem('tr.primers.dismissed');
		expect(raw).not.toBeNull();
		expect(raw).toContain('logits');
	});
});
