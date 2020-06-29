import { initUrqlClient } from '../init-urql-client';

describe('initUrqlClient', () => {
  it('should return the urqlClient instance (suspense)', () => {
    const urqlClient = initUrqlClient(
      {
        url: 'http://localhost:3000',
      },
      true
    );

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
  });

  it('should return the urqlClient instance (no-suspense)', () => {
    const urqlClient = initUrqlClient(
      {
        url: 'http://localhost:3000',
      },
      false
    );

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', false);
  });
});
