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
</style>
