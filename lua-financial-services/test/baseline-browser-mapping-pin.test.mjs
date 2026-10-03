// BAC-1790: regression pin for the transitive baseline-browser-mapping entry.
// Versions below 2.11.0 (this lockfile previously resolved 2.10.38 / 2.10.32) are vulnerable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const lock = JSON.parse(readFileSync(join(process.cwd(), "package-lock.json"), "utf8"));
const ENTRY = "node_modules/baseline-browser-mapping";
const PINNED_VERSION = "2.11.21";
const PINNED_RESOLVED =
  "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.11.21.tgz";
const PINNED_INTEGRITY =
  "sha512-uh8vpY/1/YyFkunIDFH/12p7/7VdPKA1hejMVEbdkEaWnUz0Hesvx5EbiU6XxjyHZIOju+ZMbQJkRh+es3/spQ==";
const VULNERABLE_VERSIONS = ["2.10.38", "2.10.32"];

const bbmPaths = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/baseline-browser-mapping$/.test(k));
const parse = (v) => v.replace(/^[\^~]/, "").split(".").map(Number);
const gte = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return true;
};

test("node_modules/baseline-browser-mapping resolves 2.11.21 with the registry resolved URL and integrity", () => {
  const entry = lock.packages[ENTRY];
  assert.ok(entry, `${ENTRY} entry missing from package-lock.json`);
  assert.equal(entry.version, PINNED_VERSION);
  assert.equal(entry.resolved, PINNED_RESOLVED);
  assert.equal(entry.integrity, PINNED_INTEGRITY);
});

test("no baseline-browser-mapping entry (hoisted or nested) resolves 2.10.38 or 2.10.32, and all are at least 2.11.0", () => {
  assert.ok(bbmPaths.length > 0);
  for (const p of bbmPaths) {
    const v = lock.packages[p].version;
    assert.ok(!VULNERABLE_VERSIONS.includes(v), `${p} still resolves vulnerable ${v}`);
    assert.ok(gte(v, "2.11.0"), `${p} resolves ${v}, below 2.11.0`);
  }
});

test("browserslist's baseline-browser-mapping range is still satisfied by 2.11.21 without a parent change", () => {
  const range = lock.packages["node_modules/browserslist"].dependencies["baseline-browser-mapping"];
  assert.match(range, /^\^2\.10\.\d+$/, `unexpected browserslist range ${range}`);
  assert.ok(gte(PINNED_VERSION, range), `${PINNED_VERSION} does not satisfy ${range}`);
});
