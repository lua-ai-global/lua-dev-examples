import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const sharpPaths = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/sharp$/.test(k));

test("every resolved node_modules/sharp is 0.35.4, never 0.34.5 or 0.35.5", () => {
  assert.ok(sharpPaths.length > 0);
  for (const p of sharpPaths) assert.equal(lock.packages[p].version, "0.35.4", p);
});

test("all @img/sharp-* entries are consistent at 0.35.4", () => {
  const img = Object.entries(lock.packages).filter(([k]) => /node_modules\/@img\/sharp-(?!libvips)/.test(k));
  assert.ok(img.length > 0);
  for (const [k, v] of img) assert.equal(v.version, "0.35.4", k);
});

test("override is scoped to @livekit/agents and pinned to 0.35.4", () => {
  assert.deepEqual(pkg.overrides["@livekit/agents"], { sharp: "0.35.4" });
  assert.equal(pkg.overrides.sharp, undefined);
});

test("engines.node >=20.9.0 is declared in package.json and the lockfile root", () => {
  assert.equal(pkg.engines.node, ">=20.9.0");
  assert.equal(lock.packages[""].engines.node, ">=20.9.0");
});
