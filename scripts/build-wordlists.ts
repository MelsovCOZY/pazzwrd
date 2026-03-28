// scripts/build-wordlists.ts
//
// Downloads POS word lists from verachell repo, then filters through:
// 1. EFF large list (quality baseline)
// 2. Top 10k most frequent English words (OpenSubtitles corpus)
// 3. Per-category blocklists (remove mis-tagged words)
// Result: common, everyday words that form readable sentence-like passwords.

import { writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDLIST_DIR = join(__dirname, "..", "wordlists");

const POS_BASE =
  "https://raw.githubusercontent.com/verachell/English-word-lists-parts-of-speech-approximate/refs/heads/main";

const FREQ_URL =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt";

const FREQ_CUTOFF = 10_000;

const SOURCES = [
  { url: `${POS_BASE}/nouns/mostly-nouns.txt`, output: "nouns.txt" },
  { url: `${POS_BASE}/verbs/mostly-verbs-infinitive.txt`, output: "verbs.txt" },
  { url: `${POS_BASE}/other-categories/mostly-adjectives.txt`, output: "adjectives.txt" },
  { url: `${POS_BASE}/other-categories/mostly-adverbs.txt`, output: "adverbs.txt" },
];

// Words mis-tagged in the verachell lists — primarily used as a different POS
const BLOCKLIST: Record<string, Set<string>> = {
  "verbs.txt": new Set([
    // primarily nouns
    "author", "carpet", "clock", "costume", "cradle", "factor", "fantasy",
    "garden", "image", "iron", "kennel", "laurel", "lumber", "machine",
    "mandate", "marble", "market", "master", "mirror", "model", "motor",
    "office", "orbit", "palace", "pardon", "pattern", "pepper", "pilot",
    "pistol", "planet", "plaster", "platter", "pocket", "poison", "portion",
    "posture", "practice", "premise", "profile", "program", "quarrel",
    "radar", "ransom", "reason", "rival", "rocket", "rubber", "saddle",
    "sandal", "signal", "target", "timber", "tower", "trumpet", "turtle",
    "venture", "verse", "visa", "voltage", "warrant", "whistle",
    // past tense / not infinitive
    "given", "gotten", "said", "spoken", "sworn", "written",
    // primarily adjectives
    "abstract", "average", "bitter", "bottom", "counter", "double",
    "express", "faint", "humble", "idle", "level", "minute", "narrow",
    "parallel", "rival", "round", "savage", "secure", "select", "separate",
    "single", "slim", "smooth", "spare", "split", "standard", "still",
    "suspect", "total", "triple", "twin", "void", "worst",
  ]),
  "adjectives.txt": new Set([
    // primarily nouns
    "august", "bluff", "bridal", "carbon", "county", "express", "freight",
    "fresco", "gadget", "gazette", "granite", "hemp", "mandate", "marine",
    "patent", "plaid", "premium", "quartz", "ransom", "rebel", "retail",
    "salmon", "satin", "scarlet", "sequel", "sherbet", "shuttle", "signal",
    "silicon", "soprano", "soulful", "stimulant", "surplus", "terrain",
    "token", "torpedo", "trinket", "truffle", "turmoil", "verdict",
    // primarily verbs
    "alert", "compound", "content", "counter", "elaborate", "intimate",
    "parallel", "quit", "separate", "suspect",
    // not really adjectives in common usage
    "cutback", "expletive", "ground", "overdue", "pasty", "psychic",
    "satellite", "stencil",
  ]),
  "adverbs.txt": new Set([
    // primarily nouns / adjectives / other POS
    "champion", "item", "large", "left", "opposite", "snap", "sudden",
    "that", "worst", "fifth", "seventh", "ninth", "second", "third",
    "sixth", "eighth", "tenth", "first", "next", "right",
    // not really adverbs
    "uncommon", "tiptop", "drizzly", "flying", "devoutly", "reputably",
    "aflame", "ablaze", "aflutter", "afoot", "aground", "ajar",
  ]),
  "nouns.txt": new Set([
    // not really common nouns / abstract jargon
    "acuteness", "aeration",
  ]),
};

function isValid(word: string): boolean {
  return /^[a-z]{3,9}$/.test(word);
}

// Load EFF large list
const effPath = join(WORDLIST_DIR, "eff-large.txt");
const effRaw = await readFile(effPath, "utf-8");
const effWords = new Set(
  effRaw.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean)
);

// Load frequency list
console.log(`Fetching frequency list (top ${FREQ_CUTOFF})...`);
const freqResponse = await fetch(FREQ_URL);
if (!freqResponse.ok) throw new Error(`Failed to fetch frequency list: ${freqResponse.status}`);
const freqRaw = await freqResponse.text();
const frequentWords = new Set(
  freqRaw
    .split("\n")
    .slice(0, FREQ_CUTOFF)
    .map((line) => line.split(" ")[0]!.trim().toLowerCase())
    .filter(Boolean)
);
console.log(`  Loaded ${frequentWords.size} frequent words\n`);

for (const source of SOURCES) {
  console.log(`Fetching ${source.url}...`);
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  const raw = await response.text();

  const blocked = BLOCKLIST[source.output] ?? new Set();

  const allValid = raw
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((word) => word.length > 0 && isValid(word));

  const filtered = allValid.filter(
    (word) => effWords.has(word) && frequentWords.has(word) && !blocked.has(word)
  );

  const unique = [...new Set(filtered)].sort();

  const outputPath = join(WORDLIST_DIR, source.output);
  await writeFile(outputPath, unique.join("\n") + "\n");
  console.log(
    `  ${source.output}: ${unique.length} words (${blocked.size} blocked)`
  );
}

console.log("\nDone! Word lists written to wordlists/");
