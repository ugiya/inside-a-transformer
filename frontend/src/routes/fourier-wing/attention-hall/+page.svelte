<script lang="ts">
	import { onMount } from 'svelte';
	import { forward, probe } from '$lib/api';
	import AttentionHeatmap from '$lib/AttentionHeatmap.svelte';

	const TOKENS = [5, 17, 113];
	const ANSWER = 22;
	const PATTERN_KEY = 'blocks.0.attn.hook_pattern';
	const RESID_PRE_KEY = 'blocks.0.hook_resid_pre';
	const ATTN_OUT_KEY = 'blocks.0.attn.hook_attn_out';
	const MLP_OUT_KEY = 'blocks.0.hook_mlp_out';
	const D_MODEL = 128;

	type UnembedPayload = {
		W_U: number[][]; // [d_model][d_vocab]
		b_U: number[];
	};

	let sourceA = $state(8);
	let sourceB = $state(14);
	let position = $state(0);

	let baselineArgmax = $state<number | null>(null);
	let patchedArgmax = $state<number | null>(null);
	let unpatchedPattern = $state<number[][] | null>(null); // head 0
	let patchedPattern = $state<number[][] | null>(null); // head 0

	let embedContrib = $state<number | null>(null);
	let attnContrib = $state<number | null>(null);
	let mlpContrib = $state<number | null>(null);

	let unembed = $state<UnembedPayload | null>(null);
	let unembedMissing = $state(false);
	let error = $state<string | null>(null);
	let busy = $state(false);

	onMount(async () => {
		try {
			const res = await fetch('/weights/unembed.json');
			if (!res.ok) {
				unembedMissing = true;
				return;
			}
			const json = (await res.json()) as UnembedPayload;
			unembed = { W_U: json.W_U, b_U: json.b_U };
		} catch {
			unembedMissing = true;
		}
	});

	function argmax(arr: number[]): number {
		let best = 0;
		for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
		return best;
	}

	/** logit_v from a residual chunk: (chunk @ W_U)[v]. b_U is added once at the
	 *  baseline (embed) only, since attn/mlp are decomposition contributions. */
	function logitFromResid(
		resid: number[],
		W_U: number[][],
		b_U: number[] | null,
		v: number
	): number {
		let s = b_U ? b_U[v] : 0;
		for (let i = 0; i < resid.length; i++) {
			s += resid[i] * W_U[i][v];
		}
		return s;
	}

	async function runPatched() {
		if (busy) return;
		busy = true;
		error = null;
		try {
			const sourceTokens = [sourceA, sourceB, 113];
			const cacheKeys = [PATTERN_KEY, RESID_PRE_KEY, ATTN_OUT_KEY, MLP_OUT_KEY];

			// Baseline forward + patched probe in parallel.
			const [baseline, patched] = await Promise.all([
				forward(TOKENS, cacheKeys),
				probe(
					TOKENS,
					{ kind: 'patch_residual', position, source_tokens: sourceTokens },
					[PATTERN_KEY]
				)
			]);

			baselineArgmax = argmax(baseline.logits.slice(0, 113));
			patchedArgmax = argmax(patched.logits.slice(0, 113));

			const baseCache = baseline.cached as Record<string, number[][][] | number[][]>;
			const patchedCache = patched.cached as Record<string, number[][][]>;

			const basePatterns = baseCache[PATTERN_KEY] as number[][][] | undefined;
			const patchedPatterns = patchedCache[PATTERN_KEY] as number[][][] | undefined;
			unpatchedPattern = basePatterns ? basePatterns[0] : null;
			patchedPattern = patchedPatterns ? patchedPatterns[0] : null;

			// Logit attribution at the answer token (last position = 2).
			if (unembed) {
				const lastPos = TOKENS.length - 1;
				const residPre = baseCache[RESID_PRE_KEY] as number[][] | undefined;
				const attnOut = baseCache[ATTN_OUT_KEY] as number[][] | undefined;
				const mlpOut = baseCache[MLP_OUT_KEY] as number[][] | undefined;

				if (residPre && attnOut && mlpOut) {
					embedContrib = logitFromResid(residPre[lastPos], unembed.W_U, unembed.b_U, ANSWER);
					attnContrib = logitFromResid(attnOut[lastPos], unembed.W_U, null, ANSWER);
					mlpContrib = logitFromResid(mlpOut[lastPos], unembed.W_U, null, ANSWER);
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<main>
	<a class="back" href="/">← rooms</a>
	<h1>👁 Attention Hall — Fourier Wing</h1>
	<p class="prose">
		Re-enter the room with sharper instruments. Pick a <em>source</em> forward pass
		<code>(a, b, =)</code>, then patch its residual into the <em>target</em>
		<code>(5, 17, =)</code> at one position. Watch the prediction shift, and read off how much
		each component contributes to the answer logit.
	</p>

	<section class="lab">
		<div class="panel">
			<h2>Activation Patching</h2>
			<div class="controls">
				<label>
					<span>source a</span>
					<input
						type="number"
						min="0"
						max="112"
						step="1"
						bind:value={sourceA}
						data-source-a
					/>
				</label>
				<label>
					<span>source b</span>
					<input
						type="number"
						min="0"
						max="112"
						step="1"
						bind:value={sourceB}
						data-source-b
					/>
				</label>
				<label>
					<span>position</span>
					<select bind:value={position} data-position-selector>
						<option value={0}>0 (a)</option>
						<option value={1}>1 (b)</option>
						<option value={2}>2 (=)</option>
					</select>
				</label>
				<span class="target">target = (5, 17, =)</span>
				<button
					class="run"
					data-run-patched
					onclick={runPatched}
					disabled={busy}
				>
					{busy ? 'Running…' : 'Run patched forward'}
				</button>
			</div>
		</div>

		{#if baselineArgmax !== null && patchedArgmax !== null}
			<div class="panel">
				<h2>Argmax — baseline vs patched</h2>
				<div class="argmax-row">
					<div>
						<div class="label">baseline</div>
						<code
							class:right={baselineArgmax === ANSWER}
							class:wrong={baselineArgmax !== ANSWER}
							data-argmax="baseline">{baselineArgmax}</code
						>
					</div>
					<div>
						<div class="label">patched</div>
						<code
							class:right={patchedArgmax === ANSWER}
							class:wrong={patchedArgmax !== ANSWER}
							data-argmax="patched">{patchedArgmax}</code
						>
					</div>
					<div class="answer">answer = <code>{ANSWER}</code></div>
				</div>
			</div>
		{/if}

		{#if unpatchedPattern && patchedPattern}
			<div class="panel">
				<h2>Attention pattern — head 0</h2>
				<div class="heatmaps">
					<div class="heatmap-cell" data-heatmap="unpatched">
						<div class="label">unpatched</div>
						<AttentionHeatmap pattern={unpatchedPattern} tokens={TOKENS} />
					</div>
					<div class="heatmap-cell" data-heatmap="patched">
						<div class="label">patched</div>
						<AttentionHeatmap pattern={patchedPattern} tokens={TOKENS} />
					</div>
				</div>
			</div>
		{/if}

		<div class="panel">
			<h2>Logit attribution — answer = {ANSWER}</h2>
			{#if unembedMissing}
				<p class="hint" data-attrib-missing>
					N/A — needs <code>weights/unembed.json</code> from Slice #12.
				</p>
			{:else if embedContrib !== null && attnContrib !== null && mlpContrib !== null}
				<div class="attrib-row">
					<div class="attrib-cell">
						<div class="label">embed contribution</div>
						<code data-attrib="embed">{embedContrib.toFixed(4)}</code>
					</div>
					<div class="attrib-cell">
						<div class="label">attn contribution</div>
						<code data-attrib="attn">{attnContrib.toFixed(4)}</code>
					</div>
					<div class="attrib-cell">
						<div class="label">mlp contribution</div>
						<code data-attrib="mlp">{mlpContrib.toFixed(4)}</code>
					</div>
				</div>
			{:else}
				<p class="hint">Run a patched forward to populate logit attribution.</p>
			{/if}
		</div>

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
	.controls {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}
	.controls label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.8rem;
		color: var(--ivory-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.controls input,
	.controls select {
		font: inherit;
		font-family: 'SF Mono', Menlo, monospace;
		background: var(--teal-deep, rgba(13, 21, 24, 0.7));
		color: var(--ivory);
		border: 1px solid var(--teal);
		padding: 0.4rem 0.6rem;
		min-width: 5rem;
	}
	.controls .target {
		color: var(--ivory-muted);
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.85rem;
		padding-bottom: 0.5rem;
	}
	.run {
		font: inherit;
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--ivory);
		border: 1px solid var(--brass);
		cursor: pointer;
	}
	.run:hover:not(:disabled) {
		background: rgba(176, 137, 64, 0.18);
		color: var(--brass-bright);
	}
	.run:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.argmax-row {
		display: flex;
		gap: 2rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.label {
		font-size: 0.8rem;
		color: var(--ivory-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 0.3rem;
	}
	.heatmaps {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.heatmap-cell {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.attrib-row {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}
	.attrib-cell {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.1em 0.4em;
	}
	.right {
		color: var(--brass-bright);
	}
	.wrong {
		color: #d97070;
	}
	.answer {
		color: var(--ivory-muted);
		font-size: 0.9rem;
	}
	.hint {
		color: var(--ivory-muted);
		font-style: italic;
		font-size: 0.9rem;
	}
	.error {
		color: #d97070;
	}
</style>
