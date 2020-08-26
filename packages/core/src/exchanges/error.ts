import { pipe, tap } from 'wonka';
import { Exchange, Operation } from '../types';
import { CombinedError } from '../utils';

export const errorExchange = ({
  onError,
}: {
  onError: (error: CombinedError, operation: Operation) => void;
}): Exchange => ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error, operation }) => {
      if (error) {
        onError(error, operation);
      }
    })
  );
};
