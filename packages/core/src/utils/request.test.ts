import { expect, it, describe } from 'vitest';

import { parse, print } from 'graphql';
import { gql } from '../gql';
import { createRequest, stringifyDocument } from './request';
import { formatDocument } from './typenames';

describe('createRequest', () => {
  it('should hash identical queries identically', () => {
    const reqA = createRequest('{ test }', undefined);
    const reqB = createRequest('{ test }', undefined);
    expect(reqA.key).toBe(reqB.key);
  });

  it('should hash identical queries identically', () => {
    const reqA = createRequest('{ test }', undefined);
    const reqB = createRequest('{ test }', undefined);
    expect(reqA.key).toBe(reqB.key);
  });

  it('should hash identical DocumentNodes identically', () => {
    const reqA = createRequest(parse('{ testB }'), undefined);
    const reqB = createRequest(parse('{ testB }'), undefined);
    expect(reqA.key).toBe(reqB.key);
    expect(reqA.query).toBe(reqB.query);
  });

  it('should use the hash from a key if available', () => {
    const doc = parse('{ testC }');
    (doc as any).__key = 1234;
    const req = createRequest(doc, undefined);
    expect(req.key).toBe(1234);
  });

  it('should hash DocumentNodes and strings identically', () => {
    const docA = parse('{ field }');
    const docB = print(docA);
    const reqA = createRequest(docA, undefined);
    const reqB = createRequest(docB, undefined);
    expect(reqA.key).toBe(reqB.key);
    expect(reqA.query).toBe(reqB.query);
  });

  it('should hash graphql-tag documents correctly', () => {
    const doc = gql`
      {
        testD
      }
    `;
    createRequest(doc, undefined);
    expect((doc as any).__key).not.toBe(undefined);
  });

  it('should return a valid query object', () => {
    const doc = gql`
      {
        testE
      }
    `;
    const val = createRequest(doc, undefined);

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
});

describe('stringifyDocument ', () => {
  it('should reprint formatted documents', () => {
    const doc = parse('{ test { field } }');
    const formatted = formatDocument(doc);
    expect(stringifyDocument(formatted)).toBe(print(formatted));
  });

  it('should reprint request documents', () => {
    const request = createRequest(`query { test { field } }`, {});
    const formatted = formatDocument(request.query);
    expect(print(formatted)).toMatchInlineSnapshot(`
      "{
        test {
          field
          __typename
        }
      }"
    `);
    expect(stringifyDocument(formatted)).toBe(print(formatted));
  });

  it('should reprint gql documents', () => {
    const request = createRequest(
      gql`
        query {
          test {
            field
          }
        }
      `,
      {}
    );
    const formatted = formatDocument(request.query);
    expect(print(formatted)).toMatchInlineSnapshot(`
      "{
        test {
          field
          __typename
        }
      }"
    `);
    expect(stringifyDocument(formatted)).toBe(print(formatted));
  });

  it('should remove comments', () => {
    const doc = `
      { #query
        # broken
        test
      }
    `;
    expect(stringifyDocument(createRequest(doc, undefined).query))
      .toMatchInlineSnapshot(`
      "{
        test
      }"
    `);
  });

  it('should remove duplicate spaces', () => {
    const doc = `
      {
        abc          ,, test
      }
    `;
    expect(stringifyDocument(createRequest(doc, undefined).query))
      .toMatchInlineSnapshot(`
      "{
        abc
        test
      }"
    `);
  });

  it('should not sanitize within strings', () => {
    const doc = `
      {
        field(arg: "test #1")
      }
    `;
    expect(stringifyDocument(createRequest(doc, undefined).query))
      .toMatchInlineSnapshot(`
        "{
          field(arg: 
        \\"test #1\\")
        }"
      `);
  });

  it('should not sanitize within block strings', () => {
    const doc = `
      {
        field(
          arg: """
          hello
          #hello
          """
        )
      }
    `;
    expect(stringifyDocument(createRequest(doc, undefined).query))
      .toMatchInlineSnapshot(`
        "{
          field(arg: 
        \\"\\"\\"
          hello
          #hello
          \\"\\"\\")
        }"
      `);
  });
});
