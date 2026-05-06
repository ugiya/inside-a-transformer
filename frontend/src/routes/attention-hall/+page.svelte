<script lang="ts">
	import { forward, probe } from '$lib/api';
	import AttentionHeatmap from '$lib/AttentionHeatmap.svelte';

	const TOKENS = [5, 17, 113];
	const ANSWER = 22;
	const N_HEADS = 4;
	const PATTERN_KEY = 'blocks.0.attn.hook_pattern';

	let patterns = $state<number[][][] | null>(null); // [n_heads][n_ctx][n_ctx]
	let baselineArgmax = $state<number | null>(null);
	let ablatedArgmax = $state<number | null>(null);
	let ablatedHead = $state<number | null>(null);
	let connected = $state<{ Q: boolean; K: boolean; V: boolean }>({ Q: false, K: false, V: false });
	let error = $state<string | null>(null);

	const allWired = $derived(connected.Q && connected.K && connected.V);

	async function loadAttention() {
		error = null;
		try {
			const res = await forward(TOKENS, [PATTERN_KEY]);
			const cached = res.cached as Record<string, number[][][]>;
			patterns = cached[PATTERN_KEY] as number[][][];
			baselineArgmax = argmax(res.logits.slice(0, 113));
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function argmax(arr: number[]): number {
		let best = 0;
		for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
		return best;
	}

	async function ablate(head: number) {
		try {
			const res = await probe(TOKENS, { kind: 'ablate_head', head }, []);
			ablatedArgmax = argmax(res.logits.slice(0, 113));
			ablatedHead = head;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function clearAblation() {
		ablatedArgmax = null;
		ablatedHead = null;
	}

	$effect(() => {
		if (allWired && !patterns) loadAttention();
	});
</script>

<main>
	<a class="back" href="/">← rooms</a>
	<h1>👁 Attention Hall</h1>
	<p class="prose">
		Where vectors decide who to look at. Wire up the three projections — <em>Query</em>,
		<em>Key</em>, <em>Value</em> — to bring the head online. Then watch where it looks on the
		input <code>(5, 17, =)</code>, and ablate a head to feel its absence.
	</p>

	<section class="lab">
		<div class="panel wiring">
			<h2>The Wiring</h2>
			<div class="wires">
				{#each ['Q', 'K', 'V'] as wire (wire)}
					<button
						class="wire"
						class:on={connected[wire as 'Q' | 'K' | 'V']}
						onclick={() => (connected[wire as 'Q' | 'K' | 'V'] = !connected[wire as 'Q' | 'K' | 'V'])}
					>
						<span class="glyph">{wire}</span>
						<span class="state">{connected[wire as 'Q' | 'K' | 'V'] ? 'connected' : 'click to connect'}</span>
					</button>
				{/each}
			</div>
			{#if !allWired}
				<p class="hint">Connect all three to bring the attention head online.</p>
			{/if}
		</div>

		{#if patterns}
			<div class="panel">
				<h2>Attention pattern — input ({TOKENS[0]}, {TOKENS[1]}, =)</h2>
				<div class="heads-grid">
					{#each patterns as headPattern, h (h)}
						<div class="head" data-head={h}>
							<div class="head-label">head {h}</div>
							<AttentionHeatmap pattern={headPattern} tokens={TOKENS} />
						</div>
					{/each}
				</div>
			</div>

			<div class="panel">
				<h2>Discovery — does this head matter?</h2>
				<p class="prose-narrow">
					The model predicts <code class="brass">{baselineArgmax}</code>
					(correct answer is <code>{ANSWER}</code>).
					Ablate one head — does the prediction survive?
				</p>
				<div class="ablate-controls">
					{#each Array.from({ length: N_HEADS }, (_, i) => i) as h (h)}
						<button class="ablate-btn" class:active={ablatedHead === h} onclick={() => ablate(h)}>
							Ablate head {h}
						</button>
					{/each}
					{#if ablatedHead !== null}
						<button class="reset" onclick={clearAblation}>Reset</button>
					{/if}
				</div>
				{#if ablatedHead !== null && ablatedArgmax !== null}
					<p class="result" data-ablation-result>
						With head {ablatedHead} ablated, the model now predicts
						<code class:right={ablatedArgmax === ANSWER} class:wrong={ablatedArgmax !== ANSWER}>
							{ablatedArgmax}
						</code>
						{#if ablatedArgmax !== ANSWER}
							— this head was load-bearing.
						{:else}
							— the model still gets it right; this head is not solely responsible.
						{/if}
					</p>
				{/if}
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
	.prose,
	.prose-narrow {
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
	.wires {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.wire {
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
		min-width: 8rem;
		transition: all 200ms ease;
	}
	.wire .glyph {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--ivory-muted);
	}
	.wire .state {
		font-size: 0.8rem;
		color: var(--ivory-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.wire.on {
		border-color: var(--brass);
		background: rgba(176, 137, 64, 0.18);
	}
	.wire.on .glyph {
		color: var(--brass-bright);
	}
	.wire.on .state {
		color: var(--brass-bright);
	}
	.hint {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		font-style: italic;
		margin-top: 1rem;
	}
	.heads-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		max-width: 700px;
	}
	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.head-label {
		font-size: 0.85rem;
		color: var(--brass-bright);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.ablate-controls {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
	button.ablate-btn,
	button.reset {
		font: inherit;
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--ivory);
		border: 1px solid var(--teal);
		cursor: pointer;
	}
	button.ablate-btn:hover,
	button.ablate-btn.active {
		border-color: var(--brass);
		color: var(--brass-bright);
	}
	button.reset {
		border-color: var(--ivory-muted);
		color: var(--ivory-muted);
	}
	.result {
		color: var(--ivory-muted);
		margin-top: 1rem;
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
	code.brass {
		color: var(--brass-bright);
	}
	.error {
		color: #d97070;
	}
</style>
