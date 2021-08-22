import { Source, pipe, toPromise, filter, take } from 'wonka';
import { OperationResult, PromisifiedSource } from '../types';

export function withPromise<T extends OperationResult>(
  source$: Source<T>
): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () => {
    return pipe(
      source$,
      filter(result => !result.stale && !result.hasNext),
      take(1),
      toPromise
    );
  };

  return source$ as PromisifiedSource<T>;
}
