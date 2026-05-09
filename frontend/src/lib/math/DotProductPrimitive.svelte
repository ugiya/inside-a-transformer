<script lang="ts">
	// P3 — Dot product: two arrows from origin. Drag either head; live readouts of
	// a · b, angle θ between them, and an alignment caption color-coded by sign.
	const SIZE = 360;
	const ORIGIN_X = SIZE / 2;
	const ORIGIN_Y = SIZE / 2;
	const UNIT = 60;

	// Math-coord tips (origin-relative; math-y up = +).
	let aTipX = $state(150); // 2.5 units right
	let aTipY = $state(60); // 1.0 unit up
	let bTipX = $state(60); // 1.0 unit right
	let bTipY = $state(150); // 2.5 units up
	let dragging = $state<null | 'a' | 'b'>(null);
	let svgEl: SVGSVGElement | null = $state(null);

	const aMath = $derived({ x: aTipX / UNIT, y: aTipY / UNIT });
	const bMath = $derived({ x: bTipX / UNIT, y: bTipY / UNIT });
	const dot = $derived(aMath.x * bMath.x + aMath.y * bMath.y);
	const aMag = $derived(Math.sqrt(aMath.x * aMath.x + aMath.y * aMath.y) || 1e-9);
	const bMag = $derived(Math.sqrt(bMath.x * bMath.x + bMath.y * bMath.y) || 1e-9);
	const cosTheta = $derived(Math.max(-1, Math.min(1, dot / (aMag * bMag))));
	const thetaDeg = $derived((Math.acos(cosTheta) * 180) / Math.PI);

	const sign = $derived<'positive' | 'zero' | 'negative'>(
		Math.abs(dot) < 1e-3 ? 'zero' : dot > 0 ? 'positive' : 'negative'
	);
	const caption = $derived(
		sign === 'positive' ? 'aligned' : sign === 'negative' ? 'opposed' : 'perpendicular'
	);

	function fmt(n: number) {
		return n.toFixed(2);
	}
	const term1 = $derived(aMath.x * bMath.x);
	const term2 = $derived(aMath.y * bMath.y);

	function clientToMath(clientX: number, clientY: number) {
		if (!svgEl) return { x: 0, y: 0 };
		const rect = svgEl.getBoundingClientRect();
		const sx = ((clientX - rect.left) / rect.width) * SIZE;
		const sy = ((clientY - rect.top) / rect.height) * SIZE;
		return { x: sx - ORIGIN_X, y: ORIGIN_Y - sy };
	}

	function startDrag(which: 'a' | 'b') {
		return (e: PointerEvent) => {
			dragging = which;
			(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
			const m = clientToMath(e.clientX, e.clientY);
			if (which === 'a') {
				aTipX = m.x;
				aTipY = m.y;
			} else {
				bTipX = m.x;
				bTipY = m.y;
			}
		};
	}
	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const m = clientToMath(e.clientX, e.clientY);
		if (dragging === 'a') {
			aTipX = m.x;
			aTipY = m.y;
		} else {
			bTipX = m.x;
			bTipY = m.y;
		}
	}
	function endDrag(e: PointerEvent) {
		dragging = null;
		(e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
	}

	const aHead = $derived({ x: ORIGIN_X + aTipX, y: ORIGIN_Y - aTipY });
	const bHead = $derived({ x: ORIGIN_X + bTipX, y: ORIGIN_Y - bTipY });
</script>

<div class="dotprod-primitive" data-test="dotprod-primitive">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {SIZE} {SIZE}"
		class="plane"
		role="img"
		aria-label="Two draggable arrows for dot product"
		onpointermove={onPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
	>
		<line x1={0} y1={ORIGIN_Y} x2={SIZE} y2={ORIGIN_Y} stroke="var(--ivory-muted)" stroke-width="1" />
		<line x1={ORIGIN_X} y1={0} x2={ORIGIN_X} y2={SIZE} stroke="var(--ivory-muted)" stroke-width="1" />
		<circle cx={ORIGIN_X} cy={ORIGIN_Y} r="4" fill="var(--ivory)" />
		<!-- arrow a -->
		<line
			x1={ORIGIN_X}
			y1={ORIGIN_Y}
			x2={aHead.x}
			y2={aHead.y}
			stroke="var(--brass)"
			stroke-width="2"
			data-test="arrow-a-shaft"
		/>
		<circle
			cx={aHead.x}
			cy={aHead.y}
			r="9"
			fill="var(--brass-bright)"
			stroke="var(--ivory)"
			stroke-width="1"
			onpointerdown={startDrag('a')}
			role="slider"
			aria-label="Drag arrow a"
			aria-valuenow={Math.round(thetaDeg)}
			tabindex="0"
			data-test="arrow-a-head"
		/>
		<text x={aHead.x + 10} y={aHead.y - 6} fill="var(--brass-bright)" font-size="12">a</text>
		<!-- arrow b -->
		<line
			x1={ORIGIN_X}
			y1={ORIGIN_Y}
			x2={bHead.x}
			y2={bHead.y}
			stroke="var(--ivory)"
			stroke-width="2"
			data-test="arrow-b-shaft"
		/>
		<circle
			cx={bHead.x}
			cy={bHead.y}
			r="9"
			fill="var(--ivory)"
			stroke="var(--brass-bright)"
			stroke-width="1"
			onpointerdown={startDrag('b')}
			role="slider"
			aria-label="Drag arrow b"
			aria-valuenow={Math.round(thetaDeg)}
			tabindex="0"
			data-test="arrow-b-head"
		/>
		<text x={bHead.x + 10} y={bHead.y - 6} fill="var(--ivory)" font-size="12">b</text>
	</svg>
	<div class="vectors">
		<div class="vec a">a = ({fmt(aMath.x)}, {fmt(aMath.y)})</div>
		<div class="vec b">b = ({fmt(bMath.x)}, {fmt(bMath.y)})</div>
	</div>
	<div class="formula" data-test="dot-formula">
		a · b
		<span class="op">=</span>
		<span class="term">a₁·b₁</span>
		<span class="op">+</span>
		<span class="term">a₂·b₂</span>
		<span class="op">=</span>
		<span class="term">({fmt(aMath.x)})·({fmt(bMath.x)})</span>
		<span class="op">+</span>
		<span class="term">({fmt(aMath.y)})·({fmt(bMath.y)})</span>
		<span class="op">=</span>
		<span class="term">{fmt(term1)} + {fmt(term2)}</span>
		<span class="op">=</span>
		<span class="result" class:pos={sign === 'positive'} class:neg={sign === 'negative'}>{fmt(dot)}</span>
	</div>
	<div class="readouts">
		<span class="dot" class:pos={sign === 'positive'} class:neg={sign === 'negative'} data-test="dot-value"
			>a · b = {dot.toFixed(2)}</span
		>
		<span data-test="theta-value">θ = {thetaDeg.toFixed(0)}°</span>
		<span class="caption" data-test="dot-caption">{caption}</span>
	</div>
	<p class="hint">
		Multiply the matching components, then add. Drag either arrowhead — the formula updates live.
		The sign of <code>a·b</code> tells you whether the arrows are pointing in similar directions
		(positive), opposite directions (negative), or at right angles (zero).
	</p>

	<aside class="explainer" data-test="dot-explainer">
		<h3>What is this teaching?</h3>
		<p>
			The <strong>dot product</strong> takes two vectors and produces a <em>single number</em>.
			That number measures how <strong>aligned</strong> the two vectors are:
		</p>
		<ul>
			<li><code>a · b</code> &gt; 0 → arrows point similar directions</li>
			<li><code>a · b</code> = 0 → perpendicular (no shared direction)</li>
			<li><code>a · b</code> &lt; 0 → opposite directions</li>
		</ul>
		<h3>Why does this lab care about dot products?</h3>
		<p>
			Dot products are <strong>everywhere</strong> in a transformer:
		</p>
		<ul>
			<li>
				<strong>Attention scores</strong> (👁 Attention Hall) are dot products: each
				token's <em>query vector</em> dotted with every other token's <em>key vector</em>.
				Aligned Q/K → high score → "pay attention here."
			</li>
			<li>
				<strong>Every neuron's output</strong> is a dot product: row of weights dotted
				with the input vector. (See P3 next — matrix×vector is just a stack of dot
				products.)
			</li>
			<li>
				<strong>Token similarity</strong> (🌱 Embedding Garden) is measured by dot
				products. After training, the embeddings of <code>3</code> and
				<code>5</code> point in similar directions because they're "near" in the
				model's mental map.
			</li>
		</ul>
		<p class="forward">
			Forward: this number — alignment, computed by multiply-and-sum — is the most-used
			operation in the entire model.
		</p>
	</aside>
</div>

<style>
	.dotprod-primitive {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
	}
	.plane circle[data-test$='-head'] {
		cursor: grab;
	}
	.readouts {
		display: flex;
		gap: 1.25rem;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	.dot {
		color: var(--ivory-muted);
	}
	.dot.pos {
		color: var(--brass-bright);
	}
	.dot.neg {
		color: #d96a6a;
	}
	.caption {
		font-style: italic;
		color: var(--ivory-muted);
	}
	.vectors {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
	}
	.vec.a {
		color: var(--brass-bright);
	}
	.vec.b {
		color: var(--ivory);
	}
	.formula {
		text-align: center;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.95rem;
		color: var(--ivory);
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 0.5rem;
		background: rgba(13, 21, 24, 0.6);
		border: 1px solid var(--teal);
	}
	.formula .op {
		color: var(--ivory-muted);
	}
	.formula .term {
		color: var(--ivory);
	}
	.formula .result {
		color: var(--ivory-muted);
		font-weight: 600;
	}
	.formula .result.pos {
		color: var(--brass-bright);
	}
	.formula .result.neg {
		color: #d96a6a;
	}
	.hint {
		max-width: 50ch;
		margin: 0.5rem auto 0;
		text-align: center;
		font-size: 0.85rem;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.hint code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.05em 0.3em;
		color: var(--brass-bright);
	}
	.explainer {
		max-width: 64ch;
		margin: 0.5rem auto 0;
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
		margin-bottom: 0.3rem;
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
