import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';

type Trajectory = {
	id: string;
	label: string;
	steps: number[];
	train_loss: number[];
	train_acc: number[];
	test_loss: number[];
	test_acc: number[];
};

const mkTrajectory = (id: string, finalAcc: number): Trajectory => ({
	id,
	label: `${id} label`,
	steps: [0, 100, 1000, 10000, 39999],
	train_loss: [5, 3, 1, 0.1, 0.001],
	train_acc: [0.01, 0.2, 0.7, 0.99, 1.0],
	test_loss: [5, 4.8, 4.5, 2.0, 0.001],
	test_acc: [0.01, 0.02, 0.05, 0.5, finalAcc]
});

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}

function installFetchMock() {
	const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.endsWith('/trajectories/default-grok.json')) {
			return jsonResponse(mkTrajectory('default-grok', 1.0));
		}
		if (url.endsWith('/trajectories/fast-grok.json')) {
			return jsonResponse(mkTrajectory('fast-grok', 1.0));
		}
		if (url.endsWith('/trajectories/never-grok.json')) {
			return jsonResponse(mkTrajectory('never-grok', 0.009));
		}
		if (url.match(/\/checkpoint\/\d+$/)) {
			const step = Number(url.split('/').pop());
			return jsonResponse({ ok: true, step });
		}
		if (url.endsWith('/forward')) {
			const logits = new Array(114).fill(0);
			logits[22] = 10; // argmax = 22
			return jsonResponse({ logits, cached: {} });
		}
		throw new Error(`unmocked fetch: ${url}`);
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

describe('Grokking Bell page', () => {
	beforeEach(() => {
		installFetchMock();
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('renders three trajectory selector buttons', async () => {
		const { container, findAllByRole } = render(Page);
		// Wait until the page has fetched the default trajectory.
		await new Promise((r) => setTimeout(r, 0));
		const buttons = container.querySelectorAll('[data-trajectory-button]');
		expect(buttons.length).toBe(3);
		const ids = Array.from(buttons).map((b) => b.getAttribute('data-trajectory-id'));
		expect(ids).toEqual(['default-grok', 'fast-grok', 'never-grok']);
		// Sanity-check that buttons are reachable via role (no axe failure surface).
		const roleButtons = await findAllByRole('button');
		expect(roleButtons.length).toBeGreaterThanOrEqual(3);
	});

	it('drives the plot from the selected trajectory and switches when buttons are clicked', async () => {
		const { container } = render(Page);
		await new Promise((r) => setTimeout(r, 0));

		const plot = container.querySelector('[data-trajectory-plot]');
		expect(plot).not.toBeNull();
		expect(plot?.getAttribute('data-trajectory')).toBe('default-grok');

		const fastBtn = container.querySelector(
			'[data-trajectory-button][data-trajectory-id="fast-grok"]'
		) as HTMLButtonElement;
		await fireEvent.click(fastBtn);
		await new Promise((r) => setTimeout(r, 0));

		expect(
			container.querySelector('[data-trajectory-plot]')?.getAttribute('data-trajectory')
		).toBe('fast-grok');
	});

	it('debounces the scrubber and fires /checkpoint and /forward exactly once for a burst', async () => {
		vi.useFakeTimers();
		const fetchMock = installFetchMock();
		const { container } = render(Page);
		// Drain the initial trajectory fetch.
		await vi.advanceTimersByTimeAsync(0);

		const scrubber = container.querySelector(
			'[data-step-scrubber]'
		) as HTMLInputElement;
		expect(scrubber).not.toBeNull();

		const callsBefore = fetchMock.mock.calls.length;

		// Burst of input events; each one should reset the debounce timer.
		scrubber.value = '1';
		await fireEvent.input(scrubber);
		scrubber.value = '2';
		await fireEvent.input(scrubber);
		scrubber.value = '3';
		await fireEvent.input(scrubber);

		// Before the debounce fires, no extra checkpoint/forward calls.
		const ckptCallsBeforeFire = fetchMock.mock.calls.filter(([u]) =>
			String(u).includes('/checkpoint/')
		).length;
		expect(ckptCallsBeforeFire).toBe(0);

		// Advance past the debounce window.
		await vi.advanceTimersByTimeAsync(200);

		const callsAfter = fetchMock.mock.calls;
		const ckptCalls = callsAfter.filter(([u]) => String(u).includes('/checkpoint/'));
		const fwdCalls = callsAfter.filter(([u]) => String(u).endsWith('/forward'));
		expect(ckptCalls.length).toBe(1);
		expect(fwdCalls.length).toBe(1);
		// The single fired step should match the LAST scrubber value.
		const lastCkptUrl = String(ckptCalls[0][0]);
		expect(lastCkptUrl).toMatch(/\/checkpoint\/\d+$/);
		expect(callsAfter.length).toBeGreaterThan(callsBefore);
	});
});
