import React from 'react';
import { addDecorator } from '@storybook/react';
import { Provider, createClient, makeResult, Operation } from 'urql';
import { pipe, map, fromPromise, mergeMap, Source, fromValue } from 'wonka';

type MaybePromiseSource = Source<[Operation, Promise<any> | any]>;

addDecorator((Story, context) => {
  const client = createClient({
    url: 'storehhh',
    exchanges: [
      () => op =>
        pipe(
          op,
          map(operation => [operation, context.parameters.urql(operation)]),
          mergeMap(([operation, result]) =>
            'then' in result
              ? fromPromise(result.then(r => makeResult(operation, r)))
              : fromValue(makeResult(operation, result))
          )
        ),
    ],
  });

  return (
    <Provider value={client}>
      <Story {...context} />
    </Provider>
  );
});
