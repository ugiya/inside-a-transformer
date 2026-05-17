<script lang="ts">
	// One incoming transmission — the word arrives, splashes into the body.
	// Atomic component. Driven by `word` prop changing; mounts a fresh element
	// per word via {#key word} in the parent so the entry animation re-fires.
	// PRD #18 ISC-12 (partial; captions land in slice #23).
	interface Props {
		word: string;
		type?: 'tactical' | 'personal';
		position?: number;
		total?: number;
	}
	let { word, type, position, total }: Props = $props();
</script>

<div class="transmission" data-test="transmission" data-word={word} data-type={type}>
	<div class="frame">
		<span class="counter" aria-hidden="true">
			{#if position !== undefined && total !== undefined}
				transmission {position + 1} / {total}
			{/if}
		</span>
		<span class="word" data-test="transmission-word">{word}</span>
	</div>
	<div class="splash" aria-hidden="true"></div>
</div>

<style>
	.transmission {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.65rem 1rem;
		min-height: 5rem;
	}
	.frame {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		animation: slideIn 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	.counter {
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--ivory-muted);
	}
	.word {
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 1.45rem;
		color: var(--ivory);
		letter-spacing: 0.08em;
	}
	.transmission[data-type='tactical'] .word {
		color: var(--brass-bright);
	}
	.transmission[data-type='personal'] .word {
		color: #cde2c8;
	}
	.splash {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--brass-bright);
		opacity: 0;
		animation: splash 900ms ease-out 350ms both;
	}
	@keyframes slideIn {
		from {
			transform: translateY(-12px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	@keyframes splash {
		0% {
			transform: scale(1);
			opacity: 0.9;
		}
		100% {
			transform: scale(36);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.frame {
			animation: none;
			opacity: 1;
		}
		.splash {
			animation: none;
			opacity: 0;
		}
	}
</style>
