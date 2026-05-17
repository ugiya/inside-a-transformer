<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameState } from '$lib/gameState.svelte';
	import VectorPrimitive from '$lib/math/VectorPrimitive.svelte';
	import DotProductPrimitive from '$lib/math/DotProductPrimitive.svelte';
	import MatrixVectorPrimitive from '$lib/math/MatrixVectorPrimitive.svelte';
	import SinCosPrimitive from '$lib/math/SinCosPrimitive.svelte';
	import UnitCirclePrimitive from '$lib/math/UnitCirclePrimitive.svelte';

	// Locked sequence per docs/math-antechamber-design.md:
	// P1 Vector → P3 Dot product → P2 Matrix×vector → P4 Sin/cos → P5 Unit circle.
	const steps = [
		{ key: 'vector', title: 'Vector', subtitle: 'a direction with a magnitude' },
		{ key: 'dot-product', title: 'Dot product', subtitle: 'how aligned are two arrows?' },
		{ key: 'matrix-vector', title: 'Matrix × vector', subtitle: 'a stack of dot products' },
		{ key: 'sin-cos', title: 'Sin & cos as waves', subtitle: 'circles, unrolled' },
		{ key: 'unit-circle', title: 'The unit circle', subtitle: 'where sin and cos really live' }
	] as const;

	let currentStep = $state(0);
	const isLast = $derived(currentStep === steps.length - 1);

	function next() {
		if (isLast) {
			goto('/embedding-garden');
			return;
		}
		currentStep += 1;
	}

	function skip() {
		gameState.setMathAntechamberSkipped(true);
		goto('/embedding-garden');
	}
</script>

<main>
	<header>
		<a class="back" href="/">← rooms</a>
		<h1>📐 Math Antechamber</h1>
		<p class="prose">
			Five small instruments — drag, slide, hover, watch the numbers move with you.
			Each one teaches a piece of math the lab will need <em>and</em> plants a visual
			motif you'll meet later as part of the Fourier circuit reveal.
		</p>
		<aside class="why" data-test="antechamber-why">
			<h2>Why these five, in this order?</h2>
			<ol>
				<li>
					<strong>Vector</strong> — every "thing" inside a transformer (a token, a
					hidden state, a Q/K/V) is one of these. <em>Foundation.</em>
				</li>
				<li>
					<strong>Dot product</strong> — turns two vectors into one number that
					says "how aligned are they?". <em>Attention scores are dot products.</em>
				</li>
				<li>
					<strong>Matrix × vector</strong> — a stack of dot products. <em>Every
					layer in every neural network is one of these (plus a bias and a
					nonlinearity).</em>
				</li>
				<li>
					<strong>Sin &amp; cos as waves</strong> — the actual math the model will
					end up doing internally. <em>The Fourier punchline in Room 8 is built
					out of these.</em>
				</li>
				<li>
					<strong>The unit circle</strong> — where sin and cos live. <em>The model
					will encode each of the 113 integers as a point on this circle (at five
					different frequencies).</em>
				</li>
			</ol>
			<p>
				If you already speak this language fluently, you can skip ahead — but the
				whole reveal in 🌀 Fourier Wing depends on these five things, so pause
				here if anything looks unfamiliar.
			</p>
		</aside>
		<div class="progress" data-test="progress">
			{#each steps as s, i (s.key)}
				<span class="dot" class:current={i === currentStep} class:done={i < currentStep}></span>
			{/each}
			<span class="progress-text">
				{currentStep + 1} / {steps.length} — {steps[currentStep].title}
			</span>
		</div>
	</header>

	<section class="scene" data-test="scene" data-current-step={currentStep}>
		<div class="scene-head">
			<h2 data-test="scene-title">{steps[currentStep].title}</h2>
			<p class="subtitle">{steps[currentStep].subtitle}</p>
		</div>

		<div class="stage">
			{#if currentStep === 0}
				<VectorPrimitive />
			{:else if currentStep === 1}
				<DotProductPrimitive />
			{:else if currentStep === 2}
				<MatrixVectorPrimitive />
			{:else if currentStep === 3}
				<SinCosPrimitive />
			{:else if currentStep === 4}
				<UnitCirclePrimitive />
			{/if}
		</div>

		<div class="controls">
			<button class="ghost" onclick={skip} data-test="skip-button">
				Skip the antechamber
			</button>
			<button class="brass" onclick={next} data-test="next-button">
				{isLast ? 'Enter the Garden →' : 'Next →'}
			</button>
		</div>
	</section>
</main>

<style>
	main {
		max-width: 980px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	header h1 {
		font-size: 2rem;
		margin: 0.5rem 0 0.5rem;
		color: var(--ivory);
	}
	.prose {
		max-width: 60ch;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.why {
		max-width: 72ch;
		margin: 1.25rem 0 0;
		padding: 1.1rem 1.4rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.93rem;
		line-height: 1.55;
	}
	.why h2 {
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
		margin: 0 0 0.6rem;
	}
	.why ol {
		margin: 0.25rem 0 0.6rem 1.25rem;
		padding: 0;
	}
	.why ol li {
		margin-bottom: 0.4rem;
	}
	.why p {
		margin: 0;
	}
	.why strong {
		color: var(--ivory);
	}
	.why em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.progress {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 1.25rem 0 0;
		font-size: 0.85rem;
		color: var(--ivory-muted);
		font-family: 'SF Mono', Menlo, monospace;
	}
	.progress .dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1px solid var(--teal);
	}
	.progress .dot.done {
		background: var(--teal);
	}
	.progress .dot.current {
		background: var(--brass-bright);
		border-color: var(--brass-bright);
	}
	.progress-text {
		margin-left: 0.5rem;
		color: var(--brass-bright);
	}
	.scene {
		margin-top: 1.5rem;
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.5rem;
	}
	.scene-head h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
	}
	.scene-head .subtitle {
		margin: 0.2rem 0 1rem;
		color: var(--ivory-muted);
		font-size: 0.95rem;
	}
	.stage {
		min-height: 360px;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem 0;
	}
	.controls {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
	button {
		font: inherit;
		padding: 0.55rem 1.1rem;
		background: var(--teal);
		color: var(--ivory);
		border: 1px solid var(--teal);
		cursor: pointer;
		letter-spacing: 0.05em;
		transition: background 200ms ease, border-color 200ms ease;
	}
	button:hover {
		border-color: var(--brass);
	}
	button.ghost {
		background: transparent;
		color: var(--ivory-muted);
	}
	button.brass {
		background: transparent;
		border-color: var(--brass);
		color: var(--brass-bright);
	}
	button.brass:hover {
		background: rgba(176, 137, 64, 0.12);
	}
</style>
