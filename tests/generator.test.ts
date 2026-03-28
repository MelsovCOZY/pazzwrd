import { test, expect, describe } from "bun:test";
import { generatePassword, generateSentencePassword, SYMBOLS } from "../src/generator.ts";
import type { GeneratorConfig, SentenceGeneratorConfig } from "../src/generator.ts";
import { PATTERNS } from "../src/patterns.ts";

const TEST_WORDS = [
  "alpha", "bravo", "charlie", "delta", "echo",
  "foxtrot", "golf", "hotel", "india", "juliet",
];

function makeConfig(overrides: Partial<GeneratorConfig> = {}): GeneratorConfig {
  return {
    words: TEST_WORDS,
    wordCount: 4,
    separator: "mixed",
    capitalize: "yes",
    ...overrides,
  };
}

describe("generatePassword", () => {
  test("returns password, entropy, charCount, and poolSize", () => {
    const result = generatePassword(makeConfig());
    expect(typeof result.password).toBe("string");
    expect(result.password.length).toBeGreaterThan(0);
    expect(typeof result.entropy).toBe("number");
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.charCount).toBe(result.password.length);
    expect(result.poolSize).toBe(TEST_WORDS.length);
  });

  test("password contains correct number of words (capitalized)", () => {
    const result = generatePassword(makeConfig({ separator: "none", wordCount: 3 }));
    const uppercaseCount = (result.password.match(/[A-Z]/g) || []).length;
    expect(uppercaseCount).toBe(3);
  });

  test("all words come from the provided pool", () => {
    const config = makeConfig({ separator: "none", capitalize: "no" });
    for (let i = 0; i < 50; i++) {
      const result = generatePassword(config);
      let remaining = result.password;
      let wordsFound = 0;
      while (remaining.length > 0) {
        const match = TEST_WORDS.find((w) => remaining.startsWith(w));
        expect(match).toBeDefined();
        remaining = remaining.slice(match!.length);
        wordsFound++;
      }
      expect(wordsFound).toBe(4);
    }
  });

  test("capitalize: yes — each word starts with uppercase", () => {
    const result = generatePassword(makeConfig({ separator: "none" }));
    const words = result.password.split(/(?=[A-Z])/);
    for (const word of words) {
      expect(word[0]).toBe(word[0]!.toUpperCase());
    }
  });

  test("capitalize: no — all lowercase", () => {
    const result = generatePassword(makeConfig({ separator: "none", capitalize: "no" }));
    expect(result.password).toBe(result.password.toLowerCase());
  });

  test("capitalize: random — mix of cases", () => {
    let hasUpper = false;
    let hasLower = false;
    for (let i = 0; i < 100; i++) {
      const result = generatePassword(
        makeConfig({ separator: "none", capitalize: "random", wordCount: 1 })
      );
      if (result.password[0] === result.password[0]!.toUpperCase()) hasUpper = true;
      if (result.password[0] === result.password[0]!.toLowerCase()) hasLower = true;
      if (hasUpper && hasLower) break;
    }
    expect(hasUpper).toBe(true);
    expect(hasLower).toBe(true);
  });

  test("mixed separator: pattern is Word[num][sym]Word[num][sym]Word", () => {
    const result = generatePassword(makeConfig({ wordCount: 3 }));
    const symChars = SYMBOLS.split("").map((s) => `\\${s}`).join("");
    const pattern = new RegExp(
      `^[A-Z][a-z]+(\\d{2}[${symChars}][A-Z][a-z]+){2}$`
    );
    expect(result.password).toMatch(pattern);
  });

  test("numbers separator: pattern is Word[num]Word[num]Word", () => {
    const result = generatePassword(makeConfig({ wordCount: 3, separator: "numbers" }));
    const pattern = /^[A-Z][a-z]+(\d{2}[A-Z][a-z]+){2}$/;
    expect(result.password).toMatch(pattern);
  });

  test("symbols separator: pattern is Word[sym]Word[sym]Word", () => {
    const result = generatePassword(makeConfig({ wordCount: 3, separator: "symbols" }));
    const symChars = SYMBOLS.split("").map((s) => `\\${s}`).join("");
    const pattern = new RegExp(`^[A-Z][a-z]+([${symChars}][A-Z][a-z]+){2}$`);
    expect(result.password).toMatch(pattern);
  });

  test("custom separator uses provided string", () => {
    const result = generatePassword(
      makeConfig({ wordCount: 3, separator: "custom", customSeparator: "-" })
    );
    const parts = result.password.split("-");
    expect(parts.length).toBe(3);
  });

  test("none separator: words concatenated directly", () => {
    const result = generatePassword(makeConfig({ wordCount: 3, separator: "none" }));
    expect(result.password).toMatch(/^[A-Za-z]+$/);
  });

  test("entropy matches entropy calculator", () => {
    const result = generatePassword(makeConfig());
    const expected =
      4 * Math.log2(10) + 3 * Math.log2(90) + 3 * Math.log2(7);
    expect(result.entropy).toBeCloseTo(expected, 5);
  });
});

describe("SYMBOLS", () => {
  test("contains exactly 7 characters: !@#$%&*", () => {
    expect(SYMBOLS).toBe("!@#$%&*");
    expect(SYMBOLS.length).toBe(7);
  });
});

