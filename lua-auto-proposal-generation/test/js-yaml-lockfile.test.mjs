// BAC-2129 regression guard: the lockfile must never regress to a vulnerable js-yaml.
// Runs with Node's built-in runner, no extra dependencies:
//   node --test test/js-yaml-lockfile.test.mjs
// Set JS_YAML_LOCKFILE to point the test at another lockfile (used to prove it was red before the fix).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const lockfilePath =
  process.env.JS_YAML_LOCKFILE ?? resolve(here, "..", "package-lock.json");
const packageJsonPath = resolve(here, "..", "package.json");

const lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const parse = (v) => v.split(".").map(Number);
const gte = (a, b) => {
  const [a1, a2, a3] = parse(a);
  const [b1, b2, b3] = parse(b);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 >= b3;
};

const jsYamlEntries = Object.entries(lockfile.packages).filter(
  ([path]) => path === "node_modules/js-yaml" || path.endsWith("/node_modules/js-yaml"),
);

test("lockfile contains a js-yaml entry", () => {
  assert.ok(jsYamlEntries.length > 0, "expected at least one js-yaml entry in the lockfile");
});

test("no js-yaml 4.x entry is the vulnerable js-yaml@4.3.1 or older", () => {
  for (const [path, entry] of jsYamlEntries) {
    if (!entry.version.startsWith("4.")) continue;
    assert.notEqual(entry.version, "4.3.1", `${path} still resolves to js-yaml@4.3.1`);
    assert.ok(gte(entry.version, "4.3.2"), `${path} resolves js-yaml@${entry.version}, need >=4.3.2`);
    assert.equal(entry.resolved, `https://registry.npmjs.org/js-yaml/-/js-yaml-${entry.version}.tgz`);
    assert.match(entry.integrity, /^sha512-/);
  }
});

test("any js-yaml 3.x entry is >=3.15.2", () => {
  for (const [path, entry] of jsYamlEntries) {
    if (!entry.version.startsWith("3.")) continue;
    assert.ok(gte(entry.version, "3.15.2"), `${path} resolves js-yaml@${entry.version}, need >=3.15.2`);
  }
});

test("resolved js-yaml still satisfies lua-cli's declared range ^4.1.0", () => {
  const luaCli = lockfile.packages["node_modules/lua-cli"];
  assert.equal(luaCli.dependencies["js-yaml"], "^4.1.0");
  const [, entry] = jsYamlEntries.find(([path]) => path === "node_modules/js-yaml");
  assert.ok(entry.version.startsWith("4.") && gte(entry.version, "4.1.0"),
    `js-yaml@${entry.version} does not satisfy ^4.1.0`);
});

test('package.json keeps the existing override "js-yaml@4": "^4.3.1" unchanged', () => {
  assert.equal(packageJson.overrides["js-yaml@4"], "^4.3.1");
});
