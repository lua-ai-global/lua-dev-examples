import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const FLOOR = [0, 35, 4];
const parse = (v) => v.split("-")[0].split(".").map(Number);
const lt = (a, b) => {
  const [x, y] = [parse(a), b];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
};

test("package.json overrides sharp to ^0.35.4 (GHSA-rgj7-g3m4-5g8c)", () => {
  assert.equal(pkg.overrides.sharp, "^0.35.4");
});

test("no sharp entry in the lockfile resolves below 0.35.4 (vulnerable sharp@0.34.5)", () => {
  const sharps = Object.entries(lock.packages).filter(([k]) => /(^|\/)node_modules\/sharp$/.test(k));
  assert.ok(sharps.length > 0);
  for (const [k, v] of sharps) {
    assert.notEqual(v.version, "0.34.5", k);
    assert.ok(!lt(v.version, FLOOR), `${k} resolves to ${v.version}`);
    assert.equal(parse(v.version)[0], 0, `${k} left the 0.x line`);
  }
});

test("@livekit/agents keeps its declared exact sharp pin; the override drives resolution", () => {
  const agents = lock.packages["node_modules/@livekit/agents"];
  assert.equal(agents.version, "1.4.8");
  assert.equal(agents.dependencies.sharp, "0.34.5");
});
