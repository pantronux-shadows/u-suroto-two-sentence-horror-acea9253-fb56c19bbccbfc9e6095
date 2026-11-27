// Two-Sentence Horror: writes one two-sentence story to the output dir.
// Deterministic: a single literal, no clock, no randomness, no network.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const STORY =
  "The registrar asked me to check my wife's details before printing the death certificate. " +
  "Everything matched except the cause, which said pending, and the informant's signature, " +
  "which was hers, dated this morning.";

function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv && fromEnv.length > 0 ? fromEnv : "/output";
}

// The gate: 1..400 characters of UTF-8 text, not only white space, and the
// round asks for exactly two sentences, so the program holds itself to that too.
function checkStory(text: string): string | null {
  const chars = [...text].length;
  if (chars < 1 || chars > 400) return `length ${chars} outside 1..400`;
  if (text.trim().length === 0) return "only white space";
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  if (sentences.length !== 2) return `expected 2 sentences, found ${sentences.length}`;
  if (!text.trimEnd().endsWith(".")) return "story does not end on a full stop";
  if (Buffer.byteLength(text, "utf8") !== chars) return "text is not ASCII (bytes != characters)";
  return null;
}

const problem = checkStory(STORY);
if (problem !== null) {
  throw new Error(`entry refused by its own gate: ${problem}`);
}

const dir = outputDir();
mkdirSync(dir, { recursive: true });
const path = join(dir, "entry.txt");
const bytes = Buffer.from(STORY, "utf8");
writeFileSync(path, bytes);

// Read the bytes back and hold them to the same gate, so a write that landed
// wrong can never pass silently.
const written = readFileSync(path);
if (!written.equals(bytes)) {
  throw new Error("entry.txt on disk differs from the story written");
}
const reread = checkStory(written.toString("utf8"));
if (reread !== null) {
  throw new Error(`entry.txt on disk fails the gate: ${reread}`);
}

process.stdout.write(`wrote ${bytes.length} bytes to ${path}\n`);
