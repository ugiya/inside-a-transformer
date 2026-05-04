/**
 * Reactive game state for Transformer Rooms.
 *
 * Backed by localStorage with a debounced auto-save. Per-room slots are
 * independently typed; rooms whose internal shape isn't yet pinned down
 * use `Record<string, unknown>` as a placeholder. The store is created
 * via `createGameState(...)` (factory) and a default singleton is exported
 * as `gameState` for app-level use. Tests build their own instances so
 * each test gets isolated storage.
 */

// ---------- Per-room slot types ----------

/**
 * Embedding Garden: 113 vessels arranged in a ring; each can be planted.
 * `view` and `checkpoint` mirror the existing garden.svelte.ts factory so
 * that wiring this store into the room (future slice) is a straight copy.
 */
export type EmbeddingGardenState = {
	planted?: boolean[];
	view?: 'ring' | 'compare';
	checkpoint?: 'pre-grok' | 'post-grok';
};

/**
 * Attention Hall: player wires Q/K/V projections and inspects attention
 * patterns. Internal shape TBD; placeholder is permissive.
 */
export type AttentionHallState = Record<string, unknown>;

/** MLP Forge: ablate neurons, observe effect on logits. */
export type MlpForgeState = Record<string, unknown>;

/** Unembedding Tower: thin v1 scene, single slider. */
export type UnembeddingTowerState = Record<string, unknown>;

/**
 * Grokking Bell: scrubs the training-step slider through one of the three
 * pre-recorded trajectories.
 */
export type GrokkingBellState = {
	trainingStep?: number;
	trajectoryId?: string;
};

/** Fourier Wing: mechinterp finale; placeholder shape. */
export type FourierWingState = Record<string, unknown>;

/** Math Antechamber: optional math primer; can be skipped. */
export type MathAntechamberState = Record<string, unknown>;

/** Hall of Memory: RNN/LSTM prologue, thin scene. */
export type HallOfMemoryState = Record<string, unknown>;

export type RoomKey =
	| 'embeddingGarden'
	| 'attentionHall'
	| 'mlpForge'
	| 'unembeddingTower'
	| 'grokkingBell'
	| 'fourierWing'
	| 'mathAntechamber'
	| 'hallOfMemory';

/** Plain JSON-shaped snapshot, what we serialize to localStorage. */
export type GameStateSnapshot = {
	embeddingGarden: EmbeddingGardenState;
	attentionHall: AttentionHallState;
	mlpForge: MlpForgeState;
	unembeddingTower: UnembeddingTowerState;
	grokkingBell: GrokkingBellState;
	fourierWing: FourierWingState;
	mathAntechamber: MathAntechamberState;
	hallOfMemory: HallOfMemoryState;
	currentRoom: RoomKey | null;
	lastVisited: number | null;
	mathAntechamberSkipped: boolean;
};

const SCHEMA_VERSION = 1;

type PersistedShape = GameStateSnapshot & { __v: number };

function defaultSnapshot(): GameStateSnapshot {
	return {
		embeddingGarden: {},
		attentionHall: {},
		mlpForge: {},
		unembeddingTower: {},
		grokkingBell: {},
		fourierWing: {},
		mathAntechamber: {},
		hallOfMemory: {},
		currentRoom: null,
		lastVisited: null,
		mathAntechamberSkipped: false
	};
}

// ---------- Public store shape ----------

export type GameStateStore = {
	// per-room slot getters (reactive in Svelte components)
	readonly embeddingGarden: EmbeddingGardenState;
	readonly attentionHall: AttentionHallState;
	readonly mlpForge: MlpForgeState;
	readonly unembeddingTower: UnembeddingTowerState;
	readonly grokkingBell: GrokkingBellState;
	readonly fourierWing: FourierWingState;
	readonly mathAntechamber: MathAntechamberState;
	readonly hallOfMemory: HallOfMemoryState;

	readonly currentRoom: RoomKey | null;
	readonly lastVisited: number | null;
	readonly mathAntechamberSkipped: boolean;

	// mutators — keep slot writes typed; replacement style avoids deep proxy issues
	setEmbeddingGarden(patch: EmbeddingGardenState): void;
	setAttentionHall(patch: AttentionHallState): void;
	setMlpForge(patch: MlpForgeState): void;
	setUnembeddingTower(patch: UnembeddingTowerState): void;
	setGrokkingBell(patch: GrokkingBellState): void;
	setFourierWing(patch: FourierWingState): void;
	setMathAntechamber(patch: MathAntechamberState): void;
	setHallOfMemory(patch: HallOfMemoryState): void;

	setCurrentRoom(room: RoomKey | null): void;
	setLastVisited(ts: number | null): void;
	setMathAntechamberSkipped(skipped: boolean): void;

	resetState(): void;
	/** Force-flush any pending debounced save. Useful in tests + on unload. */
	flush(): void;
	/** Internal: full snapshot, mostly for debugging/tests. */
	snapshot(): GameStateSnapshot;
};

