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

const jsYamlPaths = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/js-yaml$/.test(k));

test('package.json keeps the override "js-yaml@4": "^4.3.1", which admits 4.3.2', () => {
  assert.equal(pkg.overrides['js-yaml@4'], '^4.3.1');
});

test('lockfile has exactly one js-yaml entry, the hoisted node_modules/js-yaml', () => {
  assert.deepEqual(jsYamlPaths, ['node_modules/js-yaml']);
});

test('node_modules/js-yaml is js-yaml@4.3.2 (>= 4.3.2 fix floor), never js-yaml@4.3.1', () => {
  const { version } = lock.packages['node_modules/js-yaml'];
  assert.notEqual(version, '4.3.1');
  assert.ok(atLeast(version, '4.3.2'), `js-yaml resolved to ${version}`);
  for (const p of jsYamlPaths) assert.ok(atLeast(lock.packages[p].version, '4.3.2'), `${p} resolved to ${lock.packages[p].version}`);
});

test('js-yaml 4.3.2 entry carries the matching resolved URL and integrity hash', () => {
  const entry = lock.packages['node_modules/js-yaml'];
  if (entry.version === '4.3.2') {
    assert.equal(entry.resolved, 'https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.2.tgz');
    assert.equal(
      entry.integrity,
      'sha512-SFNOvSJ+Dgf/9An904Yx+CgSlIPCkIpao4qo51lpee25TIRejdH3rhR4EZMGoNx3/TP3O+wzWuiTFl4sqbltzA==',
    );
  } else {
    assert.match(entry.resolved, new RegExp(`/js-yaml-${entry.version.replace(/\\./g, '\\\\.')}\\.tgz$`));
    assert.match(entry.integrity, /^sha512-/);
  }
});

test('the only consumer range "js-yaml": "^4.1.0" is satisfied by the resolved version', () => {
  const consumers = Object.values(lock.packages).filter((p) => p.dependencies && p.dependencies['js-yaml']);
  assert.ok(consumers.length > 0);
  for (const c of consumers) assert.equal(c.dependencies['js-yaml'], '^4.1.0');
  const { version } = lock.packages['node_modules/js-yaml'];
  assert.ok(version.startsWith('4.') && atLeast(version, '4.1.0'), `${version} does not satisfy ^4.1.0`);
});
