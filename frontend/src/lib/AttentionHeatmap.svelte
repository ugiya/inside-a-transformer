<script lang="ts">
	type Props = {
		pattern: number[][];
		tokens: number[];
		cellSize?: number;
	};

	let { pattern, tokens, cellSize = 70 }: Props = $props();
	let hovered = $state<{ row: number; col: number; value: number } | null>(null);

	const n = $derived(pattern.length);
	const size = $derived(n * cellSize);
</script>

<div class="heatmap-wrap">
	<svg viewBox="0 0 {size + 50} {size + 50}" class="heatmap-svg">
		<g transform="translate(40, 40)">
			{#each pattern as row, r (r)}
				{#each row as v, c (c)}
					<rect
						role="gridcell"
						tabindex="-1"
						aria-label="row {tokens[r]} col {tokens[c]} value {v.toFixed(3)}"
						data-heatmap-cell
						data-row={r}
						data-col={c}
						data-value={v}
						x={c * cellSize}
						y={r * cellSize}
						width={cellSize - 2}
						height={cellSize - 2}
						fill="var(--brass-bright)"
						fill-opacity={Math.max(0, Math.min(1, v))}
						stroke="var(--teal)"
						stroke-width="1"
						onmouseenter={() => (hovered = { row: r, col: c, value: v })}
						onmouseleave={() => (hovered = null)}
					/>
				{/each}
			{/each}
			<!-- col labels -->
			{#each tokens as t, c (c)}
				<text x={c * cellSize + cellSize / 2 - 1} y="-12" text-anchor="middle" class="axis-label">
					{t === 113 ? '=' : t}
				</text>
			{/each}
			<!-- row labels -->
			{#each tokens as t, r (r)}
				<text x="-8" y={r * cellSize + cellSize / 2 + 4} text-anchor="end" class="axis-label">
					{t === 113 ? '=' : t}
				</text>
			{/each}
		</g>
	</svg>
	{#if hovered}
		<div class="tooltip" data-heatmap-tooltip>
			row {tokens[hovered.row]} → col {tokens[hovered.col]}: {hovered.value.toFixed(3)}
		</div>
	{/if}
</div>

<style>
	.heatmap-wrap {
		position: relative;
		display: inline-block;
	}
	.heatmap-svg {
		width: 100%;
		max-width: 280px;
		height: auto;
	}
	.axis-label {
		fill: var(--ivory-muted);
		font-size: 11px;
		font-family: 'SF Mono', Menlo, monospace;
	}
	.tooltip {
		position: absolute;
		bottom: -2.2rem;
		left: 0;
		background: var(--teal-deep);
		color: var(--ivory);
		padding: 0.3rem 0.6rem;
		font-size: 0.85rem;
		border: 1px solid var(--brass);
		font-family: 'SF Mono', Menlo, monospace;
		pointer-events: none;
	}
</style>
