<script lang="ts">
	import { untrack } from 'svelte';
	// Pre-run setup: N + T sliders, in-world copy, begin button.
	// Phase entry to the Last Receiver game. PRD #18 ISC-6/7/8.
	interface Props {
		initialN?: number;
		initialT?: number;
		onBegin: (N: number, T: number) => void;
	}
	let { initialN = 12, initialT = 7, onBegin }: Props = $props();

	let N = $state(untrack(() => initialN));
	let T = $state(untrack(() => initialT));

	function begin() {
		onBegin(N, T);
	}
</script>

<section class="threshold" data-test="threshold">
	<header>
		<h2>Step onto the floor-glyph</h2>
		<p class="kicker">
			Inhabit the clockwork memory-engine. Survivors will dictate their last
			words. After the dictation, command will ask what you remember.
		</p>
	</header>

	<div class="lore">
		<p>
			A signal-watchtower in the besieged hour. The wireless that holds the city's
			last messages is <em>you</em> — a brass-and-teal vessel with a ring of
			memory-dials. Every transmission stirs every dial; older words fade as new
			words arrive.
		</p>
		<p>
			Set your capacity (<strong>N</strong> dials) and the dictation length
			(<strong>T</strong> transmissions). When you're ready, step on the glyph.
		</p>
	</div>

	<div class="controls">
		<label class="slider" for="threshold-N">
			<span class="label-row">
				<span class="label-text">Capacity (N memory-dials)</span>
				<span class="value" data-test="threshold-N-value">{N}</span>
			</span>
			<input
				id="threshold-N"
				type="range"
				min="4"
				max="32"
				step="1"
				bind:value={N}
				aria-describedby="threshold-N-desc"
				data-test="threshold-N"
			/>
			<span id="threshold-N-desc" class="hint">
				4 = severe bottleneck · 32 = roomy memory
			</span>
		</label>

		<label class="slider" for="threshold-T">
			<span class="label-row">
				<span class="label-text">Dictation length (T transmissions)</span>
				<span class="value" data-test="threshold-T-value">{T}</span>
			</span>
			<input
				id="threshold-T"
				type="range"
				min="3"
				max="15"
				step="1"
				bind:value={T}
				aria-describedby="threshold-T-desc"
				data-test="threshold-T"
			/>
			<span id="threshold-T-desc" class="hint">
				3 = quick burst · 15 = a long siege
			</span>
		</label>
	</div>

	<button
		type="button"
		class="begin"
		data-test="threshold-begin"
		onclick={begin}
		aria-label="Begin the simulation with N={N} and T={T}"
	>
		<span class="glyph" aria-hidden="true">◇</span>
		<span class="begin-label">step on the floor-glyph</span>
	</button>
</section>

<style>
	.threshold {
		max-width: 60ch;
		margin: 0 auto;
		padding: 1.5rem 1.75rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.55);
		color: var(--ivory-muted);
		line-height: 1.55;
	}
	.threshold header h2 {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
	}
	.kicker {
		margin: 0 0 1rem;
		font-style: italic;
		font-size: 0.95rem;
	}
	.lore p {
		margin: 0 0 0.75rem;
	}
	.lore strong {
		color: var(--ivory);
	}
	.lore em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.controls {
		display: grid;
		gap: 1rem;
		margin: 1.25rem 0;
		padding: 1rem 1.1rem;
		background: rgba(13, 21, 24, 0.55);
		border-top: 1px dashed var(--teal);
		border-bottom: 1px dashed var(--teal);
	}
	.slider {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}
	.label-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.label-text {
		color: var(--ivory);
	}
	.value {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		font-size: 1rem;
	}
	.slider input[type='range'] {
		accent-color: var(--brass);
		width: 100%;
	}
	.slider input[type='range']:focus-visible {
		outline: 2px solid var(--brass-bright);
		outline-offset: 3px;
	}
	.hint {
		font-size: 0.8rem;
		color: var(--ivory-muted);
		font-style: italic;
	}
	.begin {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		margin-top: 0.5rem;
		padding: 0.85rem 1.5rem;
		background: transparent;
		border: 1px solid var(--brass);
		color: var(--brass-bright);
		font-family: inherit;
		font-size: 0.95rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		cursor: pointer;
		transition: background 200ms ease;
	}
	.begin:hover,
	.begin:focus-visible {
		background: rgba(176, 137, 64, 0.15);
		outline: none;
	}
	.begin:focus-visible {
		outline: 2px solid var(--brass-bright);
		outline-offset: 3px;
	}
	.glyph {
		color: var(--ivory);
		font-size: 1.2rem;
	}
</style>
