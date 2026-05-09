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
		<h3>What is a dot product, exactly?</h3>
		<p>
			A <strong>dot product</strong> is an operation that takes <em>two vectors</em>
			and produces <em>one single number</em>. Notation: <code>a · b</code> (read
			"a dot b"). The single number tells you something about the relationship between
			the two arrows. Concretely, that "something" is called <strong>alignment</strong>.
			This panel earns that name, not just asserts it.
		</p>

		<h3>Two equivalent formulas — the magic trick</h3>
		<p>
			The same number <code>a · b</code> can be computed two completely different ways.
			Both ways always agree. <em>That's the whole reason this operation is
			interesting.</em>
		</p>

		<p><strong>Formula 1 — the algebra view:</strong></p>
		<pre class="dpformula"><span>a · b  =  a₁·b₁  +  a₂·b₂  +  ...  +  aₙ·bₙ</span>
<span>       └─ multiply matching components, then add ─┘</span></pre>
		<p>
			This is the <em>recipe</em> — the formula bar above shows exactly this for the
			two arrows you're dragging. It's how computers actually compute dot products:
			fast, no trig needed.
		</p>

		<p><strong>Formula 2 — the geometry view:</strong></p>
		<pre class="dpformula"><span>a · b  =  |a|  ·  |b|  ·  cos(θ)</span>
