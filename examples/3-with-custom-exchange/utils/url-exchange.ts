import { ExchangeInput, Operation } from 'urql';
import { map, pipe, Source } from 'wonka';

export const urlExchange = ({ forward }: ExchangeInput) => {
  return (operations$: Source<Operation>) => {
    return pipe(
      operations$,
      map(op => {
        if (process.browser) {
          op.context.url = 'https://metaphysics-production.artsy.net/';
        }
        return op;
      }),
      forward,
    );
  };
};
