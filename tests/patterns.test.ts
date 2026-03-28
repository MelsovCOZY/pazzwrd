import { test, expect, describe } from "bun:test";
import { PATTERNS, getPatternsByWordCount } from "../src/patterns.ts";
import type { POS, GrammarPattern } from "../src/patterns.ts";

describe("PATTERNS", () => {
  test("all patterns have valid POS slots", () => {
    const validPOS: POS[] = ["noun", "verb", "adjective", "adverb"];
    for (const pattern of PATTERNS) {
      for (const slot of pattern.slots) {
        expect(validPOS).toContain(slot);
      }
    }
  });

  test("contains at least 4 four-word patterns", () => {
    const fourWord = PATTERNS.filter((p) => p.slots.length === 4);
    expect(fourWord.length).toBeGreaterThanOrEqual(4);
  });

  test("contains at least 2 five-word patterns", () => {
    const fiveWord = PATTERNS.filter((p) => p.slots.length === 5);
    expect(fiveWord.length).toBeGreaterThanOrEqual(2);
  });

  test("each pattern has a unique id", () => {
    const ids = PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getPatternsByWordCount", () => {
  test("returns 4-word patterns for wordCount 4", () => {
    const patterns = getPatternsByWordCount(4);
    expect(patterns.length).toBeGreaterThanOrEqual(4);
    for (const p of patterns) {
      expect(p.slots.length).toBe(4);
    }
  });

  test("returns 5-word patterns for wordCount 5", () => {
    const patterns = getPatternsByWordCount(5);
    expect(patterns.length).toBeGreaterThanOrEqual(2);
    for (const p of patterns) {
      expect(p.slots.length).toBe(5);
    }
  });

  test("returns empty array for wordCount with no patterns", () => {
    const patterns = getPatternsByWordCount(3);
    expect(patterns.length).toBe(0);
  });

  test("returns empty array for wordCount 7", () => {
    const patterns = getPatternsByWordCount(7);
    expect(patterns.length).toBe(0);
  });
});
