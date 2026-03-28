import { test, expect, describe } from "bun:test";
import { $ } from "bun";

const CLI = "src/cli.ts";

describe("default mode", () => {
  test("outputs just the password", async () => {
    const result = await $`bun ${CLI}`.text();
    const lines = result.trim().split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^[A-Z].+/);
  });

  test("password matches mixed separator pattern", async () => {
    const result = await $`bun ${CLI}`.text();
    const passwordLine = result.trim().split("\n")[0]!;
    const password = passwordLine.trim();
    // Pattern: Word[num][sym]Word[num][sym]Word[num][sym]Word
    expect(password).toMatch(
      /^[A-Z][a-z]+\d{2}[!@#$%&*][A-Z][a-z]+\d{2}[!@#$%&*][A-Z][a-z]+\d{2}[!@#$%&*][A-Z][a-z]+$/
    );
  });

  test("each run produces a different password", async () => {
    const result1 = await $`bun ${CLI}`.text();
    const result2 = await $`bun ${CLI}`.text();
    const pw1 = result1.trim().split("\n")[0];
    const pw2 = result2.trim().split("\n")[0];
    // Extremely unlikely to be equal with crypto randomness
    expect(pw1).not.toBe(pw2);
  });
});

describe("--help", () => {
  test("shows usage information", async () => {
    const result = await $`bun ${CLI} --help`.text();
    expect(result).toContain("pazzwrd");
    expect(result).toContain("Usage:");
    expect(result).toContain("-a");
  });

  test("-h alias works", async () => {
    const result = await $`bun ${CLI} -h`.text();
    expect(result).toContain("Usage:");
  });
});

describe("--version", () => {
  test("prints version number", async () => {
    const result = await $`bun ${CLI} --version`.text();
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("-v alias works", async () => {
    const result = await $`bun ${CLI} -v`.text();
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
