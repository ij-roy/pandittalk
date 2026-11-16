import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSessionRemaining } from '../../src/features/sessions/sessionTimer';

test('server countdown display formats seconds as a stable minute:second timer', () => {
  assert.equal(formatSessionRemaining(900), '15:00');
  assert.equal(formatSessionRemaining(301), '5:01');
  assert.equal(formatSessionRemaining(9), '0:09');
  assert.equal(formatSessionRemaining(-1), '0:00');
});

