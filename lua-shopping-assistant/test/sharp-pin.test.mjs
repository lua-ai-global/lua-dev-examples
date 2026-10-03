import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readJson = (name) => JSON.parse(readFileSync(join(process.cwd(), name), "utf8"));
const lock = readJson("package-lock.json");
const pkg = readJson("package.json");
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

test("sharp override uses npm's nested-object form, never the invalid '>' cascade key", () => {
  assert.deepEqual(Object.keys(pkg.overrides).filter((k) => k.includes(">")), []);
  assert.ok(!("@livekit/agents>sharp" in pkg.overrides));
});

test("lockfile resolves sharp only under @livekit/agents at 0.35.4, with no 0.34.5 sharp or @img entry", () => {
  assert.equal(lock.packages["node_modules/@livekit/agents/node_modules/sharp"].version, "0.35.4");
  assert.equal(lock.packages["node_modules/sharp"], undefined);
  const stale = Object.entries(lock.packages).filter(
    ([k, v]) => /(^|\/)node_modules\/(sharp|@img\/sharp-[^/]+)$/.test(k) && v.version === "0.34.5",
  );
  assert.deepEqual(stale.map(([k]) => k), []);
});
