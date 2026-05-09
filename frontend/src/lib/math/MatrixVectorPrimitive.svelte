<script lang="ts">
	// P2 — Matrix × vector. 3×4 fixed matrix A. x ∈ ℝ⁴ via four sliders.
	// y = A·x recomputed live. Hovering a row of A highlights the row + y_i and
	// shows the expanded dot product expression.
	const A: ReadonlyArray<ReadonlyArray<number>> = [
		[2, -1, 0.5, 3],
		[0, 4, -2, 1],
		[1, 1, 1, 1]
	];
	const ROWS = A.length;
	const COLS = A[0].length;

	let x = $state<number[]>([1, 2, 3, 0]);
	let hoveredRow = $state<number | null>(null);

	const y = $derived(
		A.map((row) => row.reduce((acc, a, j) => acc + a * x[j], 0))
	);

	function fmt(n: number) {
		return Number.isInteger(n) ? n.toString() : n.toFixed(1);
	}

	function expansionFor(rowIdx: number): string {
		const row = A[rowIdx];
		const terms = row.map((a, j) => `(${fmt(a)})·${fmt(x[j])}`).join(' + ');
		return `y_${rowIdx + 1} = row_${rowIdx + 1} · x = ${terms} = ${fmt(y[rowIdx])}`;
	}

	// Always show row 1's expansion by default so the formula is visible
	// before the player discovers the hover affordance.
	const shownRow = $derived(hoveredRow ?? 0);
</script>

