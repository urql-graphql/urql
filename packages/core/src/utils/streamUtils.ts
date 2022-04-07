import { Source, subscribe, pipe } from 'wonka';
import { OperationResult, PromisifiedSource } from '../types';

export function withPromise<T extends OperationResult>(
  source$: Source<T>
): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () => {
    return new Promise(resolve => {
      const subscription = pipe(
        source$,
        subscribe(result => {
          if (!result.stale && !result.hasNext) {
            Promise.resolve().then(() => {
              subscription.unsubscribe();
              resolve(result);
            });
          }
        })
      );
    });
  };

  return source$ as PromisifiedSource<T>;
}
