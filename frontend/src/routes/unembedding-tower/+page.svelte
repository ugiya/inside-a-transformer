<script lang="ts">
	import { onMount } from 'svelte';
	import DebugView from '$lib/DebugView.svelte';
	import { P } from '$lib/style';

	type UnembedPayload = {
		step: number;
		P: number;
		d_model: number;
		d_vocab: number;
		answer: number;
		tokens: number[];
		W_U: number[][]; // [d_model][d_vocab]
		b_U: number[]; // [d_vocab]
		resid_post_final: number[]; // [d_model]
	};

	// The slider perturbs the residual at one of d_model = 128 dimensions by
	// adding DELTA along that unit direction. Easy to reason about visually:
	// each click moves you to a different "axis" of the residual stream and
	// shows how strongly that axis routes mass through the unembed.
	//
	// DELTA is large because the trained Nanda-config model is *very* confident
	// at step 39999 — small perturbations don't move the argmax. With DELTA=300
	// roughly half the k positions flip the argmax, giving visible "lurch"
	// across the slider sweep.
	const DELTA = 300.0;
	const D_MODEL = 128;

	let payload = $state<UnembedPayload | null>(null);
	let error = $state<string | null>(null);
	let k = $state(0);

	onMount(async () => {
		try {
			const res = await fetch('/weights/unembed.json');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			payload = (await res.json()) as UnembedPayload;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	});

	/** logits[v] = sum_i (resid[i] + (i==k ? DELTA : 0)) * W_U[i][v] + b_U[v] */
	const logitsFull = $derived.by(() => {
		if (!payload) return null;
		const { W_U, b_U, resid_post_final, d_vocab } = payload;
		const out = new Array<number>(d_vocab);
		for (let v = 0; v < d_vocab; v++) out[v] = b_U[v];
		for (let i = 0; i < resid_post_final.length; i++) {
			const r = resid_post_final[i] + (i === k ? DELTA : 0);
			const row = W_U[i];
			for (let v = 0; v < d_vocab; v++) {
				out[v] += r * row[v];
			}
		}
		return out;
	});

	/** Drop the "=" token at index P; we only care about the answer space [0..P-1]. */
	const logits = $derived(logitsFull ? logitsFull.slice(0, P) : null);

	const softmax = $derived.by(() => {
		if (!logits) return null;
		const maxL = Math.max(...logits);
		const exps = logits.map((v) => Math.exp(v - maxL));
		const denom = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / denom);
	});

	const ce = $derived.by(() => {
		if (!softmax || !payload) return null;
		const p = softmax[payload.answer];
		// Guard against log(0) -> -Infinity: clamp to tiny epsilon.
		return -Math.log(Math.max(p, 1e-30));
	});
</script>

<main>
	<header>
		<a class="back" href="/">← rooms</a>
		<h1>🗼 Unembedding Tower</h1>
		<p class="prose">
			A residual vector enters the tower; the unembed projects it onto the 113
			possible answers. Drag the slider to push on a single dimension of the residual
			and watch the logits, probabilities, and cross-entropy lurch.
		</p>
	</header>

	<section class="lab">
		<div class="slider-row">
			<label for="resid-k">residual position {k} / {D_MODEL - 1}</label>
			<input
				id="resid-k"
				type="range"
				min="0"
				max={D_MODEL - 1}
				step="1"
				data-slider="resid-position"
				bind:value={k}
			/>
		</div>

		{#if error}
			<p class="error">Could not load weights: {error}</p>
		{/if}

		<div class="display" data-display="logits">
			{#if logits}
				<DebugView {logits} label="logits[0..112]" />
				<p class="caption">
					Argmax is the model's vote; the correct answer is {payload?.answer}.
				</p>
			{:else}
				<p class="caption">Loading logits…</p>
			{/if}
		</div>

		<div class="display" data-display="softmax">
			{#if softmax}
				<DebugView logits={softmax} label="softmax probabilities" />
				<p class="caption">Same shape, normalized — bars sum to 1.</p>
			{:else}
				<p class="caption">Loading probabilities…</p>
			{/if}
		</div>

		<div class="display" data-display="cross-entropy">
			<div class="ce-block">
				<span class="ce-label">
					cross-entropy vs answer {payload?.answer ?? '…'}
				</span>
				<span class="ce-value" data-ce>{ce !== null ? ce.toFixed(3) : '…'}</span>
			</div>
			<p class="caption">Lower is better; pushing on the wrong axis sends it up.</p>
		</div>
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
	header h1 {
		font-size: 2rem;
		margin: 0.5rem 0 0.5rem;
		color: var(--ivory);
	}
	.prose {
		max-width: 60ch;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.error {
		color: #d97070;
	}
	.lab {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-top: 2rem;
	}
	.slider-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
	}
	.slider-row label {
		color: var(--ivory-muted);
		font-size: 0.9rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	.slider-row input[type='range'] {
		width: 100%;
		accent-color: var(--brass-bright);
	}
	.display {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.25rem;
	}
	.caption {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		margin: 0.75rem 0 0;
		line-height: 1.4;
	}
	.ce-block {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.ce-label {
		color: var(--ivory-muted);
		font-size: 0.95rem;
		letter-spacing: 0.05em;
	}
	.ce-value {
		color: var(--brass-bright);
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 2.4rem;
	}
</style>
