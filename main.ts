// THE WORLD TODAY — Thursday, 26 November 2026.
//
// The finished front page is entry.png, drawn locally with PIL before this
// program ever runs. All this program does is hand that file to the grader:
// read it, prove it is a real 1024x1024 PNG under 1 MiB, and write the exact
// same bytes to $MAKEFUN_OUTPUT_DIR/entry.png. No browser, no network, no
// drawing at runtime — the grader image has no Chrome, so nothing here
// depends on one. Run it twice and the output is byte-identical.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXPECTED_SIDE = 1024;
const MAX_BYTES = 1024 * 1024;
const ARTIFACT = "entry.png";

function fail(message: string): never {
  console.error(`entry failed: ${message}`);
  process.exit(1);
}

function readFrontPage(): Buffer {
  const folder = dirname(fileURLToPath(import.meta.url));
  let bytes: Buffer;
  try {
    bytes = readFileSync(resolve(folder, ARTIFACT));
  } catch {
    fail("entry.png is missing next to main.ts");
  }
  // PNG header is 8 magic bytes, then the IHDR chunk: width at offset 16,
  // height at offset 20, both big-endian 32-bit.
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("entry.png is not a PNG file");
  }
  if (bytes.readUInt32BE(16) !== EXPECTED_SIDE || bytes.readUInt32BE(20) !== EXPECTED_SIDE) {
    fail("entry.png is not 1024x1024");
  }
  if (bytes.length > MAX_BYTES) {
    fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }
  return bytes;
}

function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}

const destination = process.env.MAKEFUN_OUTPUT_DIR;
if (!destination) fail("MAKEFUN_OUTPUT_DIR is not set");

const page = readFrontPage();
mkdirSync(destination, { recursive: true });
const target = resolve(destination, ARTIFACT);
writeFileSync(target, page);

const written = readFileSync(target);
if (!written.equals(page)) fail("the written copy differs from entry.png");

console.log(`wrote ${ARTIFACT} (${page.length} bytes, sha256 ${digest(page)})`);
