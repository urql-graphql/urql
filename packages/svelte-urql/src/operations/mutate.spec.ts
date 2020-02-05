import { delay, fromValue, pipe } from 'wonka';

const client = {
  executeMutation: jest.fn(() =>
    pipe(fromValue({ data: 1, error: 2, extensions: { i: 1 } }), delay(200))
  ),
};

jest.mock('../context/getClient', () => ({ getClient: () => client }));

import { mutate } from './mutate';
import { createRequest } from 'urql/core';

describe('mutate', () => {
  const mutation = 'mutation ($text: String) { addTodo(text: $text) { id } }';
  const variables = { text: 'Learn svelte!' };

  afterEach(() => {
    client.executeMutation.mockClear();
  });

  it('should return a function', () => {
    const callback = mutate(mutation);
    expect(typeof callback).toEqual('function');
  });

  it('should call executeMutation', async () => {
    const callback = mutate(mutation);
    const result = await callback(variables);
    expect(client.executeMutation).toBeCalledTimes(1);
    expect(client.executeMutation).toBeCalledWith(
      createRequest(mutation, variables),
      {}
    );
    expect(result).toEqual({ data: 1, error: 2, extensions: { i: 1 } });
  });

  it('should call executeMutation with a new context', async () => {
    const callback = mutate(mutation);
    const context = { url: 'http://urql.com' };
    await callback(variables, context);
    expect(client.executeMutation).toBeCalledTimes(1);
    expect(client.executeMutation).toBeCalledWith(
      createRequest(mutation, variables),
      context
    );
  });
});
