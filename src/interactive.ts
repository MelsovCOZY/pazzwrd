import { runPrompts } from "./prompts.ts";
import { loadWordLists, loadPOSWordLists } from "./wordlist.ts";
import { generatePassword, generateSentencePassword } from "./generator.ts";
import { formatEntropy, formatTimeToCrack } from "./entropy.ts";
import { copyToClipboard } from "./clipboard.ts";

export async function runInteractiveMode(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error(
      "Error: Interactive mode requires a terminal. Use `pazzwrd` without -a for non-interactive mode."
    );
    process.exit(1);
  }

  const config = await runPrompts();

  const passwords: string[] = [];
  let lastEntropy = 0;

  if (config.wordStyle === "sentence") {
    const posLists = await loadPOSWordLists();

    for (let i = 0; i < config.passwordCount; i++) {
      const result = generateSentencePassword({
        posWordLists: posLists,
        wordCount: config.wordCount,
        separator: config.separator,
        customSeparator: config.customSeparator,
        capitalize: config.capitalize,
      });

      if (!result) {
        // No grammar patterns for this word count — fall back to random
        console.log(`(No grammar patterns for ${config.wordCount} words — using random style)`);
        const words = await loadWordLists(config.wordLists);
        const fallback = generatePassword({
          words,
          wordCount: config.wordCount,
          separator: config.separator,
          customSeparator: config.customSeparator,
          capitalize: config.capitalize,
        });
        passwords.push(fallback.password);
        lastEntropy = fallback.entropy;
        console.log(fallback.password);
        // All subsequent passwords in this batch use same fallback
        for (let j = i + 1; j < config.passwordCount; j++) {
          const r = generatePassword({
            words,
            wordCount: config.wordCount,
            separator: config.separator,
            customSeparator: config.customSeparator,
            capitalize: config.capitalize,
          });
          passwords.push(r.password);
          lastEntropy = r.entropy;
          console.log(r.password);
        }
        break;
      }

      passwords.push(result.password);
      lastEntropy = result.entropy;
      console.log(result.password);
    }
  } else {
    const words = await loadWordLists(config.wordLists);

    for (let i = 0; i < config.passwordCount; i++) {
      const result = generatePassword({
        words,
        wordCount: config.wordCount,
        separator: config.separator,
        customSeparator: config.customSeparator,
        capitalize: config.capitalize,
      });
      passwords.push(result.password);
      lastEntropy = result.entropy;
      console.log(result.password);
    }
  }

  // Strength summary
  const entropyStr = formatEntropy(lastEntropy);
  const crackTime = formatTimeToCrack(lastEntropy);
  if (config.passwordCount === 1) {
    console.log(
      `${entropyStr} | ${crackTime} to crack | ${passwords[0]!.length} chars`
    );
  } else {
    console.log(
      `${entropyStr} each | ${crackTime} to crack`
    );
  }

  // Clipboard
  if (config.clipboard !== "none") {
    const textToCopy =
      config.clipboard === "first" ? passwords[0]! : passwords.join("\n");
    const success = await copyToClipboard(textToCopy);
    if (success) {
      const label =
        config.clipboard === "first" ? "first password" : "all passwords";
      console.log(`Copied ${label} to clipboard`);
    } else {
      console.log(`Could not copy to clipboard`);
    }
  }
}
