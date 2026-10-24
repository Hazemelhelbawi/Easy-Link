import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSfa } from '../src/utils/normalize.js';
import { countUniqueSfa, sfaBreakdown } from '../src/services/metrics.js';

test('normalizeSfa cleans float/string/whitespace and drops empty', () => {
  assert.equal(normalizeSfa(191575), '191575');
  assert.equal(normalizeSfa(191575.0), '191575');
  assert.equal(normalizeSfa('191575 '), '191575');
  assert.equal(normalizeSfa('191575.0'), '191575');
  assert.equal(normalizeSfa(''), '');
  assert.equal(normalizeSfa(null), '');
  assert.equal(normalizeSfa(undefined), '');
  assert.equal(normalizeSfa(Number.NaN), '');
  assert.equal(normalizeSfa('nan'), '');
});

test('countUniqueSfa counts distinct cleaned values', () => {
  assert.equal(countUniqueSfa([]), 0);
  assert.equal(countUniqueSfa(null), 0);
  assert.equal(
    countUniqueSfa([
      { sfa: 191575 },
      { sfa: '191575 ' },
      { sfa: '191575.0' },
      { sfa: 42 },
      { sfa: '' },
      { sfa: null },
    ]),
    2,
  );
});

test('sfaBreakdown sorts by orders desc and ignores empty SFA', () => {
  const rows = sfaBreakdown([
    { sfa: 'A', status: 'applied' },
    { sfa: 'A', status: 'applied' },
    { sfa: 'B', status: 'lost' },
    { sfa: '', status: 'applied' },
    { sfa: 'A', status: 'underActivation' },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].sfa, 'A');
  assert.equal(rows[0].orders, 3);
  assert.equal(rows[0].applied, 2);
  assert.equal(rows[0].underActivation, 1);
  assert.equal(rows[0].lost, 0);
  assert.equal(rows[1].sfa, 'B');
  assert.equal(rows[1].orders, 1);
});
