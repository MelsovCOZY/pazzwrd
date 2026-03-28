import { test, expect, describe } from "bun:test";
import { $ } from "bun";

describe("e2e: pazzwrd global command", () => {
  test("pazzwrd outputs just a password", async () => {
    const result = await $`pazzwrd`.text();
    const lines = result.trim().split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^[A-Z].+/);
  });

  test("pazzwrd password matches mixed separator pattern", async () => {
    const result = await $`pazzwrd`.text();
    const password = result.trim();
    // Same format: Word[num][sym]Word[num][sym]Word[num][sym]Word
    expect(password).toMatch(
      /^[A-Z][a-z]+\d{2}[!@#$%&*][A-Z][a-z]+\d{2}[!@#$%&*][A-Z][a-z]+\d{2}[!@#$%&*][A-Z][a-z]+$/
    );
  });

  test("pazzwrd --help shows usage", async () => {
    const result = await $`pazzwrd --help`.text();
    expect(result).toContain("Usage:");
  });

  test("pazzwrd --version shows version", async () => {
    const result = await $`pazzwrd --version`.text();
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("each run produces a different password", async () => {
    const result1 = await $`pazzwrd`.text();
    const result2 = await $`pazzwrd`.text();
    expect(result1.trim()).not.toBe(result2.trim());
  });
});
