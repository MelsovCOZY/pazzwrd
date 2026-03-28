import { spawn } from "node:child_process";

export async function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;

  if (platform === "darwin") {
    return run("pbcopy", [], text);
  }

  if (platform === "win32") {
    return run("clip", [], text);
  }

  // Linux: try wl-copy (Wayland) first, then xclip, then xsel
  if (await run("wl-copy", [], text)) return true;
  if (await run("xclip", ["-selection", "clipboard"], text)) return true;
  if (await run("xsel", ["--clipboard", "--input"], text)) return true;

  return false;
}

function run(cmd: string, args: string[], input: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(cmd, args, { stdio: ["pipe", "ignore", "ignore"] });
      proc.on("error", () => resolve(false));
      proc.on("close", (code) => resolve(code === 0));
      proc.stdin.write(input);
      proc.stdin.end();
    } catch {
      resolve(false);
    }
  });
}
