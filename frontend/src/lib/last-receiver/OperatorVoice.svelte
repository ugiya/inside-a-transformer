<script lang="ts">
	// Command's voice framing for the debrief — radio-static speech-bubble
	// pattern, brass-tinted typewriter font. NOT an academic-quiz UI.
	// PRD #18 ISC-22.
	import type { Snippet } from 'svelte';
	interface Props {
		children: Snippet;
		callsign?: string;
	}
	let { children, callsign = 'command' }: Props = $props();
</script>

<div class="operator" data-test="operator-voice" role="group" aria-label="command transmission">
	<div class="meta" aria-hidden="true">
		<span class="dot"></span>
		<span class="callsign">— {callsign}</span>
		<span class="static" aria-hidden="true">·· · ··</span>
	</div>
	<div class="bubble">
		{@render children()}
	</div>
</div>

<style>
	.operator {
		max-width: 56ch;
		margin: 0 auto;
		padding: 0;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--brass-bright);
		opacity: 0.85;
		margin-bottom: 0.4rem;
	}
	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background: var(--brass-bright);
		box-shadow: 0 0 6px var(--brass-bright);
		animation: pulse 1.6s ease-in-out infinite;
	}
	@keyframes pulse {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}
	@media (prefers-reduced-motion: reduce) {
		.dot { animation: none; }
	}
	.static {
		margin-left: auto;
		opacity: 0.5;
	}
	.bubble {
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--ivory);
		padding: 1rem 1.25rem;
		border: 1px solid var(--brass);
		border-radius: 2px;
		background: rgba(13, 21, 24, 0.65);
		position: relative;
	}
	.bubble::before {
		content: '';
		position: absolute;
		top: -0.5rem;
		left: 1.5rem;
		width: 0.85rem;
		height: 0.85rem;
		background: rgba(13, 21, 24, 0.65);
		border-left: 1px solid var(--brass);
		border-top: 1px solid var(--brass);
		transform: rotate(45deg);
	}
</style>
