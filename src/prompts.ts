import * as p from "@clack/prompts";
import type { WordListName } from "./wordlist.ts";
import { WORDLIST_META } from "./wordlist.ts";
import type { SeparatorStyle, CapitalizeStyle } from "./entropy.ts";
import type { WordStyle } from "./patterns.ts";

export interface InteractiveConfig {
  wordStyle: WordStyle;
  wordLists: WordListName[];
  wordCount: number;
  separator: SeparatorStyle;
  customSeparator?: string;
  capitalize: CapitalizeStyle;
  passwordCount: number;
  clipboard: "first" | "all" | "none";
}

const ALL_LISTS: WordListName[] = ["eff-large", "eff-short-1", "eff-short-2"];

export async function runPrompts(): Promise<InteractiveConfig> {
  p.intro("pazzwrd — memorable password generator");

  const wordStyle = (await p.select({
    message: "Word style?",
    options: [
      {
        value: "sentence",
        label: "Sentence-like",
        hint: "words follow grammar patterns (recommended)",
      },
      {
        value: "random",
        label: "Random",
        hint: "all words from the same pool",
      },
    ],
    initialValue: "sentence",
  })) as WordStyle;

  if (p.isCancel(wordStyle)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const result = await p.group(
    {
      wordLists: () => {
        if (wordStyle === "sentence") return Promise.resolve([...ALL_LISTS]);
        return p.multiselect({
          message: "Which word lists?",
          options: ALL_LISTS.map((name) => ({
            value: name,
            label: `${WORDLIST_META[name].label} (${WORDLIST_META[name].count.toLocaleString()} words)`,
          })),
          initialValues: [...ALL_LISTS],
          required: true,
        });
      },
      wordCount: () =>
        p.select({
          message: "How many words?",
          options: [
            { value: 3, label: "3" },
            { value: 4, label: "4 (recommended)" },
            { value: 5, label: "5" },
            { value: 6, label: "6" },
            { value: 7, label: "7" },
          ],
          initialValue: 4,
        }),
      separator: () =>
        p.select({
          message: "Separator style?",
          options: [
            { value: "mixed", label: "Mixed numbers & symbols", hint: "Word42!Word85#Word" },
            { value: "numbers", label: "Numbers only", hint: "Word42Word85Word" },
            { value: "symbols", label: "Symbols only", hint: "Word!Word#Word" },
            { value: "custom", label: "Custom separator" },
            { value: "none", label: "None", hint: "WordWordWord" },
          ],
          initialValue: "mixed",
        }),
      customSeparator: ({ results }) => {
        if (results.separator !== "custom") return Promise.resolve(undefined);
        return p.text({
          message: "Enter your custom separator:",
          placeholder: "-",
          validate: (value) => {
            if (value.length === 0) return "Separator cannot be empty";
          },
        });
      },
      capitalize: () =>
        p.select({
          message: "Capitalize words?",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "random", label: "Random (randomly capitalize some)" },
          ],
          initialValue: "yes",
        }),
      passwordCount: () =>
        p.text({
          message: "How many passwords?",
          initialValue: "1",
          validate: (value) => {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1) return "Must be at least 1";
            if (num > 20) return "Maximum is 20";
          },
        }),
      clipboard: () =>
        p.select({
          message: "Copy to clipboard?",
          options: [
            { value: "first", label: "First password only" },
            { value: "all", label: "All passwords" },
            { value: "none", label: "No" },
          ],
          initialValue: "none",
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  return {
    wordStyle,
    wordLists: result.wordLists as WordListName[],
    wordCount: result.wordCount as number,
    separator: result.separator as SeparatorStyle,
    customSeparator: result.customSeparator as string | undefined,
    capitalize: result.capitalize as CapitalizeStyle,
    passwordCount: parseInt(result.passwordCount as string, 10),
    clipboard: result.clipboard as "first" | "all" | "none",
  };
}
