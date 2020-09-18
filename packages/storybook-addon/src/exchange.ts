import { Exchange, makeResult } from 'urql';
import { pipe, map, mergeMap, fromPromise, fromValue } from 'wonka';

export const getStorybookExchange = <T extends { parameters: any }>(
  context: T
): Exchange => () => op =>
  pipe(
    op,
    map(operation => [operation, context.parameters.urql(operation)]),
    mergeMap(([operation, result]) =>
      'then' in result
        ? fromPromise(result.then((r: any) => makeResult(operation, r)))
        : fromValue(makeResult(operation, result))
    )
  );
