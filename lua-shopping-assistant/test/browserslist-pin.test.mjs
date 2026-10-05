import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const readJson = (name) => JSON.parse(readFileSync(join(process.cwd(), name), "utf8"));
const lock = readJson("package-lock.json");
const pkg = readJson("package.json");
const browserslistPaths = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/browserslist$/.test(k));

const satisfiesCaret = (version, range) => {
  // minimal ^x.y.z check: same major, and >= x.y.z
  const min = range.replace(/^\^/, "").split(".").map(Number);
  const v = version.split(".").map(Number);
  if (v[0] !== min[0]) return false;
  for (let i = 0; i < 3; i++) if (v[i] !== min[i]) return v[i] > min[i];
  return true;
};

test("every resolved node_modules/browserslist is 4.29.3, never the vulnerable 4.28.2", () => {
  assert.ok(browserslistPaths.length > 0);
  for (const p of browserslistPaths) {
    assert.equal(lock.packages[p].version, "4.29.3", p);
    assert.notEqual(lock.packages[p].version, "4.28.2", p);
  }
});

test("browserslist resolves to the registry tarball for 4.29.3 with an integrity hash", () => {
  const entry = lock.packages["node_modules/browserslist"];
  assert.equal(entry.resolved, "https://registry.npmjs.org/browserslist/-/browserslist-4.29.3.tgz");
  assert.match(entry.integrity, /^sha512-/);
});

test("autoprefixer still declares browserslist ^4.28.2 and that range is satisfied by 4.29.3", () => {
  const range = lock.packages["node_modules/autoprefixer"].dependencies.browserslist;
  assert.equal(range, "^4.28.2");
  assert.ok(satisfiesCaret("4.29.3", range));
  assert.ok(satisfiesCaret(lock.packages["node_modules/browserslist"].version, range));
});

test("browserslist is lockfile-only: not a direct dependency and not an override in package.json", () => {
  assert.equal((pkg.dependencies ?? {}).browserslist, undefined);
  assert.equal((pkg.devDependencies ?? {}).browserslist, undefined);
  assert.equal((pkg.overrides ?? {}).browserslist, undefined);
});

test("no unrelated upgrade: sharp still resolves 0.35.4 under the @livekit/agents override", () => {
  assert.equal(lock.packages["node_modules/@livekit/agents/node_modules/sharp"].version, "0.35.4");
  assert.deepEqual(pkg.overrides["@livekit/agents"], { sharp: "0.35.4" });
});

test("changelog.d/BAC-2132.md exists as a one-line fragment mirroring changelog.d/BAC-768.md", () => {
  const fragment = join(process.cwd(), "..", "changelog.d", "BAC-2132.md");
  const precedent = join(process.cwd(), "..", "changelog.d", "BAC-768.md");
  assert.ok(existsSync(precedent));
  assert.ok(existsSync(fragment));
  const line = readFileSync(fragment, "utf8").trim();
  assert.equal(line.split("\n").length, 1);
  assert.ok(line.startsWith("lua-shopping-assistant: "), line);
  assert.ok(line.includes("browserslist 4.28.2 to 4.29.3"), line);
  assert.ok(line.includes("lockfile only"), line);
});
