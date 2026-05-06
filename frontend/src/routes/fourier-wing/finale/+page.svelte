<script lang="ts">
	import { CIRCUITS, topNeuronsForFrequency } from '$lib/fourier-finale';
	import { probe, forward } from '$lib/api';
	import type { NeuronCoefficients } from './+page';

	const TOKENS = [5, 17, 113];
	const ANSWER = 22;

	let { data } = $props<{ data: { coefficients: NeuronCoefficients } }>();

	const enrichedCircuits = $derived(
		CIRCUITS.map((c, i) => ({
			...c,
			topNeurons: topNeuronsForFrequency(data.coefficients.neurons, i, 5)
		}))
	);

	let revealed = $state<number[]>([]);
	let verifying = $state(false);
	let baselineCE = $state<number | null>(null);
	let ablatedCE = $state<number | null>(null);
	let verifyError = $state<string | null>(null);

	$effect(() => {
		// Stagger reveal of circuits.
		for (let i = 0; i < CIRCUITS.length; i++) {
			setTimeout(() => {
				revealed = [...revealed, i];
			}, 800 * (i + 1));
		}
	});

	function crossEntropy(logits: number[], target: number): number {
		const m = Math.max(...logits);
		let sumExp = 0;
		for (const l of logits) sumExp += Math.exp(l - m);
		return m + Math.log(sumExp) - logits[target];
	}

	async function verifyK42Hypothesis() {
		verifying = true;
		verifyError = null;
		baselineCE = null;
		ablatedCE = null;
		try {
			const baseline = await forward(TOKENS, []);
			baselineCE = crossEntropy(baseline.logits.slice(0, 113), ANSWER);

			const k42Idx = 3; // k=42 is the 4th canonical frequency
			const top5 = topNeuronsForFrequency(data.coefficients.neurons, k42Idx, 5);
			let lastLogits = baseline.logits;
			for (const { idx } of top5) {
				const r = await probe(TOKENS, { kind: 'zero_neuron', layer: 0, neuron: idx }, []);
				lastLogits = r.logits;
			}
			ablatedCE = crossEntropy(lastLogits.slice(0, 113), ANSWER);
		} catch (e) {
			verifyError = e instanceof Error ? e.message : String(e);
		} finally {
			verifying = false;
		}
	}
</script>

<main>
	<a class="back" href="/fourier-wing">← Fourier Wing</a>
	<h1>🌀 The Five Circuits</h1>
	<p class="prose">
		The model never solved <code>(a + b) mod 113</code> as arithmetic. It solved it as
		<em>five overlapping rotations on a ring</em> — each tuned to a specific frequency.
		The motifs in the wallpaper, the wheels, the beams, the tilework — they were always
		showing you these circuits. Here they are, named.
	</p>

	<ol class="circuits">
		{#each enrichedCircuits as c, i (c.k)}
			{#if revealed.includes(i)}
				<li
					class="circuit fade-in"
					data-circuit-k={c.k}
				>
					<header>
						<span class="k">k = {c.k}</span>
						<span class="formula"><code>{c.formula}</code></span>
					</header>
					<div class="motif">
						from <strong>{c.roomOfOrigin}</strong> · <em>{c.motif}</em>
					</div>
					<p class="caption">{c.caption}</p>
					<div class="neurons">
						<span class="neurons-label">top-5 neurons</span>
						{#each c.topNeurons as n (n.idx)}
							<code class="neuron" title="coefficient {n.coefficient.toFixed(3)}"
								>n{n.idx}</code
							>
						{/each}
					</div>
				</li>
			{/if}
		{/each}
	</ol>

	<section class="verify">
		<h2>Verify the k=42 hypothesis</h2>
		<p class="prose-narrow">
			k=42 is the dominant frequency. If the circuit story is right, ablating its top-5
			neurons on input <code>(5, 17, =)</code> should make the model significantly less
			confident in its prediction of <code>{ANSWER}</code>.
		</p>
		<button
			data-verify-k42
			onclick={verifyK42Hypothesis}
			disabled={verifying}
		>
			{verifying ? 'Probing…' : 'Run the verification'}
		</button>
		{#if baselineCE !== null && ablatedCE !== null}
			<dl class="results">
				<dt>baseline cross-entropy</dt>
				<dd><code>{baselineCE.toFixed(4)}</code></dd>
				<dt>after ablating k=42 top-5 neurons</dt>
				<dd>
					<code class:wrong={ablatedCE > baselineCE}>{ablatedCE.toFixed(4)}</code>
					<span class="delta">
						{ablatedCE > baselineCE
							? `(climbed by ${(ablatedCE - baselineCE).toFixed(4)})`
							: '(no change — circuit story not confirmed)'}
					</span>
				</dd>
			</dl>
		{/if}
		{#if verifyError}
			<p class="error">Error: {verifyError}. Is the backend running on :8000?</p>
		{/if}
	</section>
</main>

<style>
	main {
		max-width: 880px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	h1 {
		font-size: 2rem;
		color: var(--ivory);
		margin: 0.5rem 0;
	}
	.prose,
	.prose-narrow {
		color: var(--ivory-muted);
		max-width: 60ch;
		line-height: 1.5;
	}
	.prose em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.circuits {
		list-style: none;
		padding: 0;
		margin: 2rem 0;
		display: grid;
		gap: 1rem;
	}
	.circuit {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.25rem;
	}
	.fade-in {
		animation: fadeIn 500ms ease forwards;
		opacity: 0;
	}
	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}
	.circuit header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.5rem;
	}
	.k {
		font-size: 1.2rem;
		font-weight: 500;
		color: var(--brass-bright);
		font-family: 'SF Mono', Menlo, monospace;
	}
	.formula code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--ivory-muted);
		font-size: 0.85rem;
	}
	.motif {
		color: var(--ivory-muted);
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}
	.motif strong {
		color: var(--ivory);
	}
	.motif em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.caption {
		color: var(--ivory-muted);
		margin: 0.75rem 0;
		line-height: 1.55;
	}
	.neurons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
		margin-top: 0.5rem;
	}
	.neurons-label {
		color: var(--ivory-muted);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.neuron {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(176, 137, 64, 0.12);
		color: var(--brass-bright);
		padding: 0.2em 0.5em;
		font-size: 0.85rem;
		border: 1px solid var(--brass);
	}
	.verify {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px dashed var(--teal);
	}
	.verify h2 {
		font-size: 1rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--brass-bright);
		margin-bottom: 0.5rem;
	}
	button {
		font: inherit;
		padding: 0.6rem 1.4rem;
		background: transparent;
		border: 1px solid var(--brass);
		color: var(--brass-bright);
		cursor: pointer;
		margin-top: 1rem;
	}
	button:hover:not(:disabled) {
		background: rgba(176, 137, 64, 0.12);
	}
	button:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	.results {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5rem 1rem;
		margin-top: 1rem;
		color: var(--ivory-muted);
	}
	.results dt {
		font-size: 0.9rem;
	}
	.results dd {
		margin: 0;
	}
	.results code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.1em 0.4em;
		color: var(--brass-bright);
	}
	.results code.wrong {
		color: #d97070;
	}
	.delta {
		font-size: 0.85rem;
		color: var(--ivory-muted);
	}
	.error {
		color: #d97070;
	}
	code {
		font-family: 'SF Mono', Menlo, monospace;
	}
</style>
