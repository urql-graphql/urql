import { describe, it, expect } from 'vitest';
import { OperationResult } from '../types';
import { queryOperation, subscriptionOperation } from '../test-utils';
import { makeResult, mergeResultPatch } from './result';

describe('makeResult', () => {
  it('adds extensions and errors correctly', () => {
    const origResult = {
      data: undefined,
      errors: ['error message'],
      extensions: {
        extensionKey: 'extensionValue',
      },
    };

    const result = makeResult(queryOperation, origResult);

    expect(result.hasNext).toBe(false);
    expect(result.operation).toBe(queryOperation);
    expect(result.data).toBe(undefined);
    expect(result.extensions).toEqual(origResult.extensions);
    expect(result.error).toMatchInlineSnapshot(
      `[CombinedError: [GraphQL] error message]`
    );
  });

  it('default hasNext to true for subscriptions', () => {
    const origResult = {
      data: undefined,
      errors: ['error message'],
      extensions: {
        extensionKey: 'extensionValue',
      },
    };

    const result = makeResult(subscriptionOperation, origResult);
    expect(result.hasNext).toBe(true);
  });
});

describe('mergeResultPatch (defer/stream latest', () => {
  it('should read pending and append the result', () => {
    const pending = [{ id: '0', path: [] }];
    const prevResult: OperationResult = {
      operation: queryOperation,
      stale: false,
      hasNext: true,
      data: {
        f2: {
          a: 'a',
          b: 'b',
          c: {
            d: 'd',
            e: 'e',
            f: { h: 'h', i: 'i' },
          },
        },
      },
    };

    const merged = mergeResultPatch(
      prevResult,
      {
        incremental: [
          { id: '0', data: { MyFragment: 'Query' } },
          { id: '0', subPath: ['f2', 'c', 'f'], data: { j: 'j' } },
        ],
        // TODO: not sure if we need this but it's part of the spec
        // completed: [{ id: '0' }],
        hasNext: false,
      },
      undefined,
      pending
    );

    expect(merged.data).toEqual({
      MyFragment: 'Query',
      f2: {
        a: 'a',
        b: 'b',
        c: {
          d: 'd',
          e: 'e',
          f: { h: 'h', i: 'i', j: 'j' },
        },
      },
    });
  });

  it('should read pending and append the result w/ overlapping fields', () => {
    const pending = [
      { id: '0', path: [], label: 'D1' },
      { id: '1', path: ['f2', 'c', 'f'], label: 'D2' },
    ];
    const prevResult: OperationResult = {
      operation: queryOperation,
      stale: false,
      hasNext: true,
      data: {
        f2: {
          a: 'A',
          b: 'B',
          c: {
            d: 'D',
            e: 'E',
            f: {
              h: 'H',
              i: 'I',
            },
          },
        },
      },
    };

    const merged = mergeResultPatch(
      prevResult,
      {
        incremental: [
          { id: '0', subPath: ['f2', 'c', 'f'], data: { j: 'J', k: 'K' } },
        ],
        pending: [{ id: '1', path: ['f2', 'c', 'f'], label: 'D2' }],
        hasNext: true,
      },
      undefined,
      pending
    );

    const merged2 = mergeResultPatch(
      merged,
      {
        incremental: [{ id: '1', data: { l: 'L', m: 'M' } }],
        hasNext: false,
      },
      undefined,
      pending
    );

    expect(merged2.data).toEqual({
      f2: {
        a: 'A',
        b: 'B',
        c: {
          d: 'D',
          e: 'E',
          f: {
            h: 'H',
            i: 'I',
            j: 'J',
            k: 'K',
            l: 'L',
            m: 'M',
          },
        },
      },
    });
  });
});

