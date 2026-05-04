<script lang="ts">
	let p = $state(0.5);
	const loss = $derived(-Math.log(Math.max(1e-6, p)));
</script>

<div class="ce" data-test="cross-entropy-interaction">
	<label>
		p(correct): <input type="range" min="0.01" max="0.99" step="0.01" bind:value={p} />
		<span>{p.toFixed(2)}</span>
	</label>
	<svg viewBox="0 0 200 80" width="200" height="80" aria-hidden="true">
		<line x1="0" y1="78" x2="200" y2="78" stroke="currentColor" stroke-opacity="0.3" />
		{#each Array.from({ length: 50 }, (_, i) => (i + 1) / 50) as q}
			<circle cx={q * 200} cy={78 - Math.min(70, -Math.log(q) * 18)} r="1" fill="currentColor" />
		{/each}
		<circle cx={p * 200} cy={78 - Math.min(70, loss * 18)} r="3" fill="var(--brass-bright, #e6b260)" />
	</svg>
	<div class="hint">loss = −log p = {loss.toFixed(3)}</div>
</div>

<style>
	.ce { display: flex; flex-direction: column; gap: 0.4rem; }
	.hint { font-size: 0.8rem; color: var(--ivory-muted, #aaa); }
</style>
