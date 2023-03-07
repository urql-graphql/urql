import { Source, subscribe, pipe } from 'wonka';
import { OperationResult, PromisifiedSource } from '../types';

/** Patches a `toPromise` method onto the `Source` passed to it.
 * @param source$ - the Wonka {@link Source} to patch.
 * @returns The passed `source$` with a patched `toPromise` method as a {@link PromisifiedSource}.
 * @internal
 */
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
