import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const pkg = read('../package.json');
const lock = read('../package-lock.json');

const atLeast = (v, min) => {
  const a = v.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};
const satisfiesCaret = (v, range) => {
  const min = range.replace(/^\^/, '');
  return v.split('.')[0] === min.split('.')[0] && atLeast(v, min);
};

test('package.json keeps the scoped override js-yaml@4 at ^4.3.1 (no manifest change needed)', () => {
  assert.equal(pkg.overrides['js-yaml@4'], '^4.3.1');
  assert.equal(pkg.dependencies['js-yaml'], undefined);
});

test('lockfile node_modules/js-yaml is >= 4.3.2, never js-yaml@4.3.1', () => {
  const entry = lock.packages['node_modules/js-yaml'];
  assert.ok(entry, 'node_modules/js-yaml entry missing');
  assert.notEqual(`js-yaml@${entry.version}`, 'js-yaml@4.3.1');
  assert.ok(atLeast(entry.version, '4.3.2'), `js-yaml resolved to ${entry.version}`);
  assert.equal(entry.resolved, `https://registry.npmjs.org/js-yaml/-/js-yaml-${entry.version}.tgz`);
  assert.match(entry.integrity, /^sha512-/);
});

test('resolved js-yaml satisfies both the override range ^4.3.1 and lua-cli\'s declared ^4.1.0', () => {
  const { version } = lock.packages['node_modules/js-yaml'];
  assert.ok(satisfiesCaret(version, '^4.3.1'), `${version} does not satisfy ^4.3.1`);
  assert.equal(lock.packages['node_modules/lua-cli'].dependencies['js-yaml'], '^4.1.0');
  assert.ok(satisfiesCaret(version, '^4.1.0'), `${version} does not satisfy ^4.1.0`);
});

test('no nested or 3.x js-yaml copy below the fixed versions anywhere in the lockfile', () => {
  const copies = Object.entries(lock.packages).filter(([k]) => /(^|\/)node_modules\/js-yaml$/.test(k));
  assert.deepEqual(copies.map(([k]) => k), ['node_modules/js-yaml']);
  for (const [k, v] of copies) {
    const major = v.version.split('.')[0];
    const floor = major === '3' ? '3.15.2' : '4.3.2';
    assert.ok(atLeast(v.version, floor), `${k} is ${v.version}, below ${floor}`);
  }
});
