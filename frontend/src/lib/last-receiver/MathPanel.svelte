<script lang="ts">
	// Collapsible "step out of the body to see the math" panel.
	// Shows the W_x·x, W_h·h, +b, tanh decomposition for the most recent step.
	// Uses the exact same vocabulary as [data-test="rnn-explainer"] below the
	// game so the cross-reference works without a translation layer.
	// PRD #18 ISC-17.
	import { untrack } from 'svelte';
	import type { Weights } from '$lib/rnn/recurrence';

	interface Props {
		weights: Weights;
		xCurrent: readonly number[]; // x_t — the current word's embedding
		hPrev: readonly number[]; // h_{t-1} — last step's hidden state
		hNew: readonly number[]; // h_t — this step's hidden state
		word: string;
		step: number; // zero-indexed
		open?: boolean;
	}
	let { weights, xCurrent, hPrev, hNew, word, step, open = false }: Props =
		$props();

	let expanded = $state(untrack(() => open));

	const fmt = (n: number) => n.toFixed(3);
	const formatVec = (v: readonly number[]) =>
		v.length <= 8
			? `[ ${v.map(fmt).join(', ')} ]`
			: `[ ${v.slice(0, 5).map(fmt).join(', ')}, …, ${fmt(v[v.length - 1])} ]`;

	// W_x · x_t (matrix×vector → vector of length N)
	const WxX = $derived<number[]>(
		weights.Wx.map((row) => row.reduce((s, w, j) => s + w * xCurrent[j], 0))
	);
	// W_h · h_{t-1}
	const WhH = $derived<number[]>(
		weights.Wh.map((row) => row.reduce((s, w, j) => s + w * hPrev[j], 0))
	);
	// Sum before tanh
	const preTanh = $derived<number[]>(
		WxX.map((v, i) => v + WhH[i] + weights.b[i])
	);
</script>

<details
	class="math-panel"
	data-test="math-panel"
	bind:open={expanded}
>
	<summary
		class="toggle"
		data-test="math-toggle"
		aria-label="toggle math panel for the current step"
	>
		<span class="caret" aria-hidden="true">▸</span>
		step out of the body to see the math
		<span class="step-tag">· step {step + 1}</span>
	</summary>

	<div class="body" data-test="math-panel-body">
		<p class="caption">
			This step's word is <code>{word}</code>. The hidden state
			<code>h_(t-1)</code> has been re-stirred with that word, then squashed
			by <code>tanh</code>.
		</p>

		<dl class="decomp">
			<dt><code>x_t</code> <span class="dim">(word embedding, dim {xCurrent.length})</span></dt>
			<dd>{formatVec(xCurrent)}</dd>

			<dt><code>W_x · x_t</code> <span class="dim">(current word's contribution)</span></dt>
			<dd>{formatVec(WxX)}</dd>

			<dt><code>W_h · h_(t-1)</code> <span class="dim">(previous memory's contribution)</span></dt>
			<dd>{formatVec(WhH)}</dd>

			<dt><code>W_x · x_t + W_h · h_(t-1) + b</code> <span class="dim">(pre-tanh sum)</span></dt>
			<dd>{formatVec(preTanh)}</dd>

			<dt><code>tanh(…) = h_t</code> <span class="dim">(this step's hidden state)</span></dt>
			<dd>{formatVec(hNew)}</dd>
		</dl>

		<p class="hint">
			Same 6-step procedure as the textual explainer below. Every entry of
			<code>h_t</code> is bounded in <code>[−1, +1]</code> — that's the
			<code>tanh</code> doing its job.
		</p>
	</div>
</details>

<style>
	.math-panel {
		max-width: 56ch;
		margin: 0 auto;
		font-size: 0.85rem;
		color: var(--ivory-muted);
		border: 1px dashed var(--teal);
		background: rgba(13, 21, 24, 0.55);
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.6rem 0.85rem;
		cursor: pointer;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
		list-style: none;
	}
	.toggle::-webkit-details-marker {
		display: none;
	}
	.toggle:focus-visible {
		outline: 2px solid var(--brass-bright);
		outline-offset: 3px;
	}
	.caret {
		display: inline-block;
		transition: transform 200ms ease;
	}
	.math-panel[open] .caret {
		transform: rotate(90deg);
	}
	@media (prefers-reduced-motion: reduce) {
		.caret { transition: none; }
	}
	.step-tag {
		color: var(--ivory-muted);
		font-style: italic;
	}
	.body {
		padding: 0.75rem 1rem 1rem;
		border-top: 1px dashed var(--teal);
	}
	.caption {
		margin: 0 0 0.75rem;
		font-family: inherit;
	}
	.caption code,
	.decomp code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
	}
	.decomp {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.35rem 0;
		margin: 0 0 0.75rem;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.78rem;
	}
	.decomp dt {
		color: var(--ivory);
		margin-top: 0.25rem;
	}
	.decomp dd {
		margin: 0;
		color: var(--brass-bright);
		word-break: break-all;
	}
	.dim {
		color: var(--ivory-muted);
		font-style: italic;
		font-family: inherit;
		font-size: 0.95em;
	}
	.hint {
		margin: 0;
		font-size: 0.78rem;
		color: var(--ivory-muted);
		font-style: italic;
	}
</style>