export type CreateGameStateOptions = {
	storage?: Storage | null;
	storageKey?: string;
	/** ms; 0 = synchronous save (handy for tests). */
	debounceMs?: number;
};

const DEFAULT_STORAGE_KEY = 'transformer-rooms:gameState:v1';
const DEFAULT_DEBOUNCE_MS = 250;

function tryGetDefaultStorage(): Storage | null {
	try {
		// SSR / Node-without-jsdom: no window/localStorage.
		if (typeof globalThis === 'undefined') return null;
		const ls = (globalThis as { localStorage?: Storage }).localStorage;
		return ls ?? null;
	} catch {
		return null;
	}
}

function loadSnapshot(storage: Storage | null, key: string): GameStateSnapshot {
	if (!storage) return defaultSnapshot();
	let raw: string | null = null;
	try {
		raw = storage.getItem(key);
	} catch {
		// Storage access can throw (e.g. disabled cookies, quota); fall back.
		return defaultSnapshot();
	}
	if (raw === null) return defaultSnapshot();
	try {
		const parsed = JSON.parse(raw) as Partial<PersistedShape> | null;
		if (!parsed || typeof parsed !== 'object') return defaultSnapshot();
		// Schema-version mismatch ⇒ defaults. Real migrations are a future slice.
		if (parsed.__v !== SCHEMA_VERSION) return defaultSnapshot();
		const d = defaultSnapshot();
		return {
			embeddingGarden: (parsed.embeddingGarden ?? d.embeddingGarden) as EmbeddingGardenState,
			attentionHall: (parsed.attentionHall ?? d.attentionHall) as AttentionHallState,
			mlpForge: (parsed.mlpForge ?? d.mlpForge) as MlpForgeState,
			unembeddingTower: (parsed.unembeddingTower ?? d.unembeddingTower) as UnembeddingTowerState,
			grokkingBell: (parsed.grokkingBell ?? d.grokkingBell) as GrokkingBellState,
			fourierWing: (parsed.fourierWing ?? d.fourierWing) as FourierWingState,
			mathAntechamber: (parsed.mathAntechamber ?? d.mathAntechamber) as MathAntechamberState,
			hallOfMemory: (parsed.hallOfMemory ?? d.hallOfMemory) as HallOfMemoryState,
			currentRoom: (parsed.currentRoom ?? null) as RoomKey | null,
			lastVisited: typeof parsed.lastVisited === 'number' ? parsed.lastVisited : null,
			mathAntechamberSkipped: parsed.mathAntechamberSkipped === true
		};
	} catch {
		// Corrupted JSON: don't crash the app, just start fresh.
		return defaultSnapshot();
	}
}

