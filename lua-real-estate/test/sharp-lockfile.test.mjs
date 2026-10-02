import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const pkgs = lock.packages;

const parse = (v) => v.split(".").map(Number);
const lt = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
};

test("node_modules/sharp resolves to 0.35.4 or later on the 0.35 line, not 0.34.5", () => {
  const v = pkgs["node_modules/sharp"].version;
  assert.notEqual(v, "0.34.5");
  assert.ok(v.startsWith("0.35."), `sharp ${v} is not on the 0.35 line`);
  assert.ok(!lt(v, "0.35.4"), `sharp ${v} is below 0.35.4`);
});

test("no sharp entry in the lockfile resolves below 0.35.4", () => {
  const sharps = Object.entries(pkgs).filter(([p]) => /(^|\/)node_modules\/sharp$/.test(p));
  assert.ok(sharps.length > 0);
  for (const [p, e] of sharps) assert.ok(!lt(e.version, "0.35.4"), `${p} is ${e.version}`);
});

test("@img/sharp-* platform packages are no longer at 0.34.5", () => {
  const img = Object.entries(pkgs).filter(([p]) => /node_modules\/@img\/sharp-(?!libvips)/.test(p));
  assert.ok(img.length > 0);
  for (const [p, e] of img) assert.notEqual(e.version, "0.34.5", p);
});

test("package.json scopes the sharp override to @livekit/agents and keeps undici@6", () => {
  const pj = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(pj.overrides["@livekit/agents"], { sharp: "^0.35.4" });
  assert.equal(pj.overrides["undici@6"], "^6.28.0");
});
