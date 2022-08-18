import { Client } from '@urql/core';
import { initUrqlClient } from '../init-urql-client';

describe('initUrqlClient', () => {
  it('should return the urqlClient instance (suspense)', () => {
    const urqlClient = initUrqlClient(
      {
        url: 'http://localhost:3000',
      },
      true
    );

    expect(urqlClient).toBeInstanceOf(Client);
    expect(urqlClient).toHaveProperty('suspense', true);
  });

  it('should return the urqlClient instance (no-suspense)', () => {
    const urqlClient = initUrqlClient(
      {
        url: 'http://localhost:3000',
      },
      false
    );

    expect(urqlClient).toBeInstanceOf(Client);
    expect(urqlClient).toHaveProperty('suspense', false);
  });
});
