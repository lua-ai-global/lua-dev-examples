// Regression check for BAC-1790: the transitive dependency baseline-browser-mapping
// (pulled in by browserslist) must resolve to a patched version (>= 2.11.0) in this
// project's own package-lock.json. The check is lockfile-only and has no dependencies.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PACKAGE_NAME = "baseline-browser-mapping";
const MINIMUM_VERSION = "2.11.0";

const here = dirname(fileURLToPath(import.meta.url));
const lockfilePath = join(here, "..", "package-lock.json");

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  assert.ok(match, `unparseable version "${version}"`);
  return match.slice(1, 4).map(Number);
}

function compareVersions(a, b) {
  const [aParts, bParts] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < 3; i += 1) {
    if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
  }
  return 0;
}

function findEntries() {
  const lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
  const suffix = `node_modules/${PACKAGE_NAME}`;
  return Object.entries(lockfile.packages ?? {}).filter(
    ([key]) => key === suffix || key.endsWith(`/${suffix}`),
  );
}

test("version comparison is numeric, not lexical", () => {
  assert.ok(compareVersions("2.11.27", MINIMUM_VERSION) >= 0);
  assert.ok(compareVersions("2.11.21", MINIMUM_VERSION) >= 0);
  assert.ok(compareVersions("2.11.0", MINIMUM_VERSION) >= 0);
  assert.ok(compareVersions("2.10.38", MINIMUM_VERSION) < 0);
  assert.ok(compareVersions("2.9.99", MINIMUM_VERSION) < 0);
});

test(`package-lock.json resolves ${PACKAGE_NAME} to >= ${MINIMUM_VERSION}`, () => {
  const entries = findEntries();
  assert.ok(entries.length > 0, `no ${PACKAGE_NAME} entry found in ${lockfilePath}`);

  for (const [key, entry] of entries) {
    assert.ok(
      compareVersions(entry.version, MINIMUM_VERSION) >= 0,
      `${key} resolves ${PACKAGE_NAME}@${entry.version}, expected >= ${MINIMUM_VERSION}`,
    );
    assert.ok(
      typeof entry.resolved === "string" && entry.resolved.endsWith(`-${entry.version}.tgz`),
      `${key} resolved URL "${entry.resolved}" does not end in -${entry.version}.tgz`,
    );
  }
});
