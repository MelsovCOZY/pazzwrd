#!/usr/bin/env bun

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPOSWordLists } from "./wordlist.ts";
import { generateSentencePassword } from "./generator.ts";
const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  const raw = await readFile(join(__dirname, "..", "package.json"), "utf-8");
  const pkg = JSON.parse(raw);
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes("-a")) {
  // Interactive mode — implemented in Task 7
  const { runInteractiveMode } = await import("./interactive.ts");
  await runInteractiveMode();
} else {
  await runDefaultMode();
}

async function runDefaultMode() {
  const posLists = await loadPOSWordLists();
  const result = generateSentencePassword({
    posWordLists: posLists,
    wordCount: 5,
    separator: "mixed",
    capitalize: "yes",
  });

  if (!result) {
    console.error("Error: No grammar patterns available for word count 4");
    process.exit(1);
  }

  console.log(result.password);
}

function printHelp() {
  console.log(`
pazzwrd — memorable password generator

Usage:
  pazzwrd        Generate a password with smart defaults
  pazzwrd -a     Interactive mode with full customization

Options:
  -a           Interactive mode
  -h, --help   Show this help message
  -v, --version Show version

Examples:
  $ pazzwrd
  Brave42!Palace85#Flip29&Dry17*River
`);
}
