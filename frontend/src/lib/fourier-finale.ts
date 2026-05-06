/** Motif → frequency mapping locked in the FW finale. */
export type Circuit = {
	k: number;
	formula: string;
	roomOfOrigin: string;
	motif: string;
	caption: string;
};

export const CANONICAL_FREQS = [14, 35, 41, 42, 52] as const;

export const CIRCUITS: Circuit[] = [
	{
		k: 14,
		formula: 'w₁₄ = 28π / 113',
		roomOfOrigin: 'Embedding Garden',
		motif: 'the number ring',
		caption: 'The 113 vessels arranged on a circle were never decorative. The model uses this ring at frequency k=14 to compute one component of (a+b) mod 113.'
	},
	{
		k: 35,
		formula: 'w₃₅ = 70π / 113',
		roomOfOrigin: 'Hall of Memory',
		motif: 'beams of light at fixed angles',
		caption: 'The light beams in the Hall of Memory diorama trace this frequency — the weakest of the five, but still load-bearing in the circuit.'
	},
	{
		k: 41,
		formula: 'w₄₁ = 82π / 113',
		roomOfOrigin: 'Attention Hall',
		motif: 'wallpaper tilework patterns',
		caption: 'The repeating tile patterns on the Attention Hall walls repeat at frequency k=41 — the same component the attention head writes into the residual stream.'
	},
	{
		k: 42,
		formula: 'w₄₂ = 84π / 113',
		roomOfOrigin: 'MLP Forge',
		motif: 'nested wheels of varying sizes',
		caption: 'k=42 is the dominant Fourier mode — peak coefficient ~0.69, almost double its nearest sibling. The nested wheels in the MLP Forge were always the picture of this circuit.'
	},
	{
		k: 52,
		formula: 'w₅₂ = 104π / 113',
		roomOfOrigin: 'Unembedding Tower',
		motif: 'sacred-geometry tilework',
		caption: 'The geometric pattern on the Unembedding Tower floor traces this frequency — the last component the network reads back when it commits to its prediction.'
	}
];

/** Top-5 neuron indices for a given frequency, sorted descending by coefficient magnitude. */
export function topNeuronsForFrequency(
	neurons: { idx: number; coefficients: number[] }[],
	freqIndex: number,
	k: number = 5
): { idx: number; coefficient: number }[] {
	return [...neurons]
		.map((n) => ({ idx: n.idx, coefficient: n.coefficients[freqIndex] }))
		.sort((a, b) => b.coefficient - a.coefficient)
		.slice(0, k);
}
