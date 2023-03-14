import { Source, take, filter, toPromise, pipe } from 'wonka';
import { OperationResult, PromisifiedSource } from '../types';

/** Patches a `toPromise` method onto the `Source` passed to it.
 * @param source$ - the Wonka {@link Source} to patch.
 * @returns The passed `source$` with a patched `toPromise` method as a {@link PromisifiedSource}.
 * @internal
 */
export function withPromise<T extends OperationResult>(
  source$: Source<T>
): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () =>
    pipe(
      source$,
      filter(result => !result.stale && !result.hasNext),
      take(1),
      toPromise
    );

  return source$ as PromisifiedSource<T>;
}
