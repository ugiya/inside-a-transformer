<script lang="ts">
	import type { Snippet } from 'svelte';
	import { primers } from './primers.svelte';
	import {
		getPrimer,
		interactionComponents,
		type InteractionSlot
	} from './primer-manifest';

	type Props = {
		term: string;
		dismissable?: boolean;
		children?: Snippet;
	};

	let { term, dismissable = true, children }: Props = $props();

	const entry = $derived(getPrimer(term));
	const dismissed = $derived(primers.isDismissed(term));

	function dismiss() {
		primers.dismiss(term);
	}

	function isKnownSlot(t: string): t is InteractionSlot {
		return t in interactionComponents;
	}

	const InteractionComponent = $derived(
		isKnownSlot(term) ? interactionComponents[term] : null
	);
</script>

<section
	class="primer"
	class:dismissed
	data-primer
	data-term={term}
	data-dismissed={dismissed ? 'true' : 'false'}
>
	{#if !dismissed}
		<header class="head">
			<h3 class="headline" data-primer-headline>
				{entry?.headline ?? term}
			</h3>
			{#if dismissable}
				<button
					type="button"
					class="dismiss"
					data-primer-dismiss
					aria-label="Dismiss primer"
					onclick={dismiss}
				>×</button>
			{/if}
		</header>

		<div class="body" data-primer-body>
			{#if entry}
				{@const BodySnippet = entry.body()}
				{#if typeof BodySnippet === 'string'}
					<p>{@html BodySnippet}</p>
				{:else}
					{@render BodySnippet()}
				{/if}
			{:else}
				<p class="missing">No primer registered for term <code>{term}</code>.</p>
			{/if}

			{#if InteractionComponent}
				<div class="interaction" data-primer-interaction-mount>
					<InteractionComponent />
				</div>
			{/if}

			{#if children}
				<div class="children" data-primer-children>
					{@render children()}
				</div>
			{/if}
		</div>
	{/if}
</section>

<style>
	.primer {
		border: 1px solid rgba(184, 134, 75, 0.4);
		background: rgba(184, 134, 75, 0.06);
		padding: 0.75rem 1rem;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.95rem;
	}
	.primer.dismissed {
		display: none;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.headline {
		margin: 0;
		font-size: 0.95rem;
		letter-spacing: 0.02em;
		font-weight: 600;
	}
	.dismiss {
		background: transparent;
		border: 1px solid rgba(184, 134, 75, 0.4);
		color: inherit;
		font-size: 1rem;
		line-height: 1;
		width: 1.5rem;
		height: 1.5rem;
		cursor: pointer;
		border-radius: 2px;
	}
	.dismiss:hover {
		background: rgba(184, 134, 75, 0.15);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.missing {
		color: var(--ivory-muted, #aaa);
		font-style: italic;
	}
</style>
