import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import MathPanel from './MathPanel.svelte';
import { initWeights } from '$lib/rnn/weights';
import { EMBED_DIM } from '$lib/rnn/transmissions';

describe('MathPanel — step decomposition toggle', () => {
	const weights = initWeights(4, EMBED_DIM, 7);
	const props = {
		weights,
		xCurrent: [0.5, -0.5, 0.5, -0.5],
		hPrev: [0, 0, 0, 0],
		hNew: [0.1, -0.2, 0.05, -0.15],
		word: 'signal',
		step: 0
	};

	it('renders as collapsed by default with a toggle affordance', () => {
		const { container } = render(MathPanel, { props });
		const panel = container.querySelector('[data-test="math-panel"]') as HTMLDetailsElement;
		expect(panel).not.toBeNull();
		expect(panel.open).toBe(false);
		expect(container.querySelector('[data-test="math-toggle"]')).not.toBeNull();
	});

	it('when opened, shows W_x·x, W_h·h, sum, and tanh decomposition labels', async () => {
		const { container } = render(MathPanel, { props: { ...props, open: true } });
		const body = container.querySelector('[data-test="math-panel-body"]');
		const text = body?.textContent ?? '';
		expect(text).toContain('W_x · x_t');
		expect(text).toContain('W_h · h_(t-1)');
		expect(text).toContain('+ b');
		expect(text).toContain('tanh');
		expect(text).toContain('h_t');
	});

	it('toggles open via the summary element (click)', async () => {
		const { container } = render(MathPanel, { props });
		const summary = container.querySelector('[data-test="math-toggle"]') as HTMLElement;
		await fireEvent.click(summary);
		await tick();
		const panel = container.querySelector('[data-test="math-panel"]') as HTMLDetailsElement;
		expect(panel.open).toBe(true);
	});

	it('renders the current word and step number in the body', () => {
		const { container } = render(MathPanel, { props: { ...props, open: true, step: 4 } });
		const body = container.querySelector('[data-test="math-panel-body"]');
		expect(body?.textContent ?? '').toContain('signal');
		// Step is displayed 1-indexed in the toggle label.
		expect(
			container.querySelector('[data-test="math-toggle"]')?.textContent ?? ''
		).toContain('5');
	});
});