const TEST_POS_LISTS = {
  nouns: ["falcon", "river", "castle", "tiger", "forest"],
  verbs: ["hunts", "finds", "guards", "seeks", "builds"],
  adjectives: ["brave", "golden", "silent", "dark", "keen"],
  adverbs: ["boldly", "neatly", "softly", "deeply", "rarely"],
};

function makeSentenceConfig(
  overrides: Partial<SentenceGeneratorConfig> = {}
): SentenceGeneratorConfig {
  return {
    posWordLists: TEST_POS_LISTS,
    wordCount: 4,
    separator: "mixed",
    capitalize: "yes",
    ...overrides,
  };
}

describe("generateSentencePassword", () => {
  test("returns password, entropy, charCount", () => {
    const result = generateSentencePassword(makeSentenceConfig());
    expect(result).not.toBeNull();
    expect(typeof result!.password).toBe("string");
    expect(result!.password.length).toBeGreaterThan(0);
    expect(typeof result!.entropy).toBe("number");
    expect(result!.entropy).toBeGreaterThan(0);
    expect(result!.charCount).toBe(result!.password.length);
  });

  test("password has correct number of words (capitalized)", () => {
    const result = generateSentencePassword(
      makeSentenceConfig({ separator: "none", wordCount: 4 })
    );
    expect(result).not.toBeNull();
    const uppercaseCount = (result!.password.match(/[A-Z]/g) || []).length;
    expect(uppercaseCount).toBe(4);
  });

  test("words come from the correct POS pools", () => {
    const allWords = [
      ...TEST_POS_LISTS.nouns,
      ...TEST_POS_LISTS.verbs,
      ...TEST_POS_LISTS.adjectives,
      ...TEST_POS_LISTS.adverbs,
    ];
    for (let i = 0; i < 50; i++) {
      const result = generateSentencePassword(
        makeSentenceConfig({ separator: "none", capitalize: "no" })
      );
      expect(result).not.toBeNull();
      let remaining = result!.password;
      let wordsFound = 0;
      while (remaining.length > 0) {
        const match = allWords.find((w) => remaining.startsWith(w));
        expect(match).toBeDefined();
        remaining = remaining.slice(match!.length);
        wordsFound++;
      }
      expect(wordsFound).toBe(4);
    }
  });

  test("falls back to null when no patterns match word count", () => {
    const result = generateSentencePassword(makeSentenceConfig({ wordCount: 3 }));
    expect(result).toBeNull();
  });

  test("works with 5-word patterns", () => {
    const result = generateSentencePassword(makeSentenceConfig({ wordCount: 5 }));
    expect(result).not.toBeNull();
    expect(typeof result!.password).toBe("string");
    expect(result!.password.length).toBeGreaterThan(0);
  });

  test("mixed separator pattern matches expected format", () => {
    const result = generateSentencePassword(makeSentenceConfig({ wordCount: 4 }));
    expect(result).not.toBeNull();
    const symChars = SYMBOLS.split("").map((s) => `\\${s}`).join("");
    const pattern = new RegExp(
      `^[A-Z][a-z]+(\\d{2}[${symChars}][A-Z][a-z]+){3}$`
    );
    expect(result!.password).toMatch(pattern);
  });

  test("each run produces a different password", () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = generateSentencePassword(makeSentenceConfig());
      passwords.add(result!.password);
    }
    expect(passwords.size).toBeGreaterThan(1);
  });

  test("returns patternId in result", () => {
    const result = generateSentencePassword(makeSentenceConfig({ wordCount: 4 }));
    expect(result).not.toBeNull();
    expect(result!.patternId).toBeDefined();
    expect(typeof result!.patternId).toBe("string");
  });

  test("words match their POS slot in the selected pattern", () => {
    const posLists = {
      nouns: ["falcon", "river", "castle"],
      verbs: ["hunts", "finds", "guards"],
      adjectives: ["swift", "brave", "golden"],
      adverbs: ["boldly", "softly", "deeply"],
    };
    const posLookup: Record<string, string> = {};
    for (const w of posLists.nouns) posLookup[w] = "noun";
    for (const w of posLists.verbs) posLookup[w] = "verb";
    for (const w of posLists.adjectives) posLookup[w] = "adjective";
    for (const w of posLists.adverbs) posLookup[w] = "adverb";

    const allWords = [...posLists.nouns, ...posLists.verbs, ...posLists.adjectives, ...posLists.adverbs];

    for (let i = 0; i < 50; i++) {
      const result = generateSentencePassword({
        posWordLists: posLists,
        wordCount: 4,
        separator: "none",
        capitalize: "no",
      });
      expect(result).not.toBeNull();

      let remaining = result!.password;
      const parsedWords: string[] = [];
      while (remaining.length > 0) {
        const match = allWords.find((w) => remaining.startsWith(w));
        expect(match).toBeDefined();
        parsedWords.push(match!);
        remaining = remaining.slice(match!.length);
      }

      const pattern = PATTERNS.find((p) => p.id === result!.patternId);
      expect(pattern).toBeDefined();
      expect(parsedWords.length).toBe(pattern!.slots.length);

      for (let j = 0; j < parsedWords.length; j++) {
        const expectedPOS = pattern!.slots[j];
        const actualPOS = posLookup[parsedWords[j]!];
        expect(actualPOS).toBe(expectedPOS);
      }
    }
  });
});