describe('mergeResultPatch (defer/stream pre June-2023)', () => {
  it('should default hasNext to true if the last result was set to true', () => {
    const prevResult: OperationResult = {
      operation: subscriptionOperation,
      data: {
        __typename: 'Subscription',
        event: 1,
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      data: {
        __typename: 'Subscription',
        event: 2,
      },
    });

    expect(merged.data).not.toBe(prevResult.data);
    expect(merged.data.event).toBe(2);
    expect(merged.hasNext).toBe(true);
  });

  it('should ignore invalid patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        items: [
          {
            __typename: 'Item',
            id: 'id',
          },
        ],
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          data: undefined,
          path: ['a'],
        },
        {
          items: null,
          path: ['b'],
        },
      ],
    });

    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      items: [
        {
          __typename: 'Item',
          id: 'id',
        },
      ],
    });
  });

  it('should apply incremental defer patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        items: [
          {
            __typename: 'Item',
            id: 'id',
            child: undefined,
          },
        ],
      },
      stale: false,
      hasNext: true,
    };

    const patch = { __typename: 'Child' };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          data: patch,
          path: ['items', 0, 'child'],
        },
      ],
    });

    expect(merged.data.items[0]).not.toBe(prevResult.data.items[0]);
    expect(merged.data.items[0].child).toBe(patch);
    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      items: [
        {
          __typename: 'Item',
          id: 'id',
          child: patch,
        },
      ],
    });
  });

  it('should handle null incremental defer patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        item: undefined,
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          data: null,
          path: ['item'],
        },
      ],
    });

    expect(merged.data).not.toBe(prevResult.data);
    expect(merged.data.item).toBe(null);
  });

  it('should apply incremental stream patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        items: [{ __typename: 'Item' }],
      },
      stale: false,
      hasNext: true,
    };

    const patch = { __typename: 'Item' };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          items: [patch],
          path: ['items', 1],
        },
      ],
    });

    expect(merged.data.items).not.toBe(prevResult.data.items);
    expect(merged.data.items[0]).toBe(prevResult.data.items[0]);
    expect(merged.data.items[1]).toBe(patch);
    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      items: [{ __typename: 'Item' }, { __typename: 'Item' }],
    });
  });

  it('should apply incremental stream patches deeply', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        test: [
          {
            __typename: 'Test',
          },
        ],
      },
      stale: false,
      hasNext: true,
    };

    const patch = { name: 'Test' };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          items: [patch],
          path: ['test', 0],
        },
      ],
    });

    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      test: [
        {
          __typename: 'Test',
          name: 'Test',
        },
      ],
    });
  });

  it('should handle null incremental stream patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        items: [{ __typename: 'Item' }],
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          items: null,
          path: ['items', 1],
        },
      ],
    });

    expect(merged.data.items).not.toBe(prevResult.data.items);
    expect(merged.data.items[0]).toBe(prevResult.data.items[0]);
    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      items: [{ __typename: 'Item' }],
    });
  });

  it('should handle root incremental stream patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        item: {
          test: true,
        },
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          data: { item: { test2: false } },
          path: [],
        },
      ],
    });

    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      item: {
        test: true,
        test2: false,
      },
    });
  });

  it('should merge extensions from each patch', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
      },
      extensions: {
        base: true,
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          data: null,
          path: ['item'],
          extensions: {
            patch: true,
          },
        },
      ],
    });

    expect(merged.extensions).toStrictEqual({
      base: true,
      patch: true,
    });
  });

  it('should combine errors from each patch', () => {
    const prevResult: OperationResult = makeResult(queryOperation, {
      errors: ['base'],
    });

    const merged = mergeResultPatch(prevResult, {
      incremental: [
        {
          data: null,
          path: ['item'],
          errors: ['patch'],
        },
      ],
    });

    expect(merged.error).toMatchInlineSnapshot(`
      [CombinedError: [GraphQL] base
      [GraphQL] patch]
    `);
  });

  it('should preserve all data for noop patches', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
      },
      extensions: {
        base: true,
      },
      stale: false,
      hasNext: true,
    };

    const merged = mergeResultPatch(prevResult, {
      hasNext: false,
    });

    expect(merged.data).toStrictEqual({
      __typename: 'Query',
    });
  });

  it('handles the old version of the incremental payload spec (DEPRECATED)', () => {
    const prevResult: OperationResult = {
      operation: queryOperation,
      data: {
        __typename: 'Query',
        items: [
          {
            __typename: 'Item',
            id: 'id',
            child: undefined,
          },
        ],
      },
      stale: false,
      hasNext: true,
    };

    const patch = { __typename: 'Child' };

    const merged = mergeResultPatch(prevResult, {
      data: patch,
      path: ['items', 0, 'child'],
    } as any);

    expect(merged.data.items[0]).not.toBe(prevResult.data.items[0]);
    expect(merged.data.items[0].child).toBe(patch);
    expect(merged.data).toStrictEqual({
      __typename: 'Query',
      items: [
        {
          __typename: 'Item',
          id: 'id',
          child: patch,
        },
      ],
    });
  });
});
