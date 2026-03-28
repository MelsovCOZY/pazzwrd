import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type WordListName = "eff-large" | "eff-short-1" | "eff-short-2";

export const WORDLIST_META: Record<
  WordListName,
  { file: string; label: string; count: number }
> = {
  "eff-large": { file: "eff-large.txt", label: "EFF Large", count: 7776 },
  "eff-short-1": { file: "eff-short-1.txt", label: "EFF Short 1", count: 1296 },
  "eff-short-2": { file: "eff-short-2.txt", label: "EFF Short 2", count: 1296 },
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDLIST_DIR = join(__dirname, "..", "wordlists");

export async function loadWordList(name: WordListName): Promise<string[]> {
  const meta = WORDLIST_META[name];
  if (!meta) {
    throw new Error(`Unknown word list: ${name}`);
  }

  const filePath = join(WORDLIST_DIR, meta.file);
  let text: string;
  try {
    text = await readFile(filePath, "utf-8");
  } catch {
    throw new Error(`Word list not found: ${filePath}`);
  }

  return text
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0);
}

import type { POS } from "./patterns.ts";

export interface POSWordLists {
  nouns: string[];
  verbs: string[];
  adjectives: string[];
  adverbs: string[];
}

const POS_FILES: Record<POS, string> = {
  noun: "nouns.txt",
  verb: "verbs.txt",
  adjective: "adjectives.txt",
  adverb: "adverbs.txt",
};

async function loadPOSFile(pos: POS): Promise<string[]> {
  const filePath = join(WORDLIST_DIR, POS_FILES[pos]);
  let text: string;
  try {
    text = await readFile(filePath, "utf-8");
  } catch {
    throw new Error(`POS word list not found: ${filePath}`);
  }
  return text
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0);
}

export async function loadPOSWordLists(): Promise<POSWordLists> {
  const [nouns, verbs, adjectives, adverbs] = await Promise.all([
    loadPOSFile("noun"),
    loadPOSFile("verb"),
    loadPOSFile("adjective"),
    loadPOSFile("adverb"),
  ]);
  return { nouns, verbs, adjectives, adverbs };
}

export async function loadWordLists(names: WordListName[]): Promise<string[]> {
  const pool = new Set<string>();

  for (const name of names) {
    const words = await loadWordList(name);
    for (const word of words) {
      pool.add(word);
    }
  }

  return Array.from(pool);
}
