<script lang="ts">
	let { logits, label }: { logits: number[]; label?: string } = $props();

	const argmaxIndex = $derived(
		logits.length === 0 ? -1 : logits.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0)
	);
	const maxAbs = $derived(Math.max(1e-9, ...logits.map((v) => Math.abs(v))));
</script>

<div class="debug-view">
	{#if label}
		<div class="label">{label}</div>
	{/if}
	<div class="bars">
		{#each logits as v, i (i)}
			<div
				class="bar"
				class:argmax={i === argmaxIndex}
				data-bar
				data-index={i}
				data-argmax={i === argmaxIndex ? 'true' : 'false'}
				style:--h="{(Math.max(0, v) / maxAbs) * 100}%"
				title={`logit[${i}] = ${v.toFixed(4)}`}
			></div>
		{/each}
	</div>
</div>

<style>
	.debug-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.label {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		letter-spacing: 0.05em;
	}
	.bars {
		display: flex;
		align-items: end;
		gap: 1px;
		height: 200px;
	}
	.bar {
		flex: 1;
		min-width: 2px;
		height: var(--h, 0%);
		background: var(--brass);
	}
	.bar.argmax {
		background: var(--brass-bright);
	}
</style>
