import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameState, type GameStateStore } from './gameState.svelte';

/**
 * In-memory localStorage shim. Vitest's jsdom provides one, but we want
 * deterministic isolation between tests and the ability to inject corrupt
 * data without leaking state across tests.
 */
function makeMemoryStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear() {
			map.clear();
		},
		getItem(key: string) {
			return map.has(key) ? (map.get(key) as string) : null;
		},
		key(i: number) {
			return Array.from(map.keys())[i] ?? null;
		},
		removeItem(key: string) {
			map.delete(key);
		},
		setItem(key: string, value: string) {
			map.set(key, String(value));
		}
	};
}

const STORAGE_KEY = 'transformer-rooms:gameState:v1';

describe('gameState — default state on first load', () => {
	let storage: Storage;
	let store: GameStateStore;

	beforeEach(() => {
		storage = makeMemoryStorage();
		vi.stubGlobal('localStorage', storage);
		// debounce 0 keeps tests synchronous unless we explicitly want to test debouncing
		store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });
	});

	it('exposes empty per-room slots when localStorage has no entry', () => {
		expect(storage.getItem(STORAGE_KEY)).toBeNull();
		expect(store.embeddingGarden).toEqual({});
		expect(store.attentionHall).toEqual({});
		expect(store.mlpForge).toEqual({});
		expect(store.unembeddingTower).toEqual({});
		expect(store.grokkingBell).toEqual({});
		expect(store.fourierWing).toEqual({});
		expect(store.mathAntechamber).toEqual({});
		expect(store.hallOfMemory).toEqual({});
	});

	it('exposes default cursor + flags', () => {
		expect(store.currentRoom).toBeNull();
		expect(store.lastVisited).toBeNull();
		expect(store.mathAntechamberSkipped).toBe(false);
	});
});

describe('gameState — debounced persistence', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not write to storage before the debounce window elapses', () => {
		const storage = makeMemoryStorage();
		const setItem = vi.spyOn(storage, 'setItem');
		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 250 });

		store.setCurrentRoom('embeddingGarden');
		// Just under the window: still no write.
		vi.advanceTimersByTime(249);
		expect(setItem).not.toHaveBeenCalled();
	});

	it('writes once after the debounce window elapses', () => {
		const storage = makeMemoryStorage();
		const setItem = vi.spyOn(storage, 'setItem');
		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 250 });

		store.setEmbeddingGarden({ planted: [true, false, true] });
		vi.advanceTimersByTime(250);

		expect(setItem).toHaveBeenCalledTimes(1);
		const raw = storage.getItem(STORAGE_KEY);
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw as string);
		expect(parsed.embeddingGarden).toEqual({ planted: [true, false, true] });
	});

	it('coalesces rapid mutations into a single write', () => {
		const storage = makeMemoryStorage();
		const setItem = vi.spyOn(storage, 'setItem');
		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 250 });

		store.setCurrentRoom('embeddingGarden');
		vi.advanceTimersByTime(100);
		store.setCurrentRoom('attentionHall');
		vi.advanceTimersByTime(100);
		store.setCurrentRoom('mlpForge');
		// Only after a full quiet period does it flush.
		vi.advanceTimersByTime(250);

		expect(setItem).toHaveBeenCalledTimes(1);
		const parsed = JSON.parse(storage.getItem(STORAGE_KEY) as string);
		expect(parsed.currentRoom).toBe('mlpForge');
	});
});

describe('gameState — reload', () => {
	it('reads back the mutation after creating a fresh store on the same storage', () => {
		const storage = makeMemoryStorage();

		// Session 1: mutate + flush so we don't depend on debounce timing here.
		const session1 = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });
		session1.setEmbeddingGarden({ planted: [false, true, false], view: 'compare' });
		session1.setCurrentRoom('embeddingGarden');
		session1.setLastVisited(1_700_000_000_000);
		session1.setMathAntechamberSkipped(true);

		// Session 2: simulates page reload.
		const session2 = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });
		expect(session2.embeddingGarden).toEqual({ planted: [false, true, false], view: 'compare' });
		expect(session2.currentRoom).toBe('embeddingGarden');
		expect(session2.lastVisited).toBe(1_700_000_000_000);
		expect(session2.mathAntechamberSkipped).toBe(true);
	});
});

