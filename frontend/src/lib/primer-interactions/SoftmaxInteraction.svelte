<script lang="ts">
	let temp = $state(1);
	const logits = [1.0, 2.0, 0.5, 3.0, 1.5];
	const probs = $derived.by(() => {
		const t = Math.max(0.05, temp);
		const exps = logits.map((l) => Math.exp(l / t));
		const z = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / z);
	});
</script>

<div class="softmax" data-test="softmax-interaction">
	<div class="bars">
		{#each probs as p, i (i)}
			<div class="bar" style:--h="{p * 100}%" title={`p=${p.toFixed(3)}`}></div>
		{/each}
	</div>
	<label>
		temperature: <input type="range" min="0.1" max="3" step="0.05" bind:value={temp} />
		<span>T = {temp.toFixed(2)}</span>
	</label>
</div>

<style>
	.softmax { display: flex; flex-direction: column; gap: 0.4rem; }
	.bars { display: flex; align-items: end; gap: 2px; height: 80px; }
	.bar { flex: 1; background: var(--brass, #b8864b); height: var(--h); }
	label { font-size: 0.8rem; }
</style>
