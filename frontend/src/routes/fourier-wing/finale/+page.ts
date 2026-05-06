import type { PageLoad } from './$types';

export type NeuronCoefficients = {
	neurons: { idx: number; coefficients: number[] }[];
	frequencies?: number[];
};

export const load: PageLoad = async ({ fetch }) => {
	const r = await fetch('/fourier/neuron_coefficients.json');
	const data = (await r.json()) as NeuronCoefficients;
	return { coefficients: data };
};
