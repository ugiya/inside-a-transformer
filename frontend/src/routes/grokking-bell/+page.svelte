<script lang="ts">
	import { forward, ApiError } from '$lib/api';

	type Trajectory = {
		id: string;
		label: string;
		steps: number[];
		train_loss: number[];
		train_acc: number[];
		test_loss: number[];
		test_acc: number[];
	};

	const TRAJECTORY_IDS = ['default-grok', 'fast-grok', 'never-grok'] as const;
	type TrajectoryId = (typeof TRAJECTORY_IDS)[number];

	const TRAJECTORY_BUTTONS: { id: TrajectoryId; label: string }[] = [
		{ id: 'default-grok', label: 'Default grok' },
		{ id: 'fast-grok', label: 'Fast grok' },
		{ id: 'never-grok', label: 'Never grok' }
	];

	const P = 113;
	const EQUALS = P;
	const SAMPLE_A = 5;
	const SAMPLE_B = 17;
	const SAMPLE_EXPECTED = (SAMPLE_A + SAMPLE_B) % P; // 22
	const DEBOUNCE_MS = 150;

	const W = 720;
	const H = 220;
	const PAD_L = 50;
	const PAD_R = 16;
	const PAD_T = 16;
	const PAD_B = 30;

	let selectedId = $state<TrajectoryId>('default-grok');
	let trajectory = $state<Trajectory | null>(null);
	let scrubIndex = $state(0);
	let loadError = $state<string | null>(null);
	let modelArgmax = $state<number | null>(null);
	let modelProb = $state<number | null>(null);
	let modelError = $state<string | null>(null);
	let lastFiredStep = $state<number | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	async function loadTrajectory(id: TrajectoryId) {
		loadError = null;
		try {
			const res = await fetch(`/trajectories/${id}.json`);
			if (!res.ok) throw new Error(`failed to load ${id}: ${res.status}`);
			const data = (await res.json()) as Trajectory;
			trajectory = data;
			// Default scrub to the last step (the most "settled" view).
			scrubIndex = Math.max(0, data.steps.length - 1);
		} catch (e) {
			loadError = e instanceof Error ? e.message : String(e);
			trajectory = null;
		}
	}

	$effect(() => {
		void loadTrajectory(selectedId);
	});

	function selectTrajectory(id: TrajectoryId) {
		selectedId = id;
	}

	function onScrub(e: Event) {
		const target = e.target as HTMLInputElement;
		scrubIndex = Number(target.value);
		if (debounceTimer !== null) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			void fireCheckpointAndForward();
		}, DEBOUNCE_MS);
	}

	async function fireCheckpointAndForward() {
		if (!trajectory) return;
		const step = trajectory.steps[scrubIndex];
		if (step === undefined) return;
		// Snap to the closest available checkpoint on disk (every 1000, plus 39999).
		const snapped = snapToCheckpoint(step);
		lastFiredStep = snapped;
		modelError = null;
		modelArgmax = null;
		modelProb = null;
		try {
			const r = await fetch(`/checkpoint/${snapped}`);
			if (!r.ok) throw new ApiError(`/checkpoint returned ${r.status}`, r.status);
			const fw = await forward([SAMPLE_A, SAMPLE_B, EQUALS], []);
			const slice = fw.logits.slice(0, P);
			let best = 0;
			for (let i = 1; i < slice.length; i++) if (slice[i] > slice[best]) best = i;
			modelArgmax = best;
			// Softmax probability of the *correct* answer.
			const m = Math.max(...slice);
			const exps = slice.map((v) => Math.exp(v - m));
			const Z = exps.reduce((a, b) => a + b, 0);
			modelProb = exps[SAMPLE_EXPECTED] / Z;
		} catch (e) {
			modelError = e instanceof ApiError ? e.message : String(e);
		}
	}

	function snapToCheckpoint(step: number): number {
		// Backend has step_00000..step_39000 every 1000, plus step_39999.
		if (step >= 39500) return 39999;
		return Math.round(step / 1000) * 1000;
	}

	// ---- Plot derivations ----
	const trainLossLog = $derived(
		trajectory ? trajectory.train_loss.map((v) => Math.log10(Math.max(v, 1e-9))) : []
	);
	const testLossLog = $derived(
		trajectory ? trajectory.test_loss.map((v) => Math.log10(Math.max(v, 1e-9))) : []
	);

	function bounds(values: number[]): { min: number; max: number } {
		if (values.length === 0) return { min: 0, max: 1 };
		let mn = values[0];
		let mx = values[0];
		for (const v of values) {
			if (v < mn) mn = v;
			if (v > mx) mx = v;
		}
		if (mx === mn) mx = mn + 1;
		return { min: mn, max: mx };
	}

	const lossBounds = $derived(bounds([...trainLossLog, ...testLossLog]));

	function path(values: number[], yMin: number, yMax: number, n: number): string {
		if (values.length === 0 || n <= 1) return '';
		const innerW = W - PAD_L - PAD_R;
		const innerH = H - PAD_T - PAD_B;
		let d = '';
		for (let i = 0; i < values.length; i++) {
			const x = PAD_L + (i / (n - 1)) * innerW;
			const y = PAD_T + innerH - ((values[i] - yMin) / (yMax - yMin)) * innerH;
			d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
		}
		return d;
	}

	const trainLossPath = $derived(
		trajectory
			? path(trainLossLog, lossBounds.min, lossBounds.max, trajectory.steps.length)
			: ''
	);
	const testLossPath = $derived(
		trajectory ? path(testLossLog, lossBounds.min, lossBounds.max, trajectory.steps.length) : ''
	);
	const trainAccPath = $derived(
		trajectory ? path(trajectory.train_acc, 0, 1, trajectory.steps.length) : ''
	);
	const testAccPath = $derived(
		trajectory ? path(trajectory.test_acc, 0, 1, trajectory.steps.length) : ''
	);

	const scrubX = $derived(() => {
		if (!trajectory || trajectory.steps.length <= 1) return PAD_L;
		const innerW = W - PAD_L - PAD_R;
		return PAD_L + (scrubIndex / (trajectory.steps.length - 1)) * innerW;
	});

	const currentStep = $derived(trajectory ? trajectory.steps[scrubIndex] : 0);
	const currentTrainAcc = $derived(trajectory ? trajectory.train_acc[scrubIndex] : 0);
	const currentTestAcc = $derived(trajectory ? trajectory.test_acc[scrubIndex] : 0);
