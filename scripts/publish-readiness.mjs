#!/usr/bin/env node
/**
 * Pre-release checks for v1.0.0+ tags.
 * Usage: node scripts/publish-readiness.mjs [expectedVersion]
 * Example: node scripts/publish-readiness.mjs 1.0.0
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expected = process.argv[2] ?? '1.0.0';

const packageFiles = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'cli/package.json',
  'vscode-extension/package.json',
];

let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

for (const rel of packageFiles) {
  const json = JSON.parse(readFileSync(resolve(root, rel), 'utf8'));
  if (json.version !== expected) {
    fail(`${rel}: version ${json.version} !== ${expected}`);
  } else {
    ok(`${rel} @ ${json.version}`);
  }
}

const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes(`## [${expected}]`)) {
  fail(`CHANGELOG.md missing ## [${expected}] section`);
} else {
  ok(`CHANGELOG.md has [${expected}] section`);
}

const publishing = readFileSync(resolve(root, 'docs/PUBLISHING.md'), 'utf8');
if (!publishing.includes('NPM_TOKEN')) {
  fail('docs/PUBLISHING.md missing NPM_TOKEN guidance');
} else {
  ok('docs/PUBLISHING.md present');
}

if (failed) {
  console.error('\nPublish readiness check FAILED.');
  process.exit(1);
}

console.log(`\nPublish readiness check passed for v${expected}.`);
console.log('Next: configure secrets, then git tag v' + expected + ' && git push origin v' + expected);
