export type SeparatorStyle = "mixed" | "numbers" | "symbols" | "custom" | "none";
export type CapitalizeStyle = "yes" | "no" | "random";

export interface EntropyConfig {
  poolSize: number;
  wordCount: number;
  separator: SeparatorStyle;
  capitalize: CapitalizeStyle;
}

export function calculateEntropy(config: EntropyConfig): number {
  const { poolSize, wordCount, separator, capitalize } = config;
  const separatorSlots = Math.max(0, wordCount - 1);

  let entropy = wordCount * Math.log2(poolSize);

  if (separator === "mixed") {
    entropy += separatorSlots * Math.log2(90); // numbers 10–99
    entropy += separatorSlots * Math.log2(7); // symbols !@#$%&*
  } else if (separator === "numbers") {
    entropy += separatorSlots * Math.log2(90);
  } else if (separator === "symbols") {
    entropy += separatorSlots * Math.log2(7);
  }
  // "custom" and "none" add zero separator entropy

  if (capitalize === "random") {
    entropy += wordCount; // 1 bit per word
  }

  return entropy;
}

export interface SentenceEntropyConfig {
  patternCount: number;
  slotPoolSizes: number[];
  separator: SeparatorStyle;
  capitalize: CapitalizeStyle;
}

export function calculateSentenceEntropy(config: SentenceEntropyConfig): number {
  const { patternCount, slotPoolSizes, separator, capitalize } = config;
  const wordCount = slotPoolSizes.length;
  const separatorSlots = Math.max(0, wordCount - 1);

  // Pattern selection entropy
  let entropy = Math.log2(patternCount);

  // Per-slot word entropy
  for (const poolSize of slotPoolSizes) {
    entropy += Math.log2(poolSize);
  }

  // Separator entropy (same logic as calculateEntropy)
  if (separator === "mixed") {
    entropy += separatorSlots * Math.log2(90);
    entropy += separatorSlots * Math.log2(7);
  } else if (separator === "numbers") {
    entropy += separatorSlots * Math.log2(90);
  } else if (separator === "symbols") {
    entropy += separatorSlots * Math.log2(7);
  }

  // Capitalization entropy
  if (capitalize === "random") {
    entropy += wordCount;
  }

  return entropy;
}

export function formatEntropy(entropy: number): string {
  return `~${Math.round(entropy)} bits`;
}

/**
 * Estimate time to crack at 1 trillion guesses/second (offline attack).
 */
export function formatTimeToCrack(entropy: number): string {
  const guessesPerSecond = 1e12;
  const seconds = 2 ** entropy / guessesPerSecond;

  const minute = 60;
  const hour = 3600;
  const day = 86400;
  const year = 365.25 * day;
  const century = 100 * year;
  const millennium = 1000 * year;

  if (seconds < 1) return "instant";
  if (seconds < minute) return `~${Math.round(seconds)} seconds`;
  if (seconds < hour) return `~${Math.round(seconds / minute)} minutes`;
  if (seconds < day) return `~${Math.round(seconds / hour)} hours`;
  if (seconds < year) return `~${Math.round(seconds / day)} days`;
  if (seconds < century) return `~${Math.round(seconds / year)} years`;
  if (seconds < millennium) return `~${Math.round(seconds / century)} centuries`;
  return `~${Math.round(seconds / millennium).toLocaleString()} millennia`;
}