</script>

<main>
	<header>
		<a class="back" href="/">← rooms</a>
		<h1>🔔 Grokking Bell</h1>
		<p class="prose">
			A network can fit the training set perfectly and still be lost in the world. Then —
			sometime later, often much later — something snaps and it suddenly understands. This
			is grokking. Pick a trajectory, scrub the dial, and watch the model wake up at the moment
			it does.
		</p>
	</header>

	<section class="selector" aria-label="Trajectory selector">
		{#each TRAJECTORY_BUTTONS as t (t.id)}
			<button
				type="button"
				data-trajectory-button
				data-trajectory-id={t.id}
				class:active={selectedId === t.id}
				onclick={() => selectTrajectory(t.id)}
			>
				{t.label}
			</button>
		{/each}
	</section>

	{#if loadError}
		<p class="error">Could not load trajectory: {loadError}</p>
	{:else if !trajectory}
		<p class="prose">Loading trajectory…</p>
	{:else}
		<section class="panel">
			<header class="panel-head">
				<h2>Loss (log scale)</h2>
				<div class="legend">
					<span class="swatch train"></span> train
					<span class="swatch test"></span> test
				</div>
			</header>
			<svg
				viewBox="0 0 {W} {H}"
				class="plot"
				role="img"
				aria-label="Loss over training steps"
				data-trajectory-plot
				data-trajectory={trajectory.id}
				data-axis="loss"
			>
				<rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B} class="frame" />
				<path d={trainLossPath} class="train-line" fill="none" />
				<path d={testLossPath} class="test-line" fill="none" />
				<line
					x1={scrubX()}
					x2={scrubX()}
					y1={PAD_T}
					y2={H - PAD_B}
					class="scrub-line"
				/>
				<text x={PAD_L} y={H - 6} class="ax-label">step {trajectory.steps[0]}</text>
				<text x={W - PAD_R} y={H - 6} class="ax-label end">
					step {trajectory.steps[trajectory.steps.length - 1]}
				</text>
				<text x={6} y={PAD_T + 12} class="ax-label">log10 loss</text>
			</svg>
		</section>

		<section class="panel">
			<header class="panel-head">
				<h2>Accuracy (linear)</h2>
				<div class="legend">
					<span class="swatch train"></span> train
					<span class="swatch test"></span> test
				</div>
			</header>
			<svg
				viewBox="0 0 {W} {H}"
				class="plot"
				role="img"
				aria-label="Accuracy over training steps"
				data-trajectory-plot-acc
				data-trajectory={trajectory.id}
				data-axis="accuracy"
			>
				<rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B} class="frame" />
				<path d={trainAccPath} class="train-line" fill="none" />
				<path d={testAccPath} class="test-line" fill="none" />
				<line
					x1={scrubX()}
					x2={scrubX()}
					y1={PAD_T}
					y2={H - PAD_B}
					class="scrub-line"
				/>
				<text x={6} y={PAD_T + 12} class="ax-label">acc</text>
				<text x={6} y={H - PAD_B} class="ax-label">0</text>
				<text x={6} y={PAD_T + 4} class="ax-label">1</text>
			</svg>
		</section>

		<section class="panel">
			<header class="panel-head">
				<h2>Step scrubber</h2>
				<div class="readout">
					step <code>{currentStep}</code>
					· train acc <code>{currentTrainAcc.toFixed(3)}</code>
					· test acc <code>{currentTestAcc.toFixed(3)}</code>
				</div>
			</header>
			<input
				type="range"
				min="0"
				max={trajectory.steps.length - 1}
				value={scrubIndex}
				step="1"
				oninput={onScrub}
				data-step-scrubber
				aria-label="Training step scrubber"
			/>
			<p class="caption">
				Sample input: <code>(5, 17, =)</code>. Correct answer is
				<code>{SAMPLE_EXPECTED}</code> (modular sum on ℤ/{P}).
			</p>
			{#if modelError}
				<p class="error">Model error: {modelError}. Is the backend on :8000?</p>
			{:else if modelArgmax !== null}
				<p class="readout">
					At step <code>{lastFiredStep}</code>: model predicts
					<code class:right={modelArgmax === SAMPLE_EXPECTED}
						class:wrong={modelArgmax !== SAMPLE_EXPECTED}>{modelArgmax}</code>
					· softmax(correct=<code>{SAMPLE_EXPECTED}</code>) =
					<code>{modelProb !== null ? modelProb.toFixed(4) : '—'}</code>
				</p>
			{:else}
				<p class="caption">Drag the scrubber to query the model at that checkpoint.</p>
			{/if}
		</section>
	{/if}
</main>

<style>
	main {
		max-width: 920px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	header h1 {
		font-size: 2rem;
		margin: 0.5rem 0;
		color: var(--ivory);
	}
	.prose {
		max-width: 60ch;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.selector {
		display: flex;
		gap: 0.5rem;
		margin: 1.5rem 0 1rem;
		flex-wrap: wrap;
	}
	.selector button {
		font: inherit;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--teal);
		color: var(--ivory);
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	.selector button.active {
		border-color: var(--brass);
		color: var(--brass-bright);
		background: rgba(176, 137, 64, 0.12);
	}
	.panel {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1rem 1.25rem;
		margin-bottom: 1.25rem;
	}
	.panel-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.panel h2 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
	}
	.legend {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	.swatch {
		display: inline-block;
		width: 12px;
		height: 2px;
		vertical-align: middle;
	}
	.swatch.train {
		background: var(--brass-bright);
	}
	.swatch.test {
		background: #6fb3c2;
	}
	.plot {
		width: 100%;
		height: auto;
		display: block;
	}
	.frame {
		fill: none;
		stroke: var(--teal);
		stroke-width: 0.5;
	}
	.train-line {
		stroke: var(--brass-bright);
		stroke-width: 1.4;
	}
	.test-line {
		stroke: #6fb3c2;
		stroke-width: 1.4;
	}
	.scrub-line {
		stroke: var(--ivory);
		stroke-width: 1;
		stroke-dasharray: 3 3;
		opacity: 0.7;
	}
	.ax-label {
		fill: var(--ivory-muted);
		font-size: 10px;
		font-family: 'SF Mono', Menlo, monospace;
	}
	.ax-label.end {
		text-anchor: end;
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--brass-bright);
	}
	.readout {
		color: var(--ivory-muted);
		font-size: 0.9rem;
	}
	.caption {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		margin: 0.5rem 0;
	}
	.error {
		color: #d97070;
	}
	.right {
		color: var(--brass-bright);
	}
	.wrong {
		color: #d97070;
	}
	code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.1em 0.4em;
	}
</style>
