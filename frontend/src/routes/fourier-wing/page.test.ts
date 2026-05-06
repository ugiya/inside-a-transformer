import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Hub from './+page.svelte';

describe('Fourier Wing hub', () => {
	it('exposes the three investigation rooms as enter-links', () => {
		const { container } = render(Hub);
		expect(container.querySelector('a[href="/fourier-wing/embedding-garden"]')).not.toBeNull();
		expect(container.querySelector('a[href="/fourier-wing/attention-hall"]')).not.toBeNull();
		expect(container.querySelector('a[href="/fourier-wing/mlp-forge"]')).not.toBeNull();
	});

	it('exposes the finale as a separate enter-link', () => {
		const { container } = render(Hub);
		const finale = container.querySelector('a[href="/fourier-wing/finale"]');
		expect(finale).not.toBeNull();
		expect(finale?.textContent ?? '').toMatch(/Five Fourier Circuits/);
	});

	it('back-link returns to the lobby', () => {
		const { container } = render(Hub);
		expect(container.querySelector('a[href="/"]')).not.toBeNull();
	});
});
