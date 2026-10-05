import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// BAC-2124: lockfile-only security upgrade of js-yaml and browserslist in
// lua-hotel-agent. These regressions pin the lockfile entries the ticket
// fixes and the package.json ranges/overrides it must leave untouched.

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const pkg = read('../package.json');
const lock = read('../package-lock.json');

const atLeast = (v, min) => {
  const a = v.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

const entriesNamed = (name) =>
  Object.entries(lock.packages).filter(
    ([path]) => path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`),
  );

test('lockfile node_modules/js-yaml is >= 4.3.2, not 4.3.1', () => {
  const { version } = lock.packages['node_modules/js-yaml'];
  assert.notEqual(version, '4.3.1');
  assert.ok(atLeast(version, '4.3.2'), `js-yaml resolved to ${version}`);
});

test('every js-yaml copy in the lockfile is a fixed version (4.x >= 4.3.2 or 3.x >= 3.15.2)', () => {
  const copies = entriesNamed('js-yaml');
  assert.ok(copies.length >= 1, 'expected at least one js-yaml entry');
  for (const [path, { version }] of copies) {
    const major = Number(version.split('.')[0]);
    if (major === 3) {
      assert.ok(atLeast(version, '3.15.2'), `${path} resolved to js-yaml ${version}`);
    } else {
      assert.ok(atLeast(version, '4.3.2'), `${path} resolved to js-yaml ${version}`);
    }
  }
});

test('lockfile node_modules/browserslist is >= 4.28.7, not 4.28.4', () => {
  const { version } = lock.packages['node_modules/browserslist'];
  assert.notEqual(version, '4.28.4');
  assert.ok(atLeast(version, '4.28.7'), `browserslist resolved to ${version}`);
});

test('every browserslist copy in the lockfile is >= 4.28.7', () => {
  const copies = entriesNamed('browserslist');
  assert.ok(copies.length >= 1, 'expected at least one browserslist entry');
  for (const [path, { version }] of copies) {
    assert.ok(atLeast(version, '4.28.7'), `${path} resolved to browserslist ${version}`);
  }
});

test('package.json js-yaml range and override are unchanged (^4.3.1 / "js-yaml@4": "^4.3.1")', () => {
  assert.equal(pkg.dependencies['js-yaml'], '^4.3.1');
  assert.equal(pkg.overrides['js-yaml@4'], '^4.3.1');
  assert.equal(lock.packages[''].dependencies['js-yaml'], '^4.3.1');
});

test('installed js-yaml parses lua.skill.yaml', () => {
  const require = createRequire(import.meta.url);
  const yaml = require('js-yaml');
  const doc = yaml.load(readFileSync(new URL('../lua.skill.yaml', import.meta.url), 'utf8'));
  assert.equal(typeof doc, 'object');
  assert.ok(doc !== null);
  assert.ok('agent' in doc || 'skills' in doc, `unexpected top-level keys: ${Object.keys(doc)}`);
});
