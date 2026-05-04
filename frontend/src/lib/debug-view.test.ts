import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import DebugView from './DebugView.svelte';

describe('DebugView', () => {
	it('highlights the argmax bar in a logits array', () => {
		const logits = [0.1, 0.3, 0.05, 0.9, 0.4]; // argmax index = 3
		const { container } = render(DebugView, { props: { logits, label: 'test' } });

		const bars = container.querySelectorAll('[data-bar]');
		expect(bars.length).toBe(5);

		const argmaxBar = container.querySelector('[data-bar][data-argmax="true"]');
		expect(argmaxBar).not.toBeNull();
		expect(argmaxBar?.getAttribute('data-index')).toBe('3');
	});
});
