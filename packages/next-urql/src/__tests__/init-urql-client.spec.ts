import { initUrqlClient } from '../init-urql-client';

describe('initUrqlClient', () => {
  it('should return the urqlClient instance', () => {
    const urqlClient = initUrqlClient({
      url: 'http://localhost:3000',
    });

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
  });
});
