import { parse, print } from 'graphql';
import { gql } from '../gql';
import { createRequest } from './request';

jest.mock('./hash', () => ({
  hash: jest.requireActual('./hash').hash,
  phash: (x: number) => x,
}));

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

it('should remove comments', () => {
  const doc = `
    { #query
      # broken
      test
    }
  `;
  const val = createRequest(doc);
  expect(print(val.query)).toBe(`{\n  test\n}`);
});
