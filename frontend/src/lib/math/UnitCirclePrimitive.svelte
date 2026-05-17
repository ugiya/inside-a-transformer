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

	<aside class="explainer" data-test="unitcircle-explainer">
		<h3>What is this teaching?</h3>
		<p>
			A <strong>unit circle</strong> is a circle of <em>radius 1</em>, centered at the
			origin <code>(0, 0)</code>. That's the whole definition. "Unit" = "of size 1."
			Drag the brass dot — it slides around the circumference. The dashed lines drop
			its position onto the x-axis and the y-axis.
		</p>

		<h3>How sin and cos hide here</h3>
		<p>
			For any point on the unit circle at angle <code>θ</code> (measured
			counter-clockwise from the positive x-axis):
		</p>
		<ul>
			<li>
				<strong><code>cos(θ)</code></strong> = the point's <em>x-coordinate</em>.
				That's the horizontal dashed shadow.
			</li>
			<li>
				<strong><code>sin(θ)</code></strong> = the point's <em>y-coordinate</em>.
				The vertical dashed shadow.
			</li>
		</ul>
		<p>
			This is <em>the actual definition</em> of sin and cos. Every wave you saw in the
			previous primitive was just one of those coordinates plotted as the angle
			changes. The circle <strong>is</strong> sin and cos; the waves were just one
			projection of that motion over time.
		</p>

		<h3>Why does this lab care about the unit circle?</h3>
		<p>
			Because the trained model encodes the 113 integers <em>literally on this
			circle</em> (and on four other rotating wheels at different speeds). Specifically:
		</p>
		<ul>
			<li>
				For each integer <code>n ∈ {'{'}0, 1, ..., 112{'}'}</code> and each frequency
				<code>k ∈ {'{'}14, 35, 41, 42, 52{'}'}</code>, the model places a point at angle
				<code>θ = 2πk·n / 113</code> on a unit circle.
			</li>
			<li>
				When the model sees the inputs <code>a</code> and <code>b</code>, it
				<em>rotates</em> their angles by each other's amount — that's how addition
				becomes "add the angles."
			</li>
			<li>
				The 5 different <code>k</code> values are 5 different unit circles spinning at
				different speeds. The model uses all 5 simultaneously, like a clock with
				five hands.
			</li>
		</ul>
		<p>
			In 🌱 Embedding Garden you saw the right panel arrange 113 dots into a ring at
			step 39999 — <em>that ring is exactly this unit circle</em>, rediscovered by the
			model from training data alone. The seed of the entire lab finale is sitting in
			this primitive.
		</p>

		<p class="forward">
			Forward: every wheel, ring, and rotation you'll see — the 113 vessels in the
			Garden, the attention heads in the Hall, the Fourier wheels in Room 8 — is a
			version of this circle. Same shape, repeated five times at different
			frequencies, doing all the math.
		</p>
	</aside>
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
	.explainer {
		max-width: 64ch;
		margin: 0.75rem auto 0;
		padding: 1rem 1.25rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.9rem;
		line-height: 1.55;
	}
	.explainer h3 {
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--ivory);
		margin: 0.75rem 0 0.4rem;
	}
	.explainer h3:first-child {
		margin-top: 0;
	}
	.explainer p {
		margin: 0 0 0.5rem;
	}
	.explainer ul {
		margin: 0.25rem 0 0.5rem 1.25rem;
		padding: 0;
	}
	.explainer ul li {
		margin-bottom: 0.4rem;
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
	.explainer .forward {
		font-size: 0.85rem;
		font-style: italic;
		border-top: 1px dashed var(--teal);
		padding-top: 0.6rem;
		margin-top: 0.6rem;
	}
</style>
