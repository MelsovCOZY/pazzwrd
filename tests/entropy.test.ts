import { test, expect, describe } from "bun:test";
import { calculateEntropy, calculateSentenceEntropy, formatEntropy, formatTimeToCrack } from "../src/entropy.ts";
import type { SeparatorStyle, CapitalizeStyle, SentenceEntropyConfig } from "../src/entropy.ts";

describe("calculateEntropy", () => {
  test("mixed separators with 4 words and ~9500 pool", () => {
    const entropy = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "mixed",
      capitalize: "yes",
    });
    // 4 × log2(9500) ≈ 52.8
    // 3 × log2(90) ≈ 19.5
    // 3 × log2(7) ≈ 8.4
    // Total ≈ 80.7
    expect(entropy).toBeCloseTo(80.7, 0);
  });

  test("numbers-only separators", () => {
    const entropy = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "numbers",
      capitalize: "yes",
    });
    // 4 × log2(9500) + 3 × log2(90) ≈ 52.8 + 19.5 = 72.3
    expect(entropy).toBeCloseTo(72.3, 0);
  });

  test("symbols-only separators", () => {
    const entropy = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "symbols",
      capitalize: "yes",
    });
    // 4 × log2(9500) + 3 × log2(7) ≈ 52.8 + 8.4 = 61.2
    expect(entropy).toBeCloseTo(61.2, 0);
  });

  test("no separators", () => {
    const entropy = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "none",
      capitalize: "yes",
    });
    // 4 × log2(9500) ≈ 52.8
    expect(entropy).toBeCloseTo(52.8, 0);
  });

  test("custom separator adds no entropy", () => {
    const entropy = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "custom",
      capitalize: "yes",
    });
    expect(entropy).toBeCloseTo(52.8, 0);
  });

  test("random capitalization adds 1 bit per word", () => {
    const base = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "none",
      capitalize: "yes",
    });
    const withRandom = calculateEntropy({
      poolSize: 9500,
      wordCount: 4,
      separator: "none",
      capitalize: "random",
    });
    expect(withRandom - base).toBeCloseTo(4, 5);
  });

  test("3 words has 2 separator slots", () => {
    const entropy = calculateEntropy({
      poolSize: 1000,
      wordCount: 3,
      separator: "mixed",
      capitalize: "yes",
    });
    const expected =
      3 * Math.log2(1000) + 2 * Math.log2(90) + 2 * Math.log2(7);
    expect(entropy).toBeCloseTo(expected, 5);
  });

  test("single word has zero separator slots", () => {
    const entropy = calculateEntropy({
      poolSize: 1000,
      wordCount: 1,
      separator: "mixed",
      capitalize: "yes",
    });
    expect(entropy).toBeCloseTo(Math.log2(1000), 5);
  });
});

describe("formatEntropy", () => {
  test("rounds and formats with tilde", () => {
    expect(formatEntropy(80.7)).toBe("~81 bits");
  });

  test("formats whole number", () => {
    expect(formatEntropy(64.0)).toBe("~64 bits");
  });
});

describe("formatTimeToCrack", () => {
  test("low entropy returns short time", () => {
    expect(formatTimeToCrack(20)).toBe("instant");
  });

  test("~40 bits returns seconds", () => {
    const result = formatTimeToCrack(40);
    expect(result).toMatch(/seconds/);
  });

  test("~80 bits returns millennia", () => {
    const result = formatTimeToCrack(80);
    expect(result).toMatch(/millennia/);
  });

  test("very high entropy returns millennia", () => {
    const result = formatTimeToCrack(128);
    expect(result).toMatch(/millennia/);
  });
});

describe("calculateSentenceEntropy", () => {
  test("accounts for pattern count and per-slot pool sizes", () => {
    const entropy = calculateSentenceEntropy({
      patternCount: 4,
      slotPoolSizes: [1500, 2000, 1000, 2000],
      separator: "mixed",
      capitalize: "yes",
    });
    // log2(4) + log2(1500) + log2(2000) + log2(1000) + log2(2000) = 2 + 10.55 + 10.97 + 9.97 + 10.97 = 44.46
    // + separators: 3 * (log2(90) + log2(7)) = 3 * (6.49 + 2.81) = 27.9
    // Total ≈ 72.36
    expect(entropy).toBeCloseTo(72.4, 0);
  });

  test("single slot has no separator entropy", () => {
    const entropy = calculateSentenceEntropy({
      patternCount: 1,
      slotPoolSizes: [2000],
      separator: "mixed",
      capitalize: "yes",
    });
    // log2(1) + log2(2000) = 0 + 10.97 = 10.97
    expect(entropy).toBeCloseTo(10.97, 0);
  });

  test("no separators: only word and pattern entropy", () => {
    const entropy = calculateSentenceEntropy({
      patternCount: 4,
      slotPoolSizes: [1500, 2000, 1000, 2000],
      separator: "none",
      capitalize: "yes",
    });
    // log2(4) + log2(1500) + log2(2000) + log2(1000) + log2(2000) ≈ 44.46
    expect(entropy).toBeCloseTo(44.5, 0);
  });

  test("random capitalization adds 1 bit per word", () => {
    const base = calculateSentenceEntropy({
      patternCount: 4,
      slotPoolSizes: [1500, 2000, 1000, 2000],
      separator: "none",
      capitalize: "yes",
    });
    const withRandom = calculateSentenceEntropy({
      patternCount: 4,
      slotPoolSizes: [1500, 2000, 1000, 2000],
      separator: "none",
      capitalize: "random",
    });
    expect(withRandom - base).toBeCloseTo(4, 5);
  });

  test("numbers-only separator entropy", () => {
    const entropy = calculateSentenceEntropy({
      patternCount: 4,
      slotPoolSizes: [1500, 2000, 1000, 2000],
      separator: "numbers",
      capitalize: "yes",
    });
    // 44.46 + 3 * log2(90) ≈ 44.46 + 19.47 = 63.93
    expect(entropy).toBeCloseTo(63.9, 0);
  });

  test("symbols-only separator entropy", () => {
    const entropy = calculateSentenceEntropy({
      patternCount: 4,
      slotPoolSizes: [1500, 2000, 1000, 2000],
      separator: "symbols",
      capitalize: "yes",
    });
    // 44.46 + 3 * log2(7) ≈ 44.46 + 8.43 = 52.89
    expect(entropy).toBeCloseTo(52.9, 0);
  });
});
