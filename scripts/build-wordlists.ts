// scripts/build-wordlists.ts
//
// Downloads hand-curated POS word lists from darioteixeira/passmaker (ISC license).
// These lists are specifically designed for passphrase generation:
// - 2048 nouns, 2048 adjectives, 1024 verbs
// - Common, concrete, everyday words
// - Min edit distance of 2 between words in same category

import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDLIST_DIR = join(__dirname, "..", "wordlists");

const BASE =
  "https://raw.githubusercontent.com/darioteixeira/passmaker/master/resources";

const SOURCES = [
  { url: `${BASE}/nouns.txt`, output: "nouns.txt" },
  { url: `${BASE}/verbs.txt`, output: "verbs.txt" },
  { url: `${BASE}/adjectives.txt`, output: "adjectives.txt" },
];

for (const source of SOURCES) {
  console.log(`Fetching ${source.output}...`);
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  const raw = await response.text();

  const words = raw
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const unique = [...new Set(words)].sort();

  const outputPath = join(WORDLIST_DIR, source.output);
  await writeFile(outputPath, unique.join("\n") + "\n");
  console.log(`  ${source.output}: ${unique.length} words`);
}

console.log("\nDone! Word lists written to wordlists/");
