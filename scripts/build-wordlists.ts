// scripts/build-wordlists.ts
import { writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDLIST_DIR = join(__dirname, "..", "wordlists");

const BASE_URL =
  "https://raw.githubusercontent.com/verachell/English-word-lists-parts-of-speech-approximate/refs/heads/main";

const SOURCES = [
  { url: `${BASE_URL}/nouns/mostly-nouns.txt`, output: "nouns.txt" },
  { url: `${BASE_URL}/verbs/mostly-verbs-infinitive.txt`, output: "verbs.txt" },
  { url: `${BASE_URL}/other-categories/mostly-adjectives.txt`, output: "adjectives.txt" },
  { url: `${BASE_URL}/other-categories/mostly-adverbs.txt`, output: "adverbs.txt" },
];

// Load EFF large list as quality baseline
const effPath = join(WORDLIST_DIR, "eff-large.txt");
const effRaw = await readFile(effPath, "utf-8");
const effWords = new Set(
  effRaw.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean)
);

function isValid(word: string): boolean {
  return /^[a-z]{3,9}$/.test(word);
}

for (const source of SOURCES) {
  console.log(`Fetching ${source.url}...`);
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  }
  const raw = await response.text();

  const allValid = raw
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((word) => word.length > 0 && isValid(word));

  // Keep words that appear in the EFF large list (quality baseline).
  // This removes obscure/technical terms while keeping common English words.
  const filtered = allValid.filter((word) => effWords.has(word));

  // Deduplicate and sort
  const unique = [...new Set(filtered)].sort();

  const outputPath = join(WORDLIST_DIR, source.output);
  await writeFile(outputPath, unique.join("\n") + "\n");
  console.log(
    `  ${source.output}: ${unique.length} words (from ${allValid.length} valid candidates)`
  );
}

console.log("\nDone! Word lists written to wordlists/");
