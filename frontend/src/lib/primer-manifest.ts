import type { Snippet } from 'svelte';
import { createRawSnippet } from 'svelte';

import LogitsInteraction from './primer-interactions/LogitsInteraction.svelte';
import SoftmaxInteraction from './primer-interactions/SoftmaxInteraction.svelte';
import CrossEntropyInteraction from './primer-interactions/CrossEntropyInteraction.svelte';
import WeightDecayInteraction from './primer-interactions/WeightDecayInteraction.svelte';
import ActivationPatchingInteraction from './primer-interactions/ActivationPatchingInteraction.svelte';

export type PrimerEntry = {
	term: string;
	headline: string;
	/** Plain prose explainer (1-3 short sentences). */
	body: () => Snippet | string;
	/** Interactive widget. MUST return a non-null Snippet for this slice. */
	interaction: () => Snippet | null;
};

// Tiny helper: wrap a static HTML body string into a Svelte snippet
// so the manifest's body() can be uniformly invoked from a component.
function htmlBody(html: string): () => Snippet {
	return () => createRawSnippet(() => ({ render: () => html })) as unknown as Snippet;
}

// Wrap an interactive Svelte component as a snippet. We expose the component
// itself via createRawSnippet's render hatch so the consumer can mount it.
// For prototype simplicity we render a placeholder element with a data
// attribute identifying which interaction to mount; the Primer component
// reads this and instantiates the real interactive widget.
function widgetSnippet(slot: string): () => Snippet {
	return () =>
		createRawSnippet(() => ({
			render: () => `<div data-primer-interaction="${slot}"></div>`
		})) as unknown as Snippet;
}

export const primerManifest: PrimerEntry[] = [
	{
		term: 'logits',
		headline: 'Logits — raw scores before softmax',
		body: htmlBody(
			'A model emits one real-valued score (a "logit") per vocabulary token. Whichever logit is largest — the <em>argmax</em> — is the model’s top prediction.'
		),
		interaction: widgetSnippet('logits')
	},
	{
		term: 'softmax',
		headline: 'Softmax — turning scores into a distribution',
		body: htmlBody(
			'Softmax exponentiates the logits and normalizes them. A <em>temperature</em> of 1 is the default; lower temperatures sharpen the distribution toward the argmax, higher temperatures flatten it.'
		),
		interaction: widgetSnippet('softmax')
	},
	{
		term: 'cross-entropy',
		headline: 'Cross-entropy — the loss for a probability',
		body: htmlBody(
			'Cross-entropy loss for a single example is <code>−log p</code>, where <code>p</code> is the probability the model assigned to the correct answer. As <code>p → 1</code> the loss → 0; as <code>p → 0</code> the loss explodes.'
		),
		interaction: widgetSnippet('cross-entropy')
	},
	{
		term: 'weight decay',
		headline: 'Weight decay — pulling weights toward zero',
		body: htmlBody(
			'AdamW adds <code>−λ w</code> to each weight’s update, gently shrinking weights every step. Higher <code>λ</code> means stronger regularization — Nanda’s grokking config uses an unusually large <code>λ=1.0</code>.'
		),
		interaction: widgetSnippet('weight decay')
	},
	{
		term: 'activation patching',
		headline: 'Activation patching — swap one cell across two passes',
		body: htmlBody(
			'Run the model on a <em>source</em> input and a <em>target</em> input. Then re-run the target pass while overwriting one activation with its source-pass value. The change in output tells you what that activation <em>causally</em> carries.'
		),
		interaction: widgetSnippet('activation patching')
	}
];

export function getPrimer(term: string): PrimerEntry | undefined {
	return primerManifest.find((e) => e.term === term);
}

// Map slot names -> components for the Primer wrapper to mount the
// real interactive widget after the placeholder is rendered.
export const interactionComponents = {
	logits: LogitsInteraction,
	softmax: SoftmaxInteraction,
	'cross-entropy': CrossEntropyInteraction,
	'weight decay': WeightDecayInteraction,
	'activation patching': ActivationPatchingInteraction
} as const;

export type InteractionSlot = keyof typeof interactionComponents;
