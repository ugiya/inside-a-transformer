<script lang="ts">
	let bias = $state(0);
	const base = [0.1, 0.4, 0.2, 0.6, 0.3];
	const vec = $derived(base.map((v, i) => v + (i === 3 ? bias : 0)));
	const argmax = $derived(vec.reduce((b, v, i, a) => (v > a[b] ? i : b), 0));
	const maxAbs = $derived(Math.max(1e-9, ...vec.map((v) => Math.abs(v))));
</script>

<div class="logits" data-test="logits-interaction">
	<div class="bars">
		{#each vec as v, i (i)}
			<div class="bar" class:argmax={i === argmax} style:--h="{(v / maxAbs) * 100}%"></div>
		{/each}
	</div>
	<label>
		bias on token 3: <input type="range" min="-1" max="1" step="0.05" bind:value={bias} />
	</label>
	<div class="hint">argmax = token {argmax}</div>
</div>

<style>
	.logits { display: flex; flex-direction: column; gap: 0.4rem; }
	.bars { display: flex; align-items: end; gap: 2px; height: 80px; }
	.bar { flex: 1; background: var(--brass, #b8864b); height: var(--h); }
	.bar.argmax { background: var(--brass-bright, #e6b260); }
	.hint { font-size: 0.8rem; color: var(--ivory-muted, #aaa); }
</style>
