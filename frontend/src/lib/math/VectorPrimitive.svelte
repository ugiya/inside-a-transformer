<script lang="ts">
	// P1 — Vector: drag-the-tip on a 2D plane. Components and magnitude live-update.
	// Coords: SVG pixels. We map SVG-pixel offsets from origin to math units 1:1
	// (60px per unit) so a tip at (180, -60) px from origin reads as (3.0, 1.0).
	const SIZE = 360;
	const ORIGIN_X = SIZE / 2;
	const ORIGIN_Y = SIZE / 2;
	const UNIT = 60;

	let tipX = $state(180); // px offset from origin (right is +)
	let tipY = $state(-90); // px offset from origin (up is +, i.e., screen-y inverted)
	let dragging = $state(false);
	let svgEl: SVGSVGElement | null = $state(null);

	const compX = $derived(tipX / UNIT);
	const compY = $derived(tipY / UNIT);
	const compXsq = $derived(compX * compX);
	const compYsq = $derived(compY * compY);
	const sumSq = $derived(compXsq + compYsq);
	const magnitude = $derived(Math.sqrt(sumSq));

	// Display screen-y (where the head circle is drawn): origin minus tipY (since
	// math-y up is screen-y down).
	const headSx = $derived(ORIGIN_X + tipX);
	const headSy = $derived(ORIGIN_Y - tipY);

	function clientToTip(clientX: number, clientY: number) {
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		// Map client coords to SVG viewBox coords (uniform aspect — SIZE×SIZE viewbox).
		const sx = ((clientX - rect.left) / rect.width) * SIZE;
		const sy = ((clientY - rect.top) / rect.height) * SIZE;
		tipX = sx - ORIGIN_X;
		tipY = ORIGIN_Y - sy;
	}

	function onPointerDown(e: PointerEvent) {
		dragging = true;
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
		clientToTip(e.clientX, e.clientY);
	}
	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		clientToTip(e.clientX, e.clientY);
	}
	function onPointerUp(e: PointerEvent) {
		dragging = false;
		(e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
	}

	function fmt(n: number) {
		return n.toFixed(1);
	}
	function fmt2(n: number) {
		return n.toFixed(2);
	}
</script>

<div class="vector-primitive" data-test="vector-primitive">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {SIZE} {SIZE}"
		class="plane"
		role="img"
		aria-label="Draggable 2D vector"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<!-- gridlines -->
		{#each [-2, -1, 1, 2] as g (g)}
			<line
				x1={ORIGIN_X + g * UNIT}
				y1={0}
				x2={ORIGIN_X + g * UNIT}
				y2={SIZE}
				stroke="var(--teal)"
				stroke-width="0.5"
				stroke-dasharray="2 4"
			/>
			<line
				x1={0}
				y1={ORIGIN_Y - g * UNIT}
				x2={SIZE}
				y2={ORIGIN_Y - g * UNIT}
				stroke="var(--teal)"
				stroke-width="0.5"
				stroke-dasharray="2 4"
			/>
		{/each}
		<!-- axes -->
		<line x1={0} y1={ORIGIN_Y} x2={SIZE} y2={ORIGIN_Y} stroke="var(--ivory-muted)" stroke-width="1" />
		<line x1={ORIGIN_X} y1={0} x2={ORIGIN_X} y2={SIZE} stroke="var(--ivory-muted)" stroke-width="1" />
		<!-- arrow shaft -->
		<line
			x1={ORIGIN_X}
			y1={ORIGIN_Y}
			x2={headSx}
			y2={headSy}
			stroke="var(--brass)"
			stroke-width="2"
			data-test="arrow-shaft"
		/>
		<!-- origin -->
		<circle cx={ORIGIN_X} cy={ORIGIN_Y} r="4" fill="var(--ivory)" />
		<!-- arrow head (drag handle) -->
		<circle
			cx={headSx}
			cy={headSy}
			r="9"
			fill="var(--brass-bright)"
			stroke="var(--ivory)"
			stroke-width="1"
			data-test="arrow-head"
		/>
	</svg>
	<div class="readouts" data-test="vector-readouts">
		<span data-test="vec-x">x = {fmt(compX)}</span>
		<span data-test="vec-y">y = {fmt(compY)}</span>
		<span data-test="vec-mag">|v| = {fmt(magnitude)}</span>
	</div>

	<div class="explainer" data-test="vector-explainer">
		<p class="lede">
			A <strong>vector</strong> is a list of numbers — here, two: <code>(x, y)</code>.
			Geometrically, the brass arrow from origin to tip.
			<em>Every "thing" you'll meet in this lab is a vector</em> — a token, a hidden state,
			a Q/K/V — usually with more numbers (32, 100, 128…) instead of 2.
		</p>

		<p class="hint">
			<strong><code>|v|</code></strong> reads "magnitude of <code>v</code>" — just the
			<em>length</em> of the arrow. Computed by Pythagoras (yes, the school one):
		</p>

		<pre class="formula" data-test="vec-mag-formula"><span>|v| = √(x² + y²)</span>
<span>    = √({fmt(compX)}² + {fmt(compY)}²)</span>
<span>    = √({fmt2(compXsq)} + {fmt2(compYsq)})</span>
<span>    = √{fmt2(sumSq)}</span>
<span>    = {fmt(magnitude)}</span></pre>

		<p class="forward">
			Forward: vectors as <em>tokens</em> in 🌱 Embedding Garden, as <em>memory</em> in
			🕯 Hall of Memory, as <em>Q/K/V</em> in 👁 Attention Hall. Same object, new costume.
		</p>
	</div>
</div>

<style>
	.vector-primitive {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: stretch;
	}
	.plane {
		width: 100%;
		max-width: 360px;
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
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		font-size: 0.9rem;
		justify-content: center;
	}
	.explainer {
		max-width: 60ch;
		margin: 0.5rem auto 0;
		padding: 1rem 1.2rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.4);
		color: var(--ivory-muted);
		font-size: 0.92rem;
		line-height: 1.55;
	}
	.explainer p {
		margin: 0 0 0.75rem;
	}
	.explainer p:last-child {
		margin: 0;
	}
	.explainer strong {
		color: var(--ivory);
	}
	.explainer em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.explainer code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
	}
	.explainer .formula {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		background: rgba(13, 21, 24, 0.6);
		padding: 0.75rem 1rem;
		margin: 0 0 0.75rem;
		font-size: 0.88rem;
		line-height: 1.5;
		white-space: pre;
		overflow-x: auto;
	}
	.explainer .formula span {
		display: block;
	}
	.explainer .forward {
		font-size: 0.85rem;
		color: var(--ivory-muted);
		font-style: italic;
		border-top: 1px dashed var(--teal);
		padding-top: 0.75rem;
		margin-top: 0.75rem;
	}
</style>
