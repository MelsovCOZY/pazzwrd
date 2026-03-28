export type POS = "noun" | "verb" | "adjective" | "adverb";
export type WordStyle = "sentence" | "random";

export interface GrammarPattern {
  id: string;
  slots: POS[];
}

export const PATTERNS: GrammarPattern[] = [
  // 4-word patterns
  { id: "adj-noun-verb-noun", slots: ["adjective", "noun", "verb", "noun"] },
  { id: "noun-verb-adj-noun", slots: ["noun", "verb", "adjective", "noun"] },
  { id: "adj-noun-verb-adv", slots: ["adjective", "noun", "verb", "adverb"] },
  { id: "noun-verb-noun-adv", slots: ["noun", "verb", "noun", "adverb"] },
  // 5-word patterns
  { id: "adj-noun-verb-adj-noun", slots: ["adjective", "noun", "verb", "adjective", "noun"] },
  { id: "noun-adv-verb-adj-noun", slots: ["noun", "adverb", "verb", "adjective", "noun"] },
];

export function getPatternsByWordCount(wordCount: number): GrammarPattern[] {
  return PATTERNS.filter((p) => p.slots.length === wordCount);
}
