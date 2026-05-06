<script lang="ts">
	type Props = {
		values: number[];
		ablatedIndex?: number | null;
		onAblate?: (i: number) => void;
		height?: number;
	};

	let { values, ablatedIndex = null, onAblate, height = 160 }: Props = $props();
	let hovered = $state<number | null>(null);

	const maxAbs = $derived(Math.max(1e-9, ...values.map((v) => Math.abs(v))));
</script>

<div class="activation-panel" style:--h="{height}px">
	<div class="bars">
		{#each values as v, i (i)}
			<button
				type="button"
				class="bar"
				class:negative={v < 0}
				class:ablated={i === ablatedIndex}
				class:hovered={hovered === i}
				data-bar
				data-index={i}
				data-value={v}
				style:--bar-h="{(Math.abs(v) / maxAbs) * 100}%"
				onclick={() => onAblate?.(i)}
				onmouseenter={() => (hovered = i)}
				onmouseleave={() => (hovered = null)}
				title="neuron {i} = {v.toFixed(3)}"
				aria-label="neuron {i} activation {v.toFixed(3)}"
			></button>
		{/each}
	</div>
	{#if hovered !== null}
		<div class="legend" data-tooltip>
			neuron {hovered}: {values[hovered].toFixed(3)}
		</div>
	{:else}
		<div class="legend">
			{values.length} neurons
			{#if ablatedIndex !== null}
				· ablated #{ablatedIndex}
			{/if}
		</div>
	{/if}
</div>

<style>
	.activation-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.bars {
		display: flex;
		align-items: center;
		gap: 1px;
		height: var(--h, 160px);
		background: rgba(13, 21, 24, 0.4);
		padding: 0 2px;
	}
	.bar {
		flex: 1;
		min-width: 2px;
		border: none;
		padding: 0;
		cursor: pointer;
		background: var(--brass);
		height: var(--bar-h, 0%);
		align-self: center;
		transition: height 120ms ease, background 120ms ease;
	}
	.bar:hover,
	.bar.hovered {
		background: var(--brass-bright);
	}
	.bar.negative {
		background: #d97070;
		align-self: end;
	}
	.bar.negative:hover,
	.bar.negative.hovered {
		background: #ff9090;
	}
	.bar.ablated {
		outline: 1px solid var(--ivory);
		outline-offset: 1px;
	}
	.legend {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		font-family: 'SF Mono', Menlo, monospace;
	}
</style>
