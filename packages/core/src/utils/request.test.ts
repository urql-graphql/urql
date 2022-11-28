import { vi, expect, it, describe } from 'vitest';

vi.mock('./hash', async () => {
  const hash = await vi.importActual<typeof import('./hash')>('./hash');
  return {
    ...hash,
    phash: (x: number) => x,
  };
});

import { parse, print } from 'graphql';
import { gql } from '../gql';
import { createRequest, stringifyDocument } from './request';

it('should hash identical queries identically', () => {
  const reqA = createRequest('{ test }');
  const reqB = createRequest('{ test }');
  expect(reqA.key).toBe(reqB.key);
});

it('should hash identical DocumentNodes identically', () => {
  const reqA = createRequest(parse('{ testB }'));
  const reqB = createRequest(parse('{ testB }'));
  expect(reqA.key).toBe(reqB.key);
  expect(reqA.query).toBe(reqB.query);
});

it('should use the hash from a key if available', () => {
  const doc = parse('{ testC }');
  (doc as any).__key = 1234;
  const req = createRequest(doc);
  expect(req.key).toBe(1234);
});

it('should hash DocumentNodes and strings identically', () => {
  const docA = parse('{ field }');
  const docB = print(docA).replace(/\s/g, ' ');
  const reqA = createRequest(docA);
  const reqB = createRequest(docB);
  expect(reqA.key).toBe(reqB.key);
  expect(reqA.query).toBe(reqB.query);
});

it('should hash graphql-tag documents correctly', () => {
  const doc = gql`
    {
      testD
    }
  `;
  createRequest(doc);
  expect((doc as any).__key).not.toBe(undefined);
});

it('should return a valid query object', () => {
  const doc = gql`
    {
      testE
    }
  `;
  const val = createRequest(doc);

  expect(val).toMatchObject({
    key: expect.any(Number),
    query: expect.any(Object),
    variables: {},
  });
});

it('should return a valid query object with variables', () => {
  const doc = print(
    gql`
      {
        testF
      }
    `
  );
  const val = createRequest(doc, { test: 5 });

  expect(print(val.query)).toBe(doc);
  expect(val).toMatchObject({
    key: expect.any(Number),
    query: expect.any(Object),
    variables: { test: 5 },
  });
});

describe('stringifyDocument (internal API)', () => {
  it('should remove comments', () => {
    const doc = `
      { #query
        # broken
        test
      }
    `;
    expect(stringifyDocument(createRequest(doc).query)).toBe('{ test }');
  });

  it('should remove duplicate spaces', () => {
    const doc = `
      {
        abc          ,, test
      }
    `;
    expect(stringifyDocument(createRequest(doc).query)).toBe('{ abc test }');
  });

  it('should not sanitize within strings', () => {
    const doc = `
      {
        field(arg: "test #1")
      }
    `;
    expect(stringifyDocument(createRequest(doc).query)).toBe(
      '{ field(arg:"test #1") }'
    );
  });

  it('should not sanitize within block strings', () => {
    const doc = `
      {
        field(
          arg: """
          hello
          hello
          """
        )
      }
    `;
    expect(stringifyDocument(createRequest(doc).query)).toBe(
      '{ field(arg:"""\n  hello\n  hello\n  """) }'
    );
  });
});
