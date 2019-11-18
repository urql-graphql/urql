import { queryOperation } from '../test-utils';
import { makeResult } from './result';

describe('makeResult', () => {
  it('adds extensions and errors correctly', () => {
    const response = {};
    const origResult = {
      data: undefined,
      errors: ['error message'],
      extensions: {
        extensionKey: 'extensionValue',
      },
    };

    const result = makeResult(queryOperation, origResult, response);

    expect(result.operation).toBe(queryOperation);
    expect(result.data).toBe(undefined);
    expect(result.extensions).toEqual(origResult.extensions);
    expect(result.error).toMatchInlineSnapshot(
      `[CombinedError: [GraphQL] error message]`
    );
  });
});
