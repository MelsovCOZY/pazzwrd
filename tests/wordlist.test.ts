import { test, expect, describe } from "bun:test";
import { loadWordList, loadWordLists, loadPOSWordLists, WORDLIST_META } from "../src/wordlist.ts";
import type { WordListName, POSWordLists } from "../src/wordlist.ts";

describe("loadWordList", () => {
  test("loads eff-large and returns non-empty array of strings", async () => {
    const words = await loadWordList("eff-large");
    expect(words.length).toBeGreaterThan(7000);
    expect(typeof words[0]).toBe("string");
    expect(words[0]!.length).toBeGreaterThan(0);
  });

  test("loads eff-short-1", async () => {
    const words = await loadWordList("eff-short-1");
    expect(words.length).toBeGreaterThan(1200);
  });

  test("loads eff-short-2", async () => {
    const words = await loadWordList("eff-short-2");
    expect(words.length).toBeGreaterThan(1200);
  });

  test("throws on unknown word list name", async () => {
    expect(loadWordList("nonexistent" as WordListName)).rejects.toThrow(
      "Unknown word list"
    );
  });

  test("words contain no empty strings", async () => {
    const words = await loadWordList("eff-large");
    const empties = words.filter((w) => w.trim().length === 0);
    expect(empties.length).toBe(0);
  });
});

describe("loadWordLists", () => {
  test("merges all three lists into deduplicated array", async () => {
    const words = await loadWordLists(["eff-large", "eff-short-1", "eff-short-2"]);
    expect(words.length).toBeGreaterThan(7000);
    expect(words.length).toBeLessThanOrEqual(10368);
    const unique = new Set(words);
    expect(unique.size).toBe(words.length);
  });

  test("single list returns that list's words", async () => {
    const words = await loadWordLists(["eff-short-1"]);
    expect(words.length).toBeGreaterThan(1200);
  });
});

describe("WORDLIST_META", () => {
  test("has entries for all three lists", () => {
    expect(WORDLIST_META["eff-large"].label).toBe("EFF Large");
    expect(WORDLIST_META["eff-short-1"].label).toBe("EFF Short 1");
    expect(WORDLIST_META["eff-short-2"].label).toBe("EFF Short 2");
  });
});

describe("loadPOSWordLists", () => {
  test("returns all four POS categories", async () => {
    const lists = await loadPOSWordLists();
    expect(lists.nouns.length).toBeGreaterThan(0);
    expect(lists.verbs.length).toBeGreaterThan(0);
    expect(lists.adjectives.length).toBeGreaterThan(0);
    expect(lists.adverbs.length).toBeGreaterThan(0);
  });

  test("nouns has 2000+ words", async () => {
    const lists = await loadPOSWordLists();
    expect(lists.nouns.length).toBeGreaterThanOrEqual(2000);
  });

  test("verbs has 1000+ words", async () => {
    const lists = await loadPOSWordLists();
    expect(lists.verbs.length).toBeGreaterThanOrEqual(1000);
  });

  test("adjectives has 1500+ words", async () => {
    const lists = await loadPOSWordLists();
    expect(lists.adjectives.length).toBeGreaterThanOrEqual(1500);
  });

  test("adverbs has 300+ words", async () => {
    const lists = await loadPOSWordLists();
    expect(lists.adverbs.length).toBeGreaterThanOrEqual(300);
  });

  test("all words are non-empty lowercase strings", async () => {
    const lists = await loadPOSWordLists();
    for (const category of [lists.nouns, lists.verbs, lists.adjectives, lists.adverbs]) {
      for (const word of category) {
        expect(word.length).toBeGreaterThan(0);
        expect(word).toBe(word.toLowerCase());
      }
    }
  });
});
