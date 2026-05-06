<script lang="ts">
	import { forward, probe } from '$lib/api';
	import ActivationPanel from '$lib/ActivationPanel.svelte';

	const TOKENS = [5, 17, 113];
	const ANSWER = 22;
	const POST_KEY = 'blocks.0.mlp.hook_post';
	const N_VISIBLE = 64;
	const FOURIER_URL = '/fourier/neuron_coefficients.json';

	type Coefficients = number[]; // length === FREQUENCIES.length
	type NeuronEntry = { idx: number; coefficients: Coefficients };
	type FourierPayload = {
		step: number;
		frequencies: number[];
		neurons: NeuronEntry[];
	};

	let activations = $state<number[] | null>(null);
	let baselineLogits = $state<number[] | null>(null);
	let fourier = $state<FourierPayload | null>(null);
	let selected = $state<Set<number>>(new Set());
	let aggregated = $state<{
		count: number;
		argmaxRight: number;
		meanCEDelta: number;
	} | null>(null);
	let hypothesisResult = $state<{
		neurons: number[];
		meanCEDelta: number;
	} | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);

	function crossEntropy(logits: number[], target: number): number {
		const m = Math.max(...logits);
		let sumExp = 0;
		for (const l of logits) sumExp += Math.exp(l - m);
		const lse = m + Math.log(sumExp);
		return lse - logits[target];
	}

	const baselineCE = $derived(
		baselineLogits ? crossEntropy(baselineLogits, ANSWER) : null
	);

	async function loadActivations() {
		const res = await forward(TOKENS, [POST_KEY]);
		const post = res.cached as Record<string, number[][]>;
		const final = post[POST_KEY][2];
		activations = final.slice(0, N_VISIBLE);
		baselineLogits = res.logits.slice(0, 113);
	}

	async function loadFourier() {
		const r = await fetch(FOURIER_URL);
		if (!r.ok) throw new Error(`fourier load ${r.status}`);
		fourier = (await r.json()) as FourierPayload;
	}

	async function loadAll() {
		error = null;
		try {
			await Promise.all([loadActivations(), loadFourier()]);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function toggle(idx: number) {
		const next = new Set(selected);
		if (next.has(idx)) next.delete(idx);
		else next.add(idx);
		selected = next;
	}

	async function ablateSelection() {
		if (busy || selected.size === 0) return;
		busy = true;
		aggregated = null;
		const indices = [...selected];
		try {
			let argmaxRight = 0;
			let totalDelta = 0;
			for (const neuron of indices) {
				const res = await probe(
					TOKENS,
					{ kind: 'zero_neuron', layer: 0, neuron },
					[]
				);
				const ce = crossEntropy(res.logits.slice(0, 113), ANSWER);
				const argmax = res.logits
					.slice(0, 113)
					.reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0);
				if (argmax === ANSWER) argmaxRight += 1;
				if (baselineCE !== null) totalDelta += ce - baselineCE;
			}
			aggregated = {
				count: indices.length,
				argmaxRight,
				meanCEDelta: indices.length > 0 ? totalDelta / indices.length : 0
			};
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	function topKByFrequency(freqIndex: number, k: number): number[] {
		if (!fourier) return [];
		return [...fourier.neurons]
			.sort(
				(a, b) => b.coefficients[freqIndex] - a.coefficients[freqIndex]
			)
			.slice(0, k)
			.map((n) => n.idx);
	}

	async function testK14Hypothesis() {
		if (busy || !fourier) return;
		const k14Index = fourier.frequencies.indexOf(14);
		if (k14Index < 0) return;
		const top5 = topKByFrequency(k14Index, 5);
		busy = true;
		hypothesisResult = null;
		try {
			let totalDelta = 0;
			for (const neuron of top5) {
				const res = await probe(
					TOKENS,
					{ kind: 'zero_neuron', layer: 0, neuron },
					[]
				);
				const ce = crossEntropy(res.logits.slice(0, 113), ANSWER);
				if (baselineCE !== null) totalDelta += ce - baselineCE;
			}
			hypothesisResult = {
				neurons: top5,
				meanCEDelta: top5.length > 0 ? totalDelta / top5.length : 0
			};
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	// Per-frequency top-5 highlight set, computed once fourier loads.
	const top5PerFreq = $derived.by(() => {
		if (!fourier) return [] as Set<number>[];
		return fourier.frequencies.map((_, fi) =>
			new Set(topKByFrequency(fi, 5))
		);
	});

	// Coefficient column scale (max per frequency) for bar widths.
	const maxPerFreq = $derived.by(() => {
		if (!fourier) return [] as number[];
		return fourier.frequencies.map((_, fi) =>
			fourier!.neurons.reduce(
				(m, n) => Math.max(m, n.coefficients[fi]),
				1e-9
			)
		);
	});

	$effect(() => {
		if (!activations && !fourier) loadAll();
	});
</script>

<main>
	<a class="back" href="/">← rooms</a>
	<h1>📡 Fourier Wing — MLP Forge</h1>
	<p class="prose">
		Re-enter the MLP Forge with a circuit-identification toolkit. Each MLP neuron has a
		projection onto the canonical Nanda frequencies <code>k ∈ {'{14, 35, 41, 42, 52}'}</code>.
		Pick neurons by hand or by hypothesis, ablate them, and watch the loss climb.
	</p>

	{#if activations}
		<section class="lab">
			<div class="panel">
				<h2>Activations on (5, 17, =) — first {N_VISIBLE} of 512 neurons</h2>
				<ActivationPanel values={activations} />
				<p class="hint">
					This is the neuron firing pattern at the <code>=</code> position. The Fourier view
					below tells you <em>why</em> they fire.
				</p>
			</div>

			<div class="panel">
				<h2>Multi-neuron ablation</h2>
				<p class="hint">
					Tick the boxes for neurons you want to silence, then ablate the whole set. The
					backend runs one <code>/probe</code> per neuron sequentially — fine for prototype
					scale.
				</p>
				<div class="checkbox-grid" role="group" aria-label="neuron selection">
					{#each Array.from({ length: N_VISIBLE }, (_, i) => i) as i (i)}
						<label class="cb">
							<input
								type="checkbox"
								data-neuron={i}
								checked={selected.has(i)}
								onchange={() => toggle(i)}
							/>
							<span>{i}</span>
						</label>
					{/each}
				</div>
				<div class="actions">
					<button
						type="button"
						data-action="ablate-selection"
						disabled={busy || selected.size === 0}
						onclick={ablateSelection}
					>
						Ablate selection ({selected.size})
					</button>
					{#if aggregated}
						<dl class="results">
							<dt>neurons ablated</dt>
							<dd>{aggregated.count}</dd>
							<dt>argmax = {ANSWER}</dt>
							<dd>{aggregated.argmaxRight}/{aggregated.count} runs</dd>
							<dt>mean Δ cross-entropy</dt>
							<dd>
								<code class:wrong={aggregated.meanCEDelta > 0}>
									{aggregated.meanCEDelta >= 0 ? '+' : ''}{aggregated.meanCEDelta.toFixed(4)}
								</code>
							</dd>
						</dl>
					{/if}
				</div>
			</div>

			{#if fourier}
				<div class="panel" data-fourier-view>
					<h2>Per-neuron Fourier coefficients</h2>
					<p class="hint">
						Each column is one canonical frequency. Bars show the magnitude of every
						neuron's projection (computed from <code>W_in</code> and <code>W_E</code>). The
						top-5 neurons per frequency are highlighted — those are your circuit
						candidates.
					</p>
					<div class="fourier-grid">
						{#each fourier.frequencies as k, fi (k)}
							<div class="freq-col" data-freq={k}>
								<div class="freq-header">k = {k}</div>
								<div class="freq-bars">
									{#each fourier.neurons as n (n.idx)}
										<div
											class="freq-bar"
											class:top5={top5PerFreq[fi]?.has(n.idx)}
											style:width="{(n.coefficients[fi] / maxPerFreq[fi]) * 100}%"
											title="neuron {n.idx}: {n.coefficients[fi].toFixed(3)}"
										></div>
									{/each}
								</div>
								<div class="freq-footer">
									top-5: {[...(top5PerFreq[fi] ?? [])].join(', ')}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="panel">
					<h2>Discovery challenge</h2>
					<p class="hint">
						Hypothesis: "the top-5 neurons by k=14 coefficient form (part of) the k=14
						circuit." Ablate them all on <code>(5, 17, =)</code> and see if the mean
						cross-entropy climbs.
					</p>
					<div class="actions">
						<button
							type="button"
							data-action="test-k14"
							disabled={busy}
							onclick={testK14Hypothesis}
						>
							Test the k=14 hypothesis
						</button>
						{#if hypothesisResult}
							<dl class="results">
								<dt>ablated</dt>
								<dd>
									<code>[{hypothesisResult.neurons.join(', ')}]</code>
								</dd>
								<dt>mean Δ cross-entropy</dt>
								<dd>
									<code
										class:wrong={hypothesisResult.meanCEDelta > 0}
										class:right={hypothesisResult.meanCEDelta <= 0}
									>
										{hypothesisResult.meanCEDelta >= 0 ? '+' : ''}{hypothesisResult.meanCEDelta.toFixed(4)}
									</code>
								</dd>
							</dl>
						{/if}
					</div>
				</div>
			{/if}

			{#if baselineCE !== null}
				<div class="panel">
					<h2>Baseline</h2>
					<dl>
						<dt>baseline cross-entropy on {ANSWER}</dt>
						<dd>
							<code data-baseline-ce>{baselineCE.toFixed(4)}</code>
						</dd>
					</dl>
				</div>
			{/if}
		</section>
	{:else if !error}
		<p class="hint">Loading the forge…</p>
	{/if}

	{#if error}
		<p class="error">Error: {error}. Is the backend on :8000? Did you run
			<code>export_neuron_fourier.py</code>?
		</p>
	{/if}
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	h1 {
		font-size: 1.8rem;
		color: var(--ivory);
	}
	.prose {
		color: var(--ivory-muted);
		max-width: 60ch;
		line-height: 1.5;
	}
	.lab {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}
	.panel {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.5rem;
	}
	.panel h2 {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
	}
	.hint {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		font-style: italic;
		margin: 0.6rem 0;
	}
	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(16, 1fr);
		gap: 4px 6px;
		margin: 1rem 0;
	}
	.cb {
		display: flex;
		align-items: center;
		gap: 4px;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.7rem;
		color: var(--ivory-muted);
		cursor: pointer;
	}
	.cb input {
		accent-color: var(--brass);
	}
	.actions {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}
	button[data-action] {
		font: inherit;
		background: var(--teal);
		color: var(--ivory);
		border: 1px solid var(--brass);
		padding: 0.6rem 1.2rem;
		cursor: pointer;
		letter-spacing: 0.05em;
		transition: all 200ms ease;
	}
	button[data-action]:hover:not(:disabled) {
		background: rgba(176, 137, 64, 0.2);
		color: var(--brass-bright);
	}
	button[data-action]:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.results {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.4rem 1rem;
		color: var(--ivory-muted);
		font-size: 0.9rem;
		margin: 0;
	}
	.results dt {
		font-size: 0.85rem;
	}
	.results dd {
		margin: 0;
	}
	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5rem 1rem;
		color: var(--ivory-muted);
	}
	code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.1em 0.4em;
		color: var(--brass-bright);
	}
	code.wrong {
		color: #d97070;
	}
	code.right {
		color: var(--brass-bright);
	}
	.fourier-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
	}
	.freq-col {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 0;
	}
	.freq-header {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		font-size: 0.9rem;
		text-align: center;
	}
	.freq-bars {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: rgba(13, 21, 24, 0.4);
		padding: 4px;
		max-height: 380px;
		overflow-y: auto;
	}
	.freq-bar {
		height: 2px;
		background: var(--brass);
		min-width: 1px;
	}
	.freq-bar.top5 {
		background: var(--ivory);
		height: 4px;
	}
	.freq-footer {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--ivory-muted);
		font-size: 0.7rem;
		text-align: center;
		min-height: 1.4em;
	}
	.error {
		color: #d97070;
	}
</style>