<span>          ↑      ↑     ↑</span>
<span>       length length  cosine of the angle</span>
<span>       of a    of b   between the two arrows</span></pre>
		<p>
			This is the <em>meaning</em> — what the number actually represents geometrically.
			And here's where <strong>alignment</strong> finally earns its name:
		</p>
		<ul>
			<li>
				When the arrows point the <strong>same direction</strong>: angle θ = 0°,
				<code>cos(θ) = 1</code>. Dot product is at its <em>maximum</em>
				(= product of the two lengths). Maximum alignment → maximum dot product.
			</li>
			<li>
				When the arrows are <strong>perpendicular</strong> (right angle): θ = 90°,
				<code>cos(θ) = 0</code>. Dot product = <em>0</em>. Zero alignment → zero
				dot product.
			</li>
			<li>
				When the arrows point <strong>opposite directions</strong>: θ = 180°,
				<code>cos(θ) = −1</code>. Dot product is at its <em>minimum</em>
				(= negative of product of lengths). Anti-aligned → most negative.
			</li>
		</ul>
		<p>
			<strong>That's why we call it "alignment".</strong> The dot product literally
			scales with <code>cos(θ)</code>, and <code>cos(θ)</code> IS a measure of
			alignment — it's the geometric definition. So <em>"how aligned are the
			arrows?"</em> is a fair English translation of <code>a · b</code>.
		</p>

		<p>
			The miracle — and the reason this is the most useful operation in ML — is that
			the two formulas always agree. You can compute "alignment between two arrows"
			using just a handful of multiplications and additions
			(Formula&nbsp;1) — without ever computing an angle, a length, or a cosine.
			Cheap and meaningful at the same time.
		</p>

		<h3>Try it</h3>
		<ol>
			<li>
				Drag the arrows so they point in the <em>same</em> direction. Watch
				<code>a · b</code> in the formula bar — it goes to its maximum positive
				value. The angle <code>θ</code> in the readout drops toward 0°.
			</li>
			<li>
				Drag them so they're <em>perpendicular</em> (90° between them). Watch
				<code>a · b</code> drop to ≈ 0. The algebra says it (matching components
				cancel), and the geometry says it (cos 90° = 0). Same number, two reasons.
			</li>
			<li>
				Drag one to point <em>opposite</em> the other. <code>a · b</code> goes
				negative; <code>θ</code> approaches 180°.
			</li>
		</ol>

		<h3>Wait — is dot product the same as matrix multiplication?</h3>
		<p>
			Almost, and this is worth nailing down because the names blur. There's a
			<em>family</em> of "multiplication-like" operations on vectors and matrices, all
			built out of the dot product:
		</p>
		<table class="ops">
			<thead>
				<tr><th>Operation</th><th>Inputs</th><th>Output</th><th>How it's built</th></tr>
			</thead>
			<tbody>
				<tr>
					<td>scalar × scalar</td>
					<td>3 × 4</td>
					<td>a number (12)</td>
					<td>regular multiplication</td>
				</tr>
				<tr class="atom">
					<td><strong>vector · vector</strong> (this primitive)</td>
					<td><code>a · b</code></td>
					<td><strong>one number</strong></td>
					<td>multiply matching pairs, sum</td>
				</tr>
				<tr>
					<td>matrix × vector (next primitive, P3)</td>
					<td><code>A · x</code></td>
					<td>a vector</td>
					<td>one dot product per row of A</td>
				</tr>
				<tr>
					<td>matrix × matrix</td>
					<td><code>A · B</code></td>
					<td>a matrix</td>
					<td>one dot product per (row of A, column of B) pair</td>
				</tr>
			</tbody>
		</table>
		<p>
			<strong>Dot product is the <em>atom</em>.</strong> Matrix × vector and matrix × matrix
			are constructions built from dot products. So when you understand alignment
			(this primitive), you understand the building block of every "multiplication-like"
			operation in linear algebra and every layer in every neural network.
		</p>

		<h3>Why does this lab care?</h3>
		<p>
			Because <strong>alignment = match score</strong>, and ML is mostly the business
			of computing match scores. Every place a neural network "decides" something, a
			dot product is being computed:
		</p>
		<ul>
			<li>
				👁 <strong>Attention scores</strong>: "how relevant is THIS key to MY
				query?" Answer = <code>query · key</code>. High alignment → high relevance →
				"pay attention to this token." Every transformer attention head is computing
				dot products between Q and K vectors.
			</li>
			<li>
				🔥 <strong>Every neuron's output</strong>: "does my input MATCH the pattern I
				was trained to detect?" A neuron's weights <em>are</em> its pattern. The dot
				product <code>weights · input</code> measures how aligned the input is with
				that pattern. Aligned → neuron fires.
			</li>
			<li>
				🌱 <strong>Token similarity</strong>: "are these two tokens similar in
				meaning?" Compute <code>embedding(a) · embedding(b)</code>. High alignment
				→ similar. After training, the embeddings of <code>3</code> and
				<code>5</code> point in similar directions because they participate in
				similar sums modulo 113 — the model literally encodes their kinship as
				geometric alignment.
			</li>
			<li>
				🌀 <strong>Fourier circuits</strong> (Room 8 punchline): the way the trained
				model uses sin/cos features is by taking <em>dot products</em> between
				token-position vectors and learned frequency directions. Every Fourier
				coefficient in the final reveal is a dot product.
			</li>
		</ul>

		<p class="forward">
			Forward: when you next see <code>a · b</code>, you can read it three ways at
			once — "multiply matching pairs and sum" (algebra), "how aligned are these"
			(geometry), and "what's the match score" (ML). Same number. Three names. The
			most-used operation in the entire model.
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
	.explainer ol {
		margin: 0.25rem 0 0.5rem 1.25rem;
		padding: 0;
	}
	.explainer ol li {
		margin-bottom: 0.4rem;
	}
	.explainer .dpformula {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		background: rgba(13, 21, 24, 0.6);
		padding: 0.7rem 0.9rem;
		margin: 0.25rem 0 0.5rem;
		font-size: 0.85rem;
		line-height: 1.55;
		white-space: pre;
		overflow-x: auto;
	}
	.explainer .dpformula span {
		display: block;
	}
	.explainer table.ops {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		margin: 0.5rem 0;
	}
	.explainer table.ops th,
	.explainer table.ops td {
		border: 1px solid var(--teal);
		padding: 0.4rem 0.6rem;
		text-align: left;
		vertical-align: top;
	}
	.explainer table.ops th {
		color: var(--brass-bright);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.78rem;
		background: rgba(13, 21, 24, 0.5);
	}
	.explainer table.ops tr.atom td {
		background: rgba(176, 137, 64, 0.1);
		border-color: var(--brass);
	}
	.explainer table.ops code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
	}
</style>
