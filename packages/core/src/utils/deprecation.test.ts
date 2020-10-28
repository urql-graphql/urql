import { _clearWarnings, deprecationWarning } from './deprecation';

describe('deprecationWarning()', () => {
  let warn: jest.SpyInstance;

  const key = 'deprecation.test';
  const message = 'Test deprecation message.';

  beforeAll(() => {
    warn = jest.spyOn(console, 'warn');
  });

  afterEach(_clearWarnings);

  afterAll(() => {
    warn.mockRestore();
  });

  it('only calls console.warn once per key', () => {
    deprecationWarning({ key, message });
    deprecationWarning({ key, message });
    deprecationWarning({ key, message });

    expect(warn).toBeCalledTimes(1);
    expect(warn).toBeCalledWith(`[WARNING: Deprecated] ${message}`);
  });
});
