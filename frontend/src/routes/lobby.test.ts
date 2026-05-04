import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Lobby from './+page.svelte';

describe('Lobby', () => {
	it('exposes Hall of Memory as a clickable enter-link to /hall-of-memory', () => {
		const { container } = render(Lobby);
		const link = container.querySelector('a[href="/hall-of-memory"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('Hall of Memory');
	});
});