describe('gameState — resetState()', () => {
	it('reverts every slot to defaults and removes the localStorage entry', () => {
		const storage = makeMemoryStorage();
		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });

		store.setEmbeddingGarden({ planted: [true] });
		store.setGrokkingBell({ trainingStep: 9_000, trajectoryId: 'traj-a' });
		store.setCurrentRoom('grokkingBell');
		store.setLastVisited(42);
		store.setMathAntechamberSkipped(true);
		expect(storage.getItem(STORAGE_KEY)).not.toBeNull();

		store.resetState();

		expect(store.embeddingGarden).toEqual({});
		expect(store.grokkingBell).toEqual({});
		expect(store.currentRoom).toBeNull();
		expect(store.lastVisited).toBeNull();
		expect(store.mathAntechamberSkipped).toBe(false);
		expect(storage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('a fresh store created after reset sees defaults (no leakage)', () => {
		const storage = makeMemoryStorage();
		const s1 = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });
		s1.setMlpForge({ ablated: [3, 7, 11] });
		s1.resetState();

		const s2 = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });
		expect(s2.mlpForge).toEqual({});
	});
});

describe('gameState — corruption tolerance', () => {
	it('falls back to defaults when the persisted value is invalid JSON', () => {
		const storage = makeMemoryStorage();
		storage.setItem(STORAGE_KEY, '{not valid json');

		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });

		expect(store.embeddingGarden).toEqual({});
		expect(store.currentRoom).toBeNull();
		expect(store.mathAntechamberSkipped).toBe(false);
	});

	it('falls back to defaults when the persisted value is the wrong shape', () => {
		const storage = makeMemoryStorage();
		// JSON-valid, but not a GameState snapshot.
		storage.setItem(STORAGE_KEY, JSON.stringify(['nope', 'wrong', 'shape']));

		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });

		expect(store.embeddingGarden).toEqual({});
		expect(store.attentionHall).toEqual({});
	});

	it('falls back to defaults when the schema version is unknown', () => {
		const storage = makeMemoryStorage();
		storage.setItem(
			STORAGE_KEY,
			JSON.stringify({ __v: 999, embeddingGarden: { planted: [true, true] } })
		);

		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });

		expect(store.embeddingGarden).toEqual({});
	});
});

describe('gameState — slot independence', () => {
	it('mutating one slot does not clobber others', () => {
		const storage = makeMemoryStorage();
		const store = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });

		store.setEmbeddingGarden({ planted: [true, false, true] });
		store.setAttentionHall({ wired: { Q: 'h0', K: 'h1' } });
		store.setMlpForge({ ablated: [12, 34] });
		store.setGrokkingBell({ trainingStep: 25_000 });

		// Now mutate one — others must be untouched.
		store.setEmbeddingGarden({ view: 'compare' });

		expect(store.embeddingGarden).toEqual({ planted: [true, false, true], view: 'compare' });
		expect(store.attentionHall).toEqual({ wired: { Q: 'h0', K: 'h1' } });
		expect(store.mlpForge).toEqual({ ablated: [12, 34] });
		expect(store.grokkingBell).toEqual({ trainingStep: 25_000 });

		// And it round-trips through reload too.
		const reloaded = createGameState({ storage, storageKey: STORAGE_KEY, debounceMs: 0 });
		expect(reloaded.embeddingGarden).toEqual({ planted: [true, false, true], view: 'compare' });
		expect(reloaded.attentionHall).toEqual({ wired: { Q: 'h0', K: 'h1' } });
		expect(reloaded.mlpForge).toEqual({ ablated: [12, 34] });
		expect(reloaded.grokkingBell).toEqual({ trainingStep: 25_000 });
	});
});
