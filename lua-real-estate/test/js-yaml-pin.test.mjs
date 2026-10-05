import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Regression for BAC-2131 (split from BAC-1683): lockfile-only bump of js-yaml
// in lua-real-estate from 4.3.1 to >=4.3.2, within the existing override and
// lua-cli range. Mirrors the convention of lua-shopping-assistant/test/sharp-pin.test.mjs
// (introduced by changelog.d/BAC-768.md) and runs with `node --test test/js-yaml-pin.test.mjs` from lua-real-estate/.
const readJson = (name) => JSON.parse(readFileSync(join(process.cwd(), name), "utf8"));
const lock = readJson("package-lock.json");
const pkg = readJson("package.json");

const parse = (v) => v.split(".").map(Number);
const gte = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return true;
};

const jsYamlPaths = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/js-yaml$/.test(k));

test("the only js-yaml entry is node_modules/js-yaml, resolved at >=4.3.2 (not 4.3.1)", () => {
  assert.deepEqual(jsYamlPaths, ["node_modules/js-yaml"]);
  const entry = lock.packages["node_modules/js-yaml"];
  assert.notEqual(entry.version, "4.3.1");
  assert.ok(gte(entry.version, "4.3.2"), `expected >=4.3.2, got ${entry.version}`);
  assert.equal(entry.resolved, `https://registry.npmjs.org/js-yaml/-/js-yaml-${entry.version}.tgz`);
  assert.match(entry.integrity, /^sha512-/);
});

test("no 3.x js-yaml copy exists anywhere in the lockfile", () => {
  const stale = jsYamlPaths.filter((p) => lock.packages[p].version.startsWith("3."));
  assert.deepEqual(stale, []);
});

test('package.json keeps the existing override "js-yaml@4": "^4.3.1" and nothing else for js-yaml', () => {
  assert.equal(pkg.overrides["js-yaml@4"], "^4.3.1");
  assert.equal(pkg.overrides["js-yaml"], undefined);
  assert.equal(pkg.dependencies?.["js-yaml"], undefined);
  assert.equal(pkg.devDependencies?.["js-yaml"], undefined);
});

test('lua-cli still declares "js-yaml": "^4.1.0" and the resolved version satisfies both ranges', () => {
  const luaCli = lock.packages["node_modules/lua-cli"];
  assert.equal(luaCli.dependencies["js-yaml"], "^4.1.0");
  const { version } = lock.packages["node_modules/js-yaml"];
  assert.ok(version.startsWith("4."), version);
  assert.ok(gte(version, "4.3.1"), version);
});
