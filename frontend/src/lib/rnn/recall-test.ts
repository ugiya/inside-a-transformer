/**
 * N-back recall test for the Last Receiver game.
 *
 * After the player has watched a sequence of T transmissions wash through
 * the memory cell, command radios in for a debrief: "what was the final
 * word?" (easy) → "what came before that?" → ... → "what was the first
 * word I gave you?" (mostly impossible).
 *
 * The arc of correctness across these questions IS the vanishing-memory
 * curve, drawn by the player's own answers.
 *
 * Stub for slice #19 tracer bullet: full distractor sampling and bias
 * logic lands in a later cycle.
 */

import type { Token } from './transmissions.js';
import type { Residue } from './recurrence.js';
import { mulberry32 } from './prng.js';

export interface Question {
  readonly position: number; // 0-indexed in the original sequence
  readonly correct: string;
  readonly options: readonly string[]; // 4 options including correct
}

export interface AccuracyAtPosition {
  readonly position: number;
  readonly correct: boolean;
}

/**
 * Generate one multiple-choice question per position, ordered last-to-first
 * so the test progresses from easy to impossible — and the player feels the
 * gradient of memory in real time as they answer.
 *
 * Each question has 4 options: the correct word + 3 distractors drawn from
 * the palette with same-type bias (so guessing-by-elimination is hard).
 */
export function generateQuestions(
  words: readonly string[],
  _residues: readonly Residue[],
  palette: readonly Token[],
  seed: number
): Question[] {
  const rng = mulberry32(seed);
  const questions: Question[] = [];
  for (let position = words.length - 1; position >= 0; position--) {
    const correct = words[position];
    const correctTok = palette.find((t) => t.word === correct);
    const sameType = palette.filter(
      (t) => t.word !== correct && correctTok && t.type === correctTok.type
    );
    const otherType = palette.filter(
      (t) => t.word !== correct && correctTok && t.type !== correctTok.type
    );

    // Same-type bias: 2 of 3 distractors from same type, 1 from other.
    const distractors: string[] = [];
    const pickFrom = (pool: Token[], n: number) => {
      const copy = [...pool];
      for (let k = 0; k < n && copy.length > 0; k++) {
        const idx = Math.floor(rng() * copy.length);
        distractors.push(copy.splice(idx, 1)[0].word);
      }
    };
    pickFrom(sameType, 2);
    pickFrom(otherType, 1);
    // If pools were short, top up from the rest (excluding correct + already picked).
    while (distractors.length < 3) {
      const remaining = palette
        .map((t) => t.word)
        .filter((w) => w !== correct && !distractors.includes(w));
      if (remaining.length === 0) break;
      const idx = Math.floor(rng() * remaining.length);
      distractors.push(remaining[idx]);
    }

    // Shuffle the 4 options.
    const options = [correct, ...distractors];
    for (let k = options.length - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [options[k], options[j]] = [options[j], options[k]];
    }

    questions.push({ position, correct, options });
  }
  return questions;
}

/**
 * Score each question against the player's answer.
 * Returns a per-position correctness array (in question order, i.e. last word first).
 */
export function scoreRecall(
  questions: readonly Question[],
  answers: readonly string[]
): AccuracyAtPosition[] {
  if (questions.length !== answers.length) {
    throw new Error(
      `scoreRecall: ${questions.length} questions but ${answers.length} answers`
    );
  }
  return questions.map((q, i) => ({
    position: q.position,
    correct: q.correct === answers[i]
  }));
}
