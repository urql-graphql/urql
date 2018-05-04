import { CombinedError } from '../../modules/error';

describe('CombinedError', () => {
  it('inherits from Error and is creates instances of itself', () => {
    const err = new CombinedError({
      graphQLErrors: [],
    });

    expect(err).toBeInstanceOf(CombinedError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CombinedError');
  });

  it('accepts graphQLError messages and generates a single message from them', () => {
    const graphQLErrors = ['Error Message A', 'Error Message B'];

    const err = new CombinedError({ graphQLErrors });

    expect(err.message).toBe(
      `
[GraphQL] Error Message A
[GraphQL] Error Message B
    `.trim()
    );

    expect(err.graphQLErrors).toEqual(graphQLErrors.map(x => new Error(x)));
  });

  it('accepts a network error and generates a message from it', () => {
    const networkError = new Error('Network Shenanigans');
    const err = new CombinedError({ networkError });

    expect(err.message).toBe(`[Network] ${networkError.message}`);
  });

  it('accepts actual errors for graphQLError', () => {
    const graphQLErrors = [
      new Error('Error Message A'),
      new Error('Error Message B'),
    ];

    const err = new CombinedError({ graphQLErrors });

    expect(err.message).toBe(
      `
[GraphQL] Error Message A
[GraphQL] Error Message B
    `.trim()
    );

    expect(err.graphQLErrors).toEqual(graphQLErrors);
  });

  it('passes graphQLErrors through as a last resort', () => {
    const graphQLErrors = [{ x: 'y' }] as any;
    const err = new CombinedError({ graphQLErrors });

    expect(err.graphQLErrors).toEqual(graphQLErrors);
  });

  it('accepts a response that is attached to the resulting error', () => {
    const response = {};
    const err = new CombinedError({
      graphQLErrors: [],
      response,
    });

    expect(err.response).toBe(response);
  });
});
