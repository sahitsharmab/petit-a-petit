/**
 * Make a password hash for a learner's USER_<ID>_PASSWORD_HASH environment variable.
 *   npm run hash-password
 * The password is read from the terminal (not the command line, so it stays out of shell history).
 */
import { randomBytes } from "node:crypto";
import readline from "node:readline";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const tty = !!process.stdin.isTTY;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
  const lines = rl[Symbol.asyncIterator]();
  let muted = false;
  if (tty) {
    // Hide typed characters while a password is being entered.
    const r = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    const write = r._writeToOutput.bind(rl);
    r._writeToOutput = (s: string) => { if (!muted) write(s); };
  }
  const ask = async (q: string) => {
    process.stdout.write(q);
    muted = true;
    const { value, done } = await lines.next();
    muted = false;
    process.stdout.write("\n");
    if (done) throw new Error("No password entered.");
    // Piped input on Windows can start with a byte-order mark or end with a carriage return.
    return String(value).replace(/^﻿/, "").replace(/\r$/, "");
  };
  try {
    const pw = await ask("New password (8+ characters): ");
    const again = await ask("Type it again: ");
    if (pw !== again) throw new Error("The passwords don't match.");
    const hash = await hashPassword(pw);
    console.log("\nPassword hash (paste into USER_<ID>_PASSWORD_HASH):\n");
    console.log(hash);
    console.log("\nIf you still need a SESSION_SECRET, here is a fresh random one:\n");
    console.log(randomBytes(32).toString("base64url"));
  } finally {
    rl.close();
  }
}
main().catch((e) => { console.error((e as Error).message); process.exit(1); });
