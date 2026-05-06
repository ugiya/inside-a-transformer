<script lang="ts">
	// P5 — Unit circle. Draggable point on the circumference; readouts of cos(θ),
	// sin(θ), and projection shadows onto the axes.
	const SIZE = 320;
	const ORIGIN_X = SIZE / 2;
	const ORIGIN_Y = SIZE / 2;
	const R = 110;

	let theta = $state(Math.PI / 4); // start at 45°
	let dragging = $state(false);
	let svgEl: SVGSVGElement | null = $state(null);
	let interacted = $state(false);

	const cosVal = $derived(Math.cos(theta));
	const sinVal = $derived(Math.sin(theta));

	const ptX = $derived(ORIGIN_X + R * cosVal);
	const ptY = $derived(ORIGIN_Y - R * sinVal);

	function clientToTheta(clientX: number, clientY: number) {
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const sx = ((clientX - rect.left) / rect.width) * SIZE;
		const sy = ((clientY - rect.top) / rect.height) * SIZE;
		const dx = sx - ORIGIN_X;
		const dy = ORIGIN_Y - sy; // math-y up
		let t = Math.atan2(dy, dx);
		if (t < 0) t += Math.PI * 2;
		theta = t;
		interacted = true;
	}

	function onPointerDown(e: PointerEvent) {
		dragging = true;
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
		clientToTheta(e.clientX, e.clientY);
	}
	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		clientToTheta(e.clientX, e.clientY);
	}
	function onPointerUp(e: PointerEvent) {
		dragging = false;
		(e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
	}

	function fmt(n: number) {
		return n.toFixed(2);
	}
</script>

<div class="unitcircle-primitive" data-test="unitcircle-primitive">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {SIZE} {SIZE}"
		class="circle"
		role="img"
		aria-label="Unit circle with draggable point"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<line
			x1={0}
			y1={ORIGIN_Y}
			x2={SIZE}
			y2={ORIGIN_Y}
			stroke="var(--ivory-muted)"
			stroke-width="0.5"
		/>
		<line
			x1={ORIGIN_X}
			y1={0}
			x2={ORIGIN_X}
			y2={SIZE}
			stroke="var(--ivory-muted)"
			stroke-width="0.5"
		/>
		<circle
			cx={ORIGIN_X}
			cy={ORIGIN_Y}
			r={R}
			fill="none"
			stroke="var(--teal)"
			stroke-width="1.5"
		/>
		<!-- projection shadow x -->
		<line
			x1={ptX}
			y1={ptY}
			x2={ptX}
			y2={ORIGIN_Y}
			stroke="var(--brass)"
			stroke-width="1"
			stroke-dasharray="3 3"
			opacity="0.7"
			data-test="proj-x"
		/>
		<!-- projection shadow y -->
		<line
			x1={ptX}
			y1={ptY}
			x2={ORIGIN_X}
			y2={ptY}
			stroke="var(--brass)"
			stroke-width="1"
			stroke-dasharray="3 3"
			opacity="0.7"
			data-test="proj-y"
		/>
		<!-- radius -->
		<line x1={ORIGIN_X} y1={ORIGIN_Y} x2={ptX} y2={ptY} stroke="var(--brass)" stroke-width="2" />
		<!-- origin -->
		<circle cx={ORIGIN_X} cy={ORIGIN_Y} r="3" fill="var(--ivory)" />
		<!-- draggable point -->
		<circle
			cx={ptX}
			cy={ptY}
			r="9"
			fill="var(--brass-bright)"
			stroke="var(--ivory)"
			stroke-width="1"
			data-test="circle-point"
		/>
	</svg>
	<div class="readouts">
		<span data-test="theta-readout">θ = {fmt(theta)} rad</span>
		<span data-test="cos-readout">cos(θ) = {fmt(cosVal)}</span>
		<span data-test="sin-readout">sin(θ) = {fmt(sinVal)}</span>
	</div>
	{#if interacted}
		<p class="narrator" data-test="narrator">
			Sine and cosine are just where the dot lives, projected onto the axes.
		</p>
	{/if}
</div>

<style>
	.unitcircle-primitive {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		align-items: stretch;
	}
	.circle {
		width: 100%;
		max-width: 320px;
		height: auto;
		display: block;
		margin: 0 auto;
		background: rgba(13, 21, 24, 0.5);
		border: 1px solid var(--teal);
		touch-action: none;
		cursor: crosshair;
	}
	.readouts {
		display: flex;
		gap: 1.25rem;
		justify-content: center;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
		color: var(--brass-bright);
	}
	.narrator {
		text-align: center;
		font-style: italic;
		color: var(--ivory-muted);
		font-size: 0.9rem;
		margin: 0.4rem 0 0;
	}
</style>
