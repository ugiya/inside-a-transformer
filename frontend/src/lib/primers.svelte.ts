// Self-contained primer-dismissal registry.
//
// Wave 1 slices run in parallel — this slice MUST NOT depend on the
// GameState slice (#5). It owns its own private localStorage key.

import { SvelteSet } from 'svelte/reactivity';

const STORAGE_KEY = 'tr.primers.dismissed';

function readInitial(): string[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string');
	} catch {
		// Corrupt JSON — fall through to empty.
	}
	return [];
}

function persist(set: SvelteSet<string>) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
	} catch {
		// Ignore quota / disabled-storage errors. Dismissal is best-effort.
	}
}

function makeState() {
	// SvelteSet is the reactive Set primitive that tracks .has() / .add() etc
	// across the Svelte 5 runes runtime.
	const dismissed = new SvelteSet<string>(readInitial());

	return {
		dismiss(term: string) {
			if (dismissed.has(term)) return;
			dismissed.add(term);
			persist(dismissed);
		},
		isDismissed(term: string): boolean {
			return dismissed.has(term);
		},
		clearAll() {
			dismissed.clear();
			if (typeof localStorage !== 'undefined') {
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch {
					// ignore
				}
			}
		},
		// Test-only escape hatch; harmless in prod.
		get _size() {
			return dismissed.size;
		}
	};
}

export const primers = makeState();
export type PrimersRegistry = ReturnType<typeof makeState>;
