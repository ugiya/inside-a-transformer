<script lang="ts">
	const cells = ['a', 'b', 'c', 'd'];
	let patched = $state<number | null>(null);
	const baseTarget = [0.2, 0.4, 0.7, 0.3];
	const baseSource = [0.9, 0.1, 0.2, 0.8];
	const out = $derived(patched === null ? 0.30 : 0.30 + (baseSource[patched] - baseTarget[patched]) * 0.5);
</script>

<div class="patch" data-test="activation-patching-interaction">
	<div class="cols">
		<div class="col">
			<div class="hd">source</div>
			{#each cells as c, i (c)}
				<div class="cell src">{baseSource[i].toFixed(2)}</div>
			{/each}
		</div>
		<div class="col">
			<div class="hd">target (click to patch)</div>
			{#each cells as c, i (c)}
				<button
					class="cell tgt"
					class:patched={patched === i}
					onclick={() => (patched = patched === i ? null : i)}
				>{(patched === i ? baseSource[i] : baseTarget[i]).toFixed(2)}</button>
			{/each}
		</div>
	</div>
	<div class="hint">target output: 0.30 → <strong>{out.toFixed(3)}</strong></div>
</div>

<style>
	.patch { display: flex; flex-direction: column; gap: 0.4rem; }
	.cols { display: flex; gap: 0.5rem; }
	.col { display: flex; flex-direction: column; gap: 2px; flex: 1; }
	.hd { font-size: 0.75rem; color: var(--ivory-muted, #aaa); }
	.cell { padding: 0.2rem 0.4rem; font-family: monospace; background: rgba(255,255,255,0.05); border: 1px solid transparent; }
	.tgt { cursor: pointer; }
	.tgt.patched { border-color: var(--brass-bright, #e6b260); background: rgba(230,178,96,0.15); }
	.hint { font-size: 0.8rem; }
</style>
