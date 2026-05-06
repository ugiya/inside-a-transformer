<script lang="ts">
	import { forward, probe } from '$lib/api';
	import ActivationPanel from '$lib/ActivationPanel.svelte';

	const TOKENS = [5, 17, 113];
	const ANSWER = 22;
	const POST_KEY = 'blocks.0.mlp.hook_post';
	const N_VISIBLE = 64;
	const PROBE_DEBOUNCE_MS = 150;

	type Part = 'linear1' | 'relu' | 'linear2';
	let connected = $state<Record<Part, boolean>>({ linear1: false, relu: false, linear2: false });
	const allWired = $derived(connected.linear1 && connected.relu && connected.linear2);

	let activations = $state<number[] | null>(null); // first N_VISIBLE
	let baselineLogits = $state<number[] | null>(null);
	let ablatedIndex = $state<number | null>(null);
	let ablatedCE = $state<number | null>(null);
	let probeTimer: ReturnType<typeof setTimeout> | null = null;
	let error = $state<string | null>(null);

	async function loadActivations() {
		error = null;
		try {
			const res = await forward(TOKENS, [POST_KEY]);
			const post = res.cached as Record<string, number[][]>;
			const final = post[POST_KEY][2]; // n_ctx=3, take the final position
			activations = final.slice(0, N_VISIBLE);
			baselineLogits = res.logits.slice(0, 113);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function crossEntropy(logits: number[], target: number): number {
		const m = Math.max(...logits);
		let sumExp = 0;
		for (const l of logits) sumExp += Math.exp(l - m);
		const lse = m + Math.log(sumExp);
		return lse - logits[target];
	}

	const baselineCE = $derived(baselineLogits ? crossEntropy(baselineLogits, ANSWER) : null);

	function ablate(neuron: number) {
		ablatedIndex = neuron;
		if (probeTimer) clearTimeout(probeTimer);
		probeTimer = setTimeout(async () => {
			try {
				const res = await probe(TOKENS, { kind: 'zero_neuron', layer: 0, neuron }, []);
				ablatedCE = crossEntropy(res.logits.slice(0, 113), ANSWER);
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
			}
		}, PROBE_DEBOUNCE_MS);
	}

	$effect(() => {
		if (allWired && !activations) loadActivations();
	});
</script>

<main>
	<a class="back" href="/">← rooms</a>
	<h1>🔥 MLP Forge</h1>
	<p class="prose">
		Where computation happens after attention. Forge the per-position MLP — two linear layers
		with a ReLU between them — then watch which neurons fire on
		<code>(5, 17, =)</code>. Click a neuron to ablate it; the cross-entropy climb tells you
		whether it mattered.
	</p>

	<section class="lab">
		<div class="panel">
			<h2>Forge the MLP</h2>
			<div class="parts">
				{#each [
					{ key: 'linear1', label: 'Linear ↑', sub: 'd_model → d_mlp' },
					{ key: 'relu', label: 'ReLU', sub: 'non-linearity' },
					{ key: 'linear2', label: 'Linear ↓', sub: 'd_mlp → d_model' }
				] as part (part.key)}
					<button
						class="part"
						class:on={connected[part.key as Part]}
						onclick={() =>
							(connected[part.key as Part] = !connected[part.key as Part])}
					>
						<span class="glyph">{part.label}</span>
						<span class="sub">{part.sub}</span>
					</button>
				{/each}
			</div>
			{#if !allWired}
				<p class="hint">Connect all three to bring the MLP online.</p>
			{/if}
		</div>

		{#if activations}
			<div class="panel">
				<h2>Activations on (5, 17, =) — first {N_VISIBLE} of 512 neurons</h2>
				<ActivationPanel
					values={activations}
					{ablatedIndex}
					onAblate={ablate}
				/>
				<p class="hint">Click any bar to ablate that neuron and see the loss-climb below.</p>
			</div>

			<div class="panel">
				<h2>Loss climb</h2>
				<dl>
					<dt>baseline cross-entropy (predicting {ANSWER})</dt>
					<dd>
						<code data-baseline-ce>{baselineCE!.toFixed(4)}</code>
					</dd>
					{#if ablatedIndex !== null && ablatedCE !== null}
						<dt>after ablating neuron {ablatedIndex}</dt>
						<dd>
							<code
								class:right={ablatedCE <= baselineCE!}
								class:wrong={ablatedCE > baselineCE!}
								data-ablated-ce
							>
								{ablatedCE.toFixed(4)}
							</code>
							<span class="delta">
								{ablatedCE > baselineCE!
									? `(climbed by ${(ablatedCE - baselineCE!).toFixed(4)})`
									: '(no change)'}
							</span>
						</dd>
					{/if}
				</dl>
			</div>
		{/if}

		{#if error}
			<p class="error">Error: {error}. Is the backend running on :8000?</p>
		{/if}
	</section>
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
	.parts {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.part {
		font: inherit;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem 1.5rem;
		background: var(--teal);
		color: var(--ivory);
		border: 1px solid var(--teal);
		cursor: pointer;
		min-width: 9rem;
		transition: all 200ms ease;
	}
	.part .glyph {
		font-size: 1rem;
		color: var(--ivory-muted);
		font-weight: 600;
	}
	.part .sub {
		font-size: 0.75rem;
		color: var(--ivory-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.part.on {
		border-color: var(--brass);
		background: rgba(176, 137, 64, 0.18);
	}
	.part.on .glyph,
	.part.on .sub {
		color: var(--brass-bright);
	}
	.hint {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		font-style: italic;
		margin-top: 1rem;
	}
	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5rem 1rem;
		color: var(--ivory-muted);
	}
	dt {
		font-size: 0.9rem;
	}
	dd {
		margin: 0;
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
	.delta {
		color: var(--ivory-muted);
		font-size: 0.85rem;
	}
	.error {
		color: #d97070;
	}
</style>