export function createGameState(options: CreateGameStateOptions = {}): GameStateStore {
	const storage = options.storage === undefined ? tryGetDefaultStorage() : options.storage;
	const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
	const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

	const initial = loadSnapshot(storage, storageKey);

	// Each slot is its own $state so reactivity is fine-grained.
	let embeddingGarden: EmbeddingGardenState = $state(initial.embeddingGarden);
	let attentionHall: AttentionHallState = $state(initial.attentionHall);
	let mlpForge: MlpForgeState = $state(initial.mlpForge);
	let unembeddingTower: UnembeddingTowerState = $state(initial.unembeddingTower);
	let grokkingBell: GrokkingBellState = $state(initial.grokkingBell);
	let fourierWing: FourierWingState = $state(initial.fourierWing);
	let mathAntechamber: MathAntechamberState = $state(initial.mathAntechamber);
	let hallOfMemory: HallOfMemoryState = $state(initial.hallOfMemory);

	let currentRoom: RoomKey | null = $state(initial.currentRoom);
	let lastVisited: number | null = $state(initial.lastVisited);
	let mathAntechamberSkipped: boolean = $state(initial.mathAntechamberSkipped);

	let pendingTimer: ReturnType<typeof setTimeout> | null = null;

	function snapshot(): GameStateSnapshot {
		return {
			embeddingGarden,
			attentionHall,
			mlpForge,
			unembeddingTower,
			grokkingBell,
			fourierWing,
			mathAntechamber,
			hallOfMemory,
			currentRoom,
			lastVisited,
			mathAntechamberSkipped
		};
	}

	function persistNow(): void {
		if (!storage) return;
		const payload: PersistedShape = { __v: SCHEMA_VERSION, ...snapshot() };
		try {
			storage.setItem(storageKey, JSON.stringify(payload));
		} catch {
			// Quota exceeded / disabled — silently drop. State stays in memory.
		}
	}

	function schedulePersist(): void {
		if (!storage) return;
		if (debounceMs <= 0) {
			persistNow();
			return;
		}
		if (pendingTimer !== null) clearTimeout(pendingTimer);
		pendingTimer = setTimeout(() => {
			pendingTimer = null;
			persistNow();
		}, debounceMs);
	}

	function flush(): void {
		if (pendingTimer !== null) {
			clearTimeout(pendingTimer);
			pendingTimer = null;
			persistNow();
		}
	}

	function resetState(): void {
		const d = defaultSnapshot();
		embeddingGarden = d.embeddingGarden;
		attentionHall = d.attentionHall;
		mlpForge = d.mlpForge;
		unembeddingTower = d.unembeddingTower;
		grokkingBell = d.grokkingBell;
		fourierWing = d.fourierWing;
		mathAntechamber = d.mathAntechamber;
		hallOfMemory = d.hallOfMemory;
		currentRoom = d.currentRoom;
		lastVisited = d.lastVisited;
		mathAntechamberSkipped = d.mathAntechamberSkipped;
		if (pendingTimer !== null) {
			clearTimeout(pendingTimer);
			pendingTimer = null;
		}
		if (storage) {
			try {
				storage.removeItem(storageKey);
			} catch {
				// ignore
			}
		}
	}

	return {
		get embeddingGarden() {
			return embeddingGarden;
		},
		get attentionHall() {
			return attentionHall;
		},
		get mlpForge() {
			return mlpForge;
		},
		get unembeddingTower() {
			return unembeddingTower;
		},
		get grokkingBell() {
			return grokkingBell;
		},
		get fourierWing() {
			return fourierWing;
		},
		get mathAntechamber() {
			return mathAntechamber;
		},
		get hallOfMemory() {
			return hallOfMemory;
		},
		get currentRoom() {
			return currentRoom;
		},
		get lastVisited() {
			return lastVisited;
		},
		get mathAntechamberSkipped() {
			return mathAntechamberSkipped;
		},

		setEmbeddingGarden(patch) {
			embeddingGarden = { ...embeddingGarden, ...patch };
			schedulePersist();
		},
		setAttentionHall(patch) {
			attentionHall = { ...attentionHall, ...patch };
			schedulePersist();
		},
		setMlpForge(patch) {
			mlpForge = { ...mlpForge, ...patch };
			schedulePersist();
		},
		setUnembeddingTower(patch) {
			unembeddingTower = { ...unembeddingTower, ...patch };
			schedulePersist();
		},
		setGrokkingBell(patch) {
			grokkingBell = { ...grokkingBell, ...patch };
			schedulePersist();
		},
		setFourierWing(patch) {
			fourierWing = { ...fourierWing, ...patch };
			schedulePersist();
		},
		setMathAntechamber(patch) {
			mathAntechamber = { ...mathAntechamber, ...patch };
			schedulePersist();
		},
		setHallOfMemory(patch) {
			hallOfMemory = { ...hallOfMemory, ...patch };
			schedulePersist();
		},

		setCurrentRoom(room) {
			currentRoom = room;
			schedulePersist();
		},
		setLastVisited(ts) {
			lastVisited = ts;
			schedulePersist();
		},
		setMathAntechamberSkipped(skipped) {
			mathAntechamberSkipped = skipped;
			schedulePersist();
		},

		resetState,
		flush,
		snapshot
	};
}

/** App-level singleton. Tests should prefer `createGameState(...)` directly. */
export const gameState: GameStateStore = createGameState();
