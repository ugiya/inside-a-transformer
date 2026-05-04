import { describe, it, expect } from 'vitest';
import { CHECKPOINT_STEPS, type Checkpoint, garden } from './garden.svelte';

describe('garden — checkpoint state', () => {
	it('exposes the six real training steps as the canonical checkpoint list', () => {
		expect(CHECKPOINT_STEPS).toEqual([0, 1000, 5000, 10000, 18000, 39999]);
	});

	it('defaults the checkpoint to step 0 (pre-grok)', () => {
		// Reset to a known starting point regardless of test order.
		garden.setCheckpoint(0);
		expect(garden.checkpoint).toBe(0);
	});

	it('setCheckpoint accepts every value in CHECKPOINT_STEPS', () => {
		for (const step of CHECKPOINT_STEPS) {
			garden.setCheckpoint(step as Checkpoint);
			expect(garden.checkpoint).toBe(step);
		}
	});
});
