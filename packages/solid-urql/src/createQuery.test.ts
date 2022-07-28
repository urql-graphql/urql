import { createQuery } from './createQuery';

describe('createQuery', () => {
  it('does a thing', () => {
    createQuery(() => ({
      query: `{ test }`,
    }));

    expect(true).toBeTruthy();
  });
});
