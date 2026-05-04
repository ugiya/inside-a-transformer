<script lang="ts">
	let lambda = $state(1.0);
	const start = 1.0;
	const stepsAfter5 = $derived(start * Math.pow(1 - 0.01 * lambda, 5));
</script>

<div class="wd" data-test="weight-decay-interaction">
	<label>
		λ (weight decay): <input type="range" min="0" max="2" step="0.05" bind:value={lambda} />
		<span>{lambda.toFixed(2)}</span>
	</label>
	<div class="hint">
		Each step multiplies <code>w</code> by <code>(1 − η·λ)</code>. After 5 steps with η=0.01,
		<code>w</code> shrinks from 1.000 → <strong>{stepsAfter5.toFixed(4)}</strong>.
	</div>
</div>

<style>
	.wd { display: flex; flex-direction: column; gap: 0.4rem; }
	.hint { font-size: 0.8rem; color: var(--ivory-muted, #aaa); line-height: 1.4; }
</style>
