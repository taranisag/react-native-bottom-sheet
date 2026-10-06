#!/usr/bin/env node
/*
 * Exercises every consumer of the transitive `handlebars` dependency in
 * taranisag/react-native-bottom-sheet, and asserts each one still renders.
 *
 * Consumers (both dev-only, release tooling):
 *   1. auto-changelog@2.2.1                  -> handlebars ^4.7.3  (repo's ./release-template.hbs + keepachangelog)
 *   2. conventional-changelog-writer@4.0.17  -> handlebars ^4.7.6  (release-it angular preset)
 *
 * Run from the repo root:  node verify-handlebars-consumers.js
 * Exit 0 = every consumer rendered the expected output.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = process.cwd();
const bin = n => path.join(repoRoot, 'node_modules/.bin', n);
const mod = n => path.join(repoRoot, 'node_modules', n);
const run = (cmd, args) =>
  execFileSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

const failures = [];
const results = [];

function check(name, fn, assertion) {
  let out;
  try {
    out = fn();
  } catch (e) {
    failures.push(`${name}: threw -> ${String(e.message).split('\n')[0]}`);
    results.push([name, 'FAIL (threw)', '']);
    return;
  }
  const ok = assertion(out);
  results.push([
    name,
    ok ? 'PASS' : 'FAIL',
    (out.split('\n').find(Boolean) || '(empty)').slice(0, 120),
  ]);
  if (!ok) failures.push(`${name}: rendered output failed its assertion`);
}

console.log(
  'handlebars resolved version:',
  require(mod('handlebars/package.json')).version
);
console.log(
  'auto-changelog version:',
  require(mod('auto-changelog/package.json')).version
);
console.log(
  'conventional-changelog-writer version:',
  require(mod('conventional-changelog-writer/package.json')).version
);
console.log('');

// --- Consumer 1a: auto-changelog rendering the repo's own release-template.hbs
//     (.release-it.json -> git.changelog + github.releaseNotes)
check(
  'auto-changelog + ./release-template.hbs (release-it releaseNotes)',
  () =>
    run(bin('auto-changelog'), [
      '--stdout',
      '--commit-limit',
      'false',
      '--ignore-commit-pattern',
      '^chore: release v',
      '--unreleased',
      '--template',
      './release-template.hbs',
      '--tag-pattern',
      '^v\\d+\\.\\d+\\.\\d+$',
    ]),
  out =>
    out.trim().startsWith('- ') &&
    out.includes(
      '](https://github.com/taranisag/react-native-bottom-sheet/pull/'
    )
);

// --- Consumer 1b: auto-changelog keepachangelog template (.release-it.json after:bump hook)
check(
  'auto-changelog + keepachangelog template (after:bump hook)',
  () =>
    run(bin('auto-changelog'), [
      '--stdout',
      '--ignore-commit-pattern',
      '^chore: release v',
      '--template',
      'keepachangelog',
      '--tag-pattern',
      '^v\\d+\\.\\d+\\.\\d+$',
    ]),
  out => out.startsWith('# Changelog') && /## \[v\d+\.\d+\.\d+\]/.test(out)
);

// --- Consumer 2: conventional-changelog-writer via the angular preset,
//     i.e. what @release-it/conventional-changelog drives on `yarn release`.
check(
  'conventional-changelog-core + angular preset (release-it plugin)',
  () => {
    const script = `
      const cc = require(${JSON.stringify(mod('conventional-changelog-core'))});
      let buf = '';
      cc({ preset: 'angular' }, { version: '9.9.9-verify' })
        .on('data', c => (buf += c))
        .on('end', () => process.stdout.write(buf))
        .on('error', e => { console.error(e); process.exit(1); });
    `;
    return run(process.execPath, ['-e', script]);
  },
  out => out.includes('9.9.9-verify') && /^#+ /m.test(out)
);

for (const [name, status, first] of results) {
  console.log(`[${status}] ${name}`);
  if (first) console.log(`        first line: ${first}`);
}
console.log('');
if (failures.length) {
  console.error('FAILURES:\n' + failures.map(f => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log(
  `All ${results.length} handlebars consumers rendered successfully.`
);