<div class="matvec-primitive" data-test="matvec-primitive">
	<p class="lede">
		Each entry of <code>y</code> is one dot product: <strong>row <em>i</em> of A</strong> dotted with
		the whole vector <strong>x</strong>. Three rows of A → three dot products → three entries of y.
		<em>That's all "matrix × vector" is.</em>
	</p>
	<div class="grid">
		<div class="block" data-test="matrix-block">
			<div class="caption">A (3×4)</div>
			<table class="matrix">
				<tbody>
					{#each A as row, i (i)}
						<tr
							data-test="matrix-row"
							data-row={i}
							class:hovered={hoveredRow === i}
							onmouseenter={() => (hoveredRow = i)}
							onmouseleave={() => (hoveredRow = null)}
						>
							{#each row as a, j (j)}
								<td>{fmt(a)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="block" data-test="x-block">
			<div class="caption">x ∈ ℝ⁴</div>
			<div class="x-stack">
				{#each x as xi, j (j)}
					<label class="xrow">
						<span class="lbl">x{j + 1}</span>
						<input
							type="range"
							min="-3"
							max="3"
							step="0.1"
							value={xi}
							oninput={(e) => (x[j] = Number((e.currentTarget as HTMLInputElement).value))}
							data-test={`x-input-${j}`}
						/>
						<span class="val" data-test={`x-val-${j}`}>{fmt(xi)}</span>
					</label>
				{/each}
			</div>
		</div>

		<div class="block" data-test="y-block">
			<div class="caption">y = A·x</div>
			<table class="vector">
				<tbody>
					{#each y as yi, i (i)}
						<tr class:hovered={hoveredRow === i}>
							<td data-test={`y-val-${i}`}>{fmt(yi)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="expansion" data-test="expansion">
		<code data-test="expansion-text">{expansionFor(shownRow)}</code>
		{#if hoveredRow === null}
			<div class="hint">↑ row 1's dot product · hover any row of A to see the others</div>
		{/if}
	</div>

	<aside class="explainer" data-test="matvec-explainer">
		<h3>What is this teaching?</h3>
		<p>
			A <strong>matrix × vector</strong> turns one vector into another vector. Concretely:
			a matrix <code>A</code> with <em>m</em> rows and <em>n</em> columns can take a
			vector <code>x</code> with <em>n</em> entries and produce a vector <code>y</code>
			with <em>m</em> entries. The number of rows of <code>A</code> = the size of the
			output. Each row of <code>A</code> dotted with <code>x</code> = one entry of
			<code>y</code>.
		</p>

		<h3>Why does this lab care?</h3>
		<p>
			This is <strong>the atomic operation of every neural network layer</strong>.
			Every transformer layer, every RNN cell, every MLP, every attention head — all
			of them are repeated applications of <code>y = A·x + b</code> (matrix × vector,
			plus a bias) followed by a nonlinearity like <code>tanh</code> or <code>ReLU</code>.
		</p>
		<ul>
			<li>
				🌱 <strong>Embedding lookup</strong> = matrix × one-hot vector (it picks one
				row of the embedding matrix).
			</li>
			<li>
				👁 <strong>Computing Q/K/V</strong> = three separate matrix × vector
				operations applied to each token's embedding.
			</li>
			<li>
				🕯 <strong>Recurrent step</strong> = two matrix × vector operations
				(<code>W_x · x</code> + <code>W_h · h</code>) summed and squashed.
			</li>
			<li>
				🔥 <strong>MLP layer</strong> = literally <code>y = A · ReLU(B · x + c) + d</code>
				— two matrix × vectors with a nonlinearity sandwich.
			</li>
			<li>
				🗼 <strong>Unembedding</strong> = the final hidden state matrix-multiplied to
				produce vocab logits.
			</li>
		</ul>
		<p class="forward">
			Once you can read <code>y = A · x</code>, every layer in any neural network is
			just "do this, then a nonlinearity, then do this again." The whole transformer
			is layered matrix × vectors.
		</p>
	</aside>
</div>

<style>
	.matvec-primitive {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.grid {
		display: grid;
		grid-template-columns: auto auto auto;
		gap: 1.5rem;
		justify-content: center;
		align-items: start;
	}
	.caption {
		font-size: 0.8rem;
		color: var(--ivory-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 0.4rem;
	}
	table {
		border-collapse: collapse;
		font-family: 'SF Mono', Menlo, monospace;
	}
	.matrix td,
	.vector td {
		border: 1px solid var(--teal);
		padding: 0.35rem 0.6rem;
		min-width: 2.5rem;
		text-align: center;
		color: var(--ivory);
		background: rgba(31, 58, 61, 0.25);
	}
	.matrix tr.hovered td,
	.vector tr.hovered td {
		background: rgba(176, 137, 64, 0.18);
		border-color: var(--brass-bright);
		color: var(--brass-bright);
	}
	.x-stack {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.xrow {
		display: grid;
		grid-template-columns: 2rem 7rem 2.5rem;
		align-items: center;
		gap: 0.5rem;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.85rem;
		color: var(--ivory);
	}
	.xrow input[type='range'] {
		accent-color: var(--brass-bright);
	}
	.expansion {
		text-align: center;
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		font-size: 0.9rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}
	.expansion .hint {
		color: var(--ivory-muted);
		font-style: italic;
		font-family: 'Iowan Old Style', 'Palatino', Georgia, serif;
		font-size: 0.85rem;
	}
	.lede {
		max-width: 60ch;
		margin: 0 auto 0.5rem;
		color: var(--ivory-muted);
		font-size: 0.95rem;
		line-height: 1.55;
		text-align: center;
	}
	.lede strong {
		color: var(--ivory);
	}
	.lede em {
		font-style: italic;
	}
	.lede code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.05em 0.3em;
		color: var(--brass-bright);
	}
	.explainer {
		max-width: 64ch;
		margin: 0.5rem auto 0;
		padding: 1rem 1.25rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.9rem;
		line-height: 1.55;
	}
	.explainer h3 {
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--ivory);
		margin: 0.75rem 0 0.4rem;
	}
	.explainer h3:first-child {
		margin-top: 0;
	}
	.explainer p {
		margin: 0 0 0.5rem;
	}
	.explainer ul {
		margin: 0.25rem 0 0.5rem 1.25rem;
		padding: 0;
	}
	.explainer ul li {
		margin-bottom: 0.3rem;
	}
	.explainer strong {
		color: var(--ivory);
	}
	.explainer em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.explainer code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
	}
	.explainer .forward {
		font-size: 0.85rem;
		font-style: italic;
		border-top: 1px dashed var(--teal);
		padding-top: 0.6rem;
		margin-top: 0.6rem;
	}
</style>
