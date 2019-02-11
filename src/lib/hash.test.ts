import { hashString } from './hash';

describe('hash', () => {
  it('should returned a murmur hashed string from a query string', () => {
    expect(hashString(`{ todos { id } }`)).toMatchSnapshot();
  });
});
