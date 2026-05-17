<script lang="ts">
	// N-back recall sequence. Command radios in, asks T multiple-choice
	// questions in reverse order, computes accuracy curve, shows summary
	// that references each position.
	// PRD #18 ISC-18..ISC-27.
	import { untrack } from 'svelte';
	import OperatorVoice from './OperatorVoice.svelte';
	import { generateQuestions, scoreRecall, type AccuracyAtPosition } from '$lib/rnn/recall-test';
	import { PALETTE } from '$lib/rnn/transmissions';

	interface Props {
		words: readonly string[];
		seed?: number;
		onComplete: (accuracyCurve: readonly AccuracyAtPosition[]) => void;
	}
	let { words, seed = 1337, onComplete }: Props = $props();

	const questions = untrack(() =>
		generateQuestions(words, [], PALETTE, seed)
	);

	let qIdx = $state(0);
	let answers = $state<string[]>([]);
	let curve = $state<readonly AccuracyAtPosition[] | null>(null);

	const current = $derived(questions[qIdx]);
	const T = questions.length;

	function chooseAnswer(option: string) {
		if (curve) return;
		answers = [...answers, option];
		if (qIdx < T - 1) {
			qIdx += 1;
		} else {
			const scored = scoreRecall(questions, answers);
			curve = scored;
			onComplete(scored);
		}
	}

	const heldCount = $derived(
		curve ? curve.filter((c) => c.correct).length : 0
	);
	// Identify the contiguous suffix of correct answers and the contiguous
	// prefix of failures so the summary can read "words T..k clearly,
	// words j..1 lost" in operator voice.
	const heldRange = $derived.by<{ from: number; to: number } | null>(() => {
		if (!curve) return null;
		// Questions are in reverse order (last word first → first word last),
		// so the leading correct streak corresponds to the latest words.
		let streak = 0;
		while (streak < curve.length && curve[streak].correct) streak++;
		if (streak === 0) return null;
		// First streak items map to positions T-1, T-2, ..., T-streak.
		return { from: T - streak, to: T - 1 };
	});
	const lostRange = $derived.by<{ from: number; to: number } | null>(() => {
		if (!curve) return null;
		// Trailing failure streak corresponds to the earliest words.
		let streak = 0;
		while (streak < curve.length && !curve[curve.length - 1 - streak].correct)
			streak++;
		if (streak === 0) return null;
		return { from: 0, to: streak - 1 };
	});
</script>

<section class="debrief" data-test="debrief">
	{#if !curve}
		<OperatorVoice>
			<p class="prompt">
				This is command. I need to confirm what you held. Question
				<strong>{qIdx + 1}</strong> of <strong>{T}</strong>.
			</p>
			<p class="ask" data-test="debrief-prompt">
				What was the <strong>word at position {current.position + 1}</strong>?
				{#if qIdx === 0}<span class="sub">(most recent transmission)</span>{/if}
			</p>
		</OperatorVoice>

		<div
			class="options"
			role="radiogroup"
			aria-label="recall options for position {current.position + 1}"
			data-test="debrief-options"
		>
			{#each current.options as opt (opt)}
				<button
					type="button"
					class="opt"
					data-test="debrief-option"
					onclick={() => chooseAnswer(opt)}
				>
					{opt}
				</button>
			{/each}
		</div>
	{:else}
		<OperatorVoice>
			<p class="summary-line" data-test="debrief-summary">
				You held <strong>{heldCount}</strong> of <strong>{T}</strong>.
			</p>
			{#if heldRange && heldRange.to >= heldRange.from}
				<p class="summary-detail">
					Words <strong>{heldRange.to + 1}</strong> through
					<strong>{heldRange.from + 1}</strong> you held clearly.
				</p>
			{/if}
			{#if lostRange && lostRange.to >= lostRange.from}
				<p class="summary-detail">
					Words <strong>{lostRange.to + 1}</strong> through
					<strong>{lostRange.from + 1}</strong> are lost. The earliest
					transmissions never made it through the bottleneck.
				</p>
			{/if}
			<p class="summary-detail">
				That curve — easy at the end, impossible at the start — is the
				vanishing-memory of the recurrent cell. Felt, not read.
			</p>
		</OperatorVoice>

		<ul class="accuracy" aria-label="per-position recall results">
			{#each curve as c, i (i)}
				<li class:correct={c.correct} class:wrong={!c.correct}>
					<span class="pos">w{c.position + 1}</span>
					<span class="mark" aria-hidden="true">{c.correct ? '✓' : '✗'}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.debrief {
		max-width: 60ch;
		margin: 0 auto;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.prompt {
		margin: 0 0 0.6rem;
		font-size: 0.9rem;
		color: var(--ivory-muted);
	}
	.ask {
		margin: 0;
		color: var(--ivory);
		line-height: 1.5;
	}
	.ask strong {
		color: var(--brass-bright);
	}
	.sub {
		display: inline-block;
		margin-left: 0.4rem;
		font-style: italic;
		color: var(--ivory-muted);
		font-size: 0.85em;
	}
	.options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}
	.opt {
		padding: 0.85rem 1rem;
		background: transparent;
		border: 1px solid var(--teal);
		color: var(--ivory);
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.95rem;
		letter-spacing: 0.04em;
		cursor: pointer;
		transition: background 200ms ease, border-color 200ms ease;
	}
	.opt:hover {
		background: rgba(176, 137, 64, 0.1);
		border-color: var(--brass);
	}
	.opt:focus-visible {
		outline: 2px solid var(--brass-bright);
		outline-offset: 3px;
	}
	.summary-line {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
		color: var(--ivory);
	}
	.summary-line strong {
		color: var(--brass-bright);
	}
	.summary-detail {
		margin: 0 0 0.45rem;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--ivory-muted);
	}
	.summary-detail strong {
		color: var(--brass-bright);
	}
	.accuracy {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0.75rem 1rem;
		list-style: none;
		background: rgba(13, 21, 24, 0.5);
		border-top: 1px dashed var(--teal);
		border-bottom: 1px dashed var(--teal);
	}
	.accuracy li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.55rem;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.78rem;
	}
	.accuracy .pos {
		color: var(--ivory-muted);
	}
	.accuracy .mark {
		font-weight: 600;
	}
	.accuracy .correct .mark {
		color: #cde2c8;
	}
	.accuracy .wrong .mark {
		color: #d99d8a;
	}
</style>
