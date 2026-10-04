import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
const lock = read("../package-lock.json");
const pkg = read("../package.json");

const parse = (v) => v.split("-")[0].split(".").map(Number);
const gte = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return true;
};

const minimums = {
  browserslist: "4.28.7",
  "js-yaml": "4.3.2",
  sharp: "0.35.4",
  "baseline-browser-mapping": "2.11.0",
};

for (const [name, min] of Object.entries(minimums)) {
  test(`lockfile resolves ${name} >= ${min}`, () => {
    const entry = lock.packages[`node_modules/${name}`];
    assert.ok(entry, `${name} missing from lockfile`);
    assert.ok(gte(entry.version, min), `${name} ${entry.version} < ${min}`);
  });
}

test("semver compare accepts boundaries and rejects older versions", () => {
  for (const [v, min] of Object.entries({ "4.28.7": "4.28.7", "4.3.2": "4.3.2", "0.35.4": "0.35.4", "2.11.0": "2.11.0" })) {
    assert.ok(gte(v, min), `${v} should be >= ${min}`);
  }
  assert.ok(!gte("4.28.6", "4.28.7"));
  assert.ok(!gte("4.3.1", "4.3.2"));
  assert.ok(!gte("0.35.3", "0.35.4"));
  assert.ok(!gte("2.10.38", "2.11.0"));
});

test("package.json declares the pinned ranges", () => {
  assert.equal(pkg.dependencies["js-yaml"], "^4.3.2");
  assert.equal(pkg.overrides["js-yaml@4"], "^4.3.2");
  assert.equal(pkg.overrides.browserslist, "^4.28.7");
  assert.equal(pkg.overrides.sharp, "^0.35.4");
});
