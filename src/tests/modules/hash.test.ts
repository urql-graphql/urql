import { hashString } from '../../lib/hash';

describe('hash', () => {
  it('should returned a murmur hashed string from a query string', () => {
    let hash = hashString(`{ todos { id } }`);
    expect(hash).toBe('1rvkz44');
  });
});
