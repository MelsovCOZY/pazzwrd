export type POS = "noun" | "verb" | "adjective";
export type WordStyle = "sentence" | "random";

export interface GrammarPattern {
  id: string;
  slots: POS[];
}

export const PATTERNS: GrammarPattern[] = [
  // 4-word patterns
  { id: "adj-noun-verb-noun", slots: ["adjective", "noun", "verb", "noun"] },
  { id: "noun-verb-adj-noun", slots: ["noun", "verb", "adjective", "noun"] },
  { id: "adj-noun-verb-adj", slots: ["adjective", "noun", "verb", "adjective"] },
  { id: "noun-verb-noun-adj", slots: ["noun", "verb", "noun", "adjective"] },
  // 5-word patterns
  { id: "adj-noun-verb-adj-noun", slots: ["adjective", "noun", "verb", "adjective", "noun"] },
  { id: "noun-adj-verb-adj-noun", slots: ["noun", "adjective", "verb", "adjective", "noun"] },
];

export function getPatternsByWordCount(wordCount: number): GrammarPattern[] {
  return PATTERNS.filter((p) => p.slots.length === wordCount);
}
