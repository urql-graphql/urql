// @vitest-environment jsdom

import { expect, describe, it } from 'vitest';
import { makeOperation } from '../utils/operation';
import { queryOperation, mutationOperation } from '../test-utils';
import { makeFetchBody, makeFetchURL, makeFetchOptions } from './fetchOptions';

describe('makeFetchBody', () => {
  it('creates a fetch body', () => {
    const body = makeFetchBody(queryOperation);
    expect(body).toMatchInlineSnapshot(`
      {
        "extensions": undefined,
        "operationName": "getUser",
        "query": "query getUser($name: String) {
        user(name: $name) {
          id
          firstName
          lastName
        }
      }",
        "variables": {
          "name": "Clara",
        },
      }
    `);
  });

  it('omits the query property when APQ is set', () => {
    const apqOperation = makeOperation(queryOperation.kind, queryOperation);

    apqOperation.extensions = {
      ...apqOperation.extensions,
      persistedQuery: {
        version: 1,
        sha256Hash: '[test]',
      },
    };

    expect(makeFetchBody(apqOperation).query).toBe(undefined);

    apqOperation.extensions.persistedQuery!.miss = true;
    expect(makeFetchBody(apqOperation).query).not.toBe(undefined);
  });
});

describe('makeFetchURL', () => {
  it('returns the URL by default', () => {
    const body = makeFetchBody(queryOperation);
    expect(makeFetchURL(queryOperation, body)).toBe(
      'http://localhost:3000/graphql'
    );
  });

  it('returns a query parameter URL when GET is preferred', () => {
    const operation = makeOperation(queryOperation.kind, queryOperation, {
      ...queryOperation.context,
      preferGetMethod: true,
    });

    const body = makeFetchBody(operation);
    expect(makeFetchURL(operation, body)).toMatchInlineSnapshot(
      '"http://localhost:3000/graphql?query=query+getUser%28%24name%3A+String%29+%7B%0A++user%28name%3A+%24name%29+%7B%0A++++id%0A++++firstName%0A++++lastName%0A++%7D%0A%7D&operationName=getUser&variables=%7B%22name%22%3A%22Clara%22%7D"'
    );
  });

  it('returns the URL without query parameters when it exceeds given length', () => {
    const operation = makeOperation(queryOperation.kind, queryOperation, {
      ...queryOperation.context,
      preferGetMethod: true,
    });

    operation.variables = {
      ...operation.variables,
      test: 'x'.repeat(2048),
    };

    const body = makeFetchBody(operation);
    expect(makeFetchURL(operation, body)).toBe('http://localhost:3000/graphql');
    // Resets the `preferGetMethod` field
    expect(operation.context.preferGetMethod).toBe(false);
  });

  it('returns the URL without query parameters for mutations', () => {
    const operation = makeOperation(mutationOperation.kind, mutationOperation, {
      ...mutationOperation.context,
      preferGetMethod: true,
    });

    const body = makeFetchBody(operation);
    expect(makeFetchURL(operation, body)).toBe('http://localhost:3000/graphql');
  });
});

describe('makeFetchOptions', () => {
  it('creates a JSON request by default', () => {
    const body = makeFetchBody(queryOperation);
    expect(makeFetchOptions(queryOperation, body)).toMatchInlineSnapshot(`
      {
        "body": "{\\"operationName\\":\\"getUser\\",\\"query\\":\\"query getUser($name: String) {\\\\n  user(name: $name) {\\\\n    id\\\\n    firstName\\\\n    lastName\\\\n  }\\\\n}\\",\\"variables\\":{\\"name\\":\\"Clara\\"}}",
        "headers": {
          "accept": "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed",
          "content-type": "application/json",
        },
        "method": "POST",
      }
    `);
  });

  it('creates a GET request when preferred for query operations', () => {
    const operation = makeOperation(queryOperation.kind, queryOperation, {
      ...queryOperation.context,
      preferGetMethod: 'force',
    });

    const body = makeFetchBody(operation);
    expect(makeFetchOptions(operation, body)).toMatchInlineSnapshot(`
      {
        "body": undefined,
        "headers": {
          "accept": "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed",
        },
        "method": "GET",
      }
    `);
  });

  it('creates a POST multipart request when a file is detected', () => {
    const operation = makeOperation(mutationOperation.kind, mutationOperation);
    operation.variables = {
      ...operation.variables,
      file: new Blob(),
    };

    const body = makeFetchBody(operation);
    const options = makeFetchOptions(operation, body);
    expect(options).toMatchInlineSnapshot(`
      {
        "body": FormData {},
        "headers": {
          "accept": "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed",
        },
        "method": "POST",
      }
    `);

    expect(options.body).toBeInstanceOf(FormData);
    const form = options.body as FormData;

    expect(JSON.parse(form.get('operations') as string)).toEqual({
      ...body,
      variables: {
        ...body.variables,
        file: null,
      },
    });

    expect(form.get('map')).toMatchInlineSnapshot(
      '"{\\"0\\":[\\"variables.file\\"]}"'
    );
    expect(form.get('0')).toBeInstanceOf(Blob);
  });
});
