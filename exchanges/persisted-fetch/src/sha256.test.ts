/**
 * @jest-environment node
 */

import { sha256 as sha25Standard } from 'js-sha256';
import { hash } from './sha256';

describe('hash', () => {
  it('is spec-compliant', async () => {
    expect(await hash('Hello')).toMatchInlineSnapshot(
      `"185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969"`
    );
    expect(await hash('Hello')).toBe(sha25Standard('Hello'));
  });
});
