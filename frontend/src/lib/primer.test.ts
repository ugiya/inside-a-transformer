import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import Primer from './Primer.svelte';
import { primers } from './primers.svelte';

describe('Primer.svelte', () => {
	beforeEach(() => {
		// Reset the shared registry between tests rather than resetting the
		// module cache — Primer.svelte and the test must reference the same
		// `primers` singleton for the component's reactivity to be observable
		// from the test.
		primers.clearAll();
	});

	it('renders the headline and body for a registered term', () => {
		const { container } = render(Primer, { props: { term: 'logits' } });
		const root = container.querySelector('[data-primer]');
		expect(root).not.toBeNull();
		expect(root?.getAttribute('data-term')).toBe('logits');

		const headline = container.querySelector('[data-primer-headline]');
		expect(headline).not.toBeNull();
		expect((headline as HTMLElement).textContent?.length ?? 0).toBeGreaterThan(0);

		const body = container.querySelector('[data-primer-body]');
		expect(body).not.toBeNull();
	});

	it('clicking dismiss collapses the panel and persists the term', async () => {
		const { container } = render(Primer, { props: { term: 'softmax' } });

		const dismissBtn = container.querySelector('[data-primer-dismiss]') as HTMLButtonElement;
		expect(dismissBtn).not.toBeNull();

		await fireEvent.click(dismissBtn);
		flushSync();

		expect(primers.isDismissed('softmax')).toBe(true);
		// The root element flips to data-dismissed="true" reactively.
		const root = container.querySelector('[data-primer]');
		expect(root?.getAttribute('data-dismissed')).toBe('true');
		// Body must no longer be in the DOM
		expect(container.querySelector('[data-primer-body]')).toBeNull();
	});

	it('does not render body content when the term is already dismissed', () => {
		primers.dismiss('cross-entropy');

		const { container } = render(Primer, { props: { term: 'cross-entropy' } });
		expect(container.querySelector('[data-primer-body]')).toBeNull();
		// A small "dismissed" stub may exist, but the body is gone.
		const root = container.querySelector('[data-primer]');
		expect(root?.getAttribute('data-dismissed')).toBe('true');
	});

	it('respects dismissable=false (no dismiss button rendered)', () => {
		const { container } = render(Primer, {
			props: { term: 'logits', dismissable: false }
		});
		expect(container.querySelector('[data-primer-dismiss]')).toBeNull();
	});

	it('renders a children snippet when provided alongside the body', () => {
		const children = createRawSnippet(() => ({
			render: () => `<span data-test-child>child-content</span>`
		}));
		const { container } = render(Primer, {
			props: { term: 'logits', children }
		});
		expect(container.querySelector('[data-test-child]')).not.toBeNull();
	});
});
