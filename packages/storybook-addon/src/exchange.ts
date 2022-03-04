import { Exchange, makeResult } from 'urql';
import { pipe, map, mergeMap, fromPromise, fromValue } from 'wonka';

export const getStorybookExchange = <T extends { parameters: any }>(
  context: T
): Exchange => () => op =>
  pipe(
    op,
    map(operation => {
      const handler = context?.parameters?.urql
      if (!handler) {
        throw Error(`Story attempted to execute a query without an "urql" parameter ("${context.id}")`);
      }

      if (typeof handler !== "function") {
        throw Error(`Unexpected type for "urql" parameter on story (${context.id}). Expected function.`);
      }
      
      return [operation, context.parameters.urql(operation)];
    }),
    mergeMap(([operation, result]) => {
      if (!result) {
        console.warn(`Missing result on parameters.urql (${context.id})`);
      }
      
      return 'then' in result
        ? fromPromise(result.then((r: any) => makeResult(operation, r)))
        : fromValue(makeResult(operation, result))
    )
  );
