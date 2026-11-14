import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expertFirstName, reviewAuthorLabel } from '../../src/features/experts/types';

test('expert first name skips leading salutations', () => {
  assert.equal(expertFirstName('Pandita Soniya Bajaj'), 'Soniya');
  assert.equal(expertFirstName('Smt. Soniya Bajaj'), 'Soniya');
  assert.equal(expertFirstName('Shri Akshay Rajkumar Joshi'), 'Akshay');
  assert.equal(expertFirstName('Shree Hemanshu Tirupati Joshi'), 'Hemanshu');
});

test('expert first name preserves ordinary first names', () => {
  assert.equal(expertFirstName('Anita Sharma'), 'Anita');
  assert.equal(expertFirstName('Shri. Akshay Joshi'), 'Akshay');
});

test('review author labels hide internal seed or placeholder names', () => {
  assert.equal(reviewAuthorLabel('Seed'), 'A customer');
  assert.equal(reviewAuthorLabel('test'), 'A customer');
  assert.equal(reviewAuthorLabel('Ananya'), 'Ananya');
  assert.equal(reviewAuthorLabel(null), 'A customer');
});
