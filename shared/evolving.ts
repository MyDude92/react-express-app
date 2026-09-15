import type { CodingTrack, Localized } from './coding-catalog';

export interface EvolvingChallenge {
  id: string;
  track: CodingTrack;
  title: Localized;
  stages: readonly string[];
}

const challenge = (id: string, track: CodingTrack, en: string, cs: string): EvolvingChallenge => ({
  id, track, title: { en, cs }, stages: [1, 2, 3].map(stage => `${id}-${stage}`),
});

/** A stage is an ordinary server-graded task. Stable task IDs give every stage
 * its own existing account draft, completion record and idempotent XP receipt. */
export const EVOLVING_CHALLENGES: readonly EvolvingChallenge[] = [
  challenge('js-evolving-calculator', 'javascript', 'Expression engine', 'Výrazový engine'),
  challenge('js-evolving-query', 'javascript', 'Query pipeline', 'Dotazovací pipeline'),
  challenge('js-evolving-events', 'javascript', 'Event bus', 'Sběrnice událostí'),
  challenge('js-evolving-graph', 'javascript', 'Dependency planner', 'Plánovač závislostí'),
  challenge('ts-evolving-result', 'typescript', 'Result pipeline', 'Pipeline výsledků'),
  challenge('ts-evolving-store', 'typescript', 'Typed state store', 'Typovaný stavový store'),
  challenge('ts-evolving-schema', 'typescript', 'Schema validator', 'Validátor schémat'),
  challenge('react-evolving-board', 'react', 'Task board', 'Nástěnka úkolů'),
  challenge('react-evolving-catalog', 'react', 'Product explorer', 'Průzkumník produktů'),
  challenge('react-evolving-form', 'react', 'Form wizard', 'Průvodce formulářem'),
];

export function evolvingStage(id: string) {
  const challenge = EVOLVING_CHALLENGES.find(item => item.stages.includes(id));
  if (!challenge) return null;
  const index = challenge.stages.indexOf(id);
  return { challenge, index, previous: challenge.stages[index - 1] ?? null, next: challenge.stages[index + 1] ?? null };
}

export function evolvingResume(challenge: EvolvingChallenge, passed: ReadonlySet<string>): string {
  return challenge.stages.find(id => !passed.has(id)) ?? challenge.stages[challenge.stages.length - 1];
}

export function evolvingUnlocked(id: string, passed: ReadonlySet<string>): boolean {
  const stage = evolvingStage(id);
  return !stage || stage.challenge.stages.slice(0, stage.index).every(id => passed.has(id));
}
