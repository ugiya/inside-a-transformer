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

	it('exposes Grokking Bell as a clickable enter-link to /grokking-bell', () => {
		const { container } = render(Lobby);
		const link = container.querySelector('a[href="/grokking-bell"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('Grokking Bell');
	});

	it('exposes Unembedding Tower as a clickable enter-link to /unembedding-tower', () => {
		const { container } = render(Lobby);
		const link = container.querySelector('a[href="/unembedding-tower"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('Unembedding Tower');
	});

	it('exposes Attention Hall as a clickable enter-link to /attention-hall', () => {
		const { container } = render(Lobby);
		const link = container.querySelector('a[href="/attention-hall"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('Attention Hall');
	});

	it('exposes MLP Forge as a clickable enter-link to /mlp-forge', () => {
		const { container } = render(Lobby);
		const link = container.querySelector('a[href="/mlp-forge"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('MLP Forge');
	});

	it('exposes Fourier Wing as a clickable enter-link to /fourier-wing', () => {
		const { container } = render(Lobby);
		const link = container.querySelector('a[href="/fourier-wing"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('Fourier Wing');
	});
});
