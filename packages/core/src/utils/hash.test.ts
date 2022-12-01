import { HashValue, phash } from './hash';
import { expect, it } from 'vitest';

it('hashes given strings', () => {
  expect(phash('hello')).toMatchInlineSnapshot('261238937');
});

it('hashes given strings and seeds', () => {
  let hash: HashValue;
  expect((hash = phash('hello'))).toMatchInlineSnapshot('261238937');
  expect((hash = phash('world', hash))).toMatchInlineSnapshot('-152191');
  expect((hash = phash('!', hash))).toMatchInlineSnapshot('-5022270');
  expect(typeof hash).toBe('number');
});
