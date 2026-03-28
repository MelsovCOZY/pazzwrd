import { calculateEntropy, calculateSentenceEntropy } from "./entropy.ts";
import type { SeparatorStyle, CapitalizeStyle } from "./entropy.ts";
import { getPatternsByWordCount } from "./patterns.ts";
import type { POS } from "./patterns.ts";
import type { POSWordLists } from "./wordlist.ts";

export type { SeparatorStyle, CapitalizeStyle };

export const SYMBOLS = "!@#$%&*";

export interface GeneratorConfig {
  words: string[];
  wordCount: number;
  separator: SeparatorStyle;
  customSeparator?: string;
  capitalize: CapitalizeStyle;
}

export interface GeneratedPassword {
  password: string;
  entropy: number;
  charCount: number;
  poolSize?: number;
  patternId?: string;
}

function secureRandomInt(max: number): number {
  const limit = Math.floor(2 ** 32 / max) * max;
  let value: number;
  do {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    value = array[0]!;
  } while (value >= limit);
  return value % max;
}

function pickRandom<T>(arr: T[]): T {
  return arr[secureRandomInt(arr.length)]!;
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildSeparator(style: SeparatorStyle, customSep?: string): string {
  switch (style) {
    case "mixed": {
      const num = secureRandomInt(90) + 10;
      const sym = SYMBOLS[secureRandomInt(SYMBOLS.length)]!;
      return `${num}${sym}`;
    }
    case "numbers":
      return `${secureRandomInt(90) + 10}`;
    case "symbols":
      return SYMBOLS[secureRandomInt(SYMBOLS.length)]!;
    case "custom":
      return customSep ?? "";
    case "none":
      return "";
  }
}

export function generatePassword(config: GeneratorConfig): GeneratedPassword {
  const { words, wordCount, separator, customSeparator, capitalize } = config;

  const parts: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    let word = pickRandom(words);

    if (capitalize === "yes") {
      word = capitalizeWord(word);
    } else if (capitalize === "random") {
      if (secureRandomInt(2) === 1) {
        word = capitalizeWord(word);
      }
    }

    parts.push(word);

    if (i < wordCount - 1) {
      parts.push(buildSeparator(separator, customSeparator));
    }
  }

  const password = parts.join("");

  const entropy = calculateEntropy({
    poolSize: words.length,
    wordCount,
    separator,
    capitalize,
  });

  return {
    password,
    entropy,
    charCount: password.length,
    poolSize: words.length,
  };
}

export interface SentenceGeneratorConfig {
  posWordLists: POSWordLists;
  wordCount: number;
  separator: SeparatorStyle;
  customSeparator?: string;
  capitalize: CapitalizeStyle;
}

function getPoolForPOS(pos: POS, lists: POSWordLists): string[] {
  switch (pos) {
    case "noun": return lists.nouns;
    case "verb": return lists.verbs;
    case "adjective": return lists.adjectives;
  }
}

export function generateSentencePassword(
  config: SentenceGeneratorConfig
): GeneratedPassword | null {
  const { posWordLists, wordCount, separator, customSeparator, capitalize } = config;

  const patterns = getPatternsByWordCount(wordCount);
  if (patterns.length === 0) return null;

  const pattern = pickRandom(patterns);
  const parts: string[] = [];

  for (let i = 0; i < pattern.slots.length; i++) {
    const pos = pattern.slots[i]!;
    const pool = getPoolForPOS(pos, posWordLists);
    let word = pickRandom(pool);

    if (capitalize === "yes") {
      word = capitalizeWord(word);
    } else if (capitalize === "random") {
      if (secureRandomInt(2) === 1) {
        word = capitalizeWord(word);
      }
    }

    parts.push(word);

    if (i < pattern.slots.length - 1) {
      parts.push(buildSeparator(separator, customSeparator));
    }
  }

  const password = parts.join("");

  const slotPoolSizes = pattern.slots.map(
    (pos) => getPoolForPOS(pos, posWordLists).length
  );

  const entropy = calculateSentenceEntropy({
    patternCount: patterns.length,
    slotPoolSizes,
    separator,
    capitalize,
  });

  return {
    password,
    entropy,
    charCount: password.length,
    patternId: pattern.id,
  };
}
