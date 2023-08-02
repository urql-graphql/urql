import type { Sink, Source } from 'wonka';
import { subscribe, take, filter, toPromise, pipe } from 'wonka';
import type { OperationResult, OperationResultSource } from '../types';

/** Patches a `toPromise` method onto the `Source` passed to it.
 * @param source$ - the Wonka {@link Source} to patch.
 * @returns The passed `source$` with a patched `toPromise` method as a {@link PromisifiedSource}.
 * @internal
 */
export function withPromise<T extends OperationResult>(
  _source$: Source<T>
): OperationResultSource<T> {
  const source$ = ((sink: Sink<T>) =>
    _source$(sink)) as OperationResultSource<T>;
  source$.toPromise = () =>
    pipe(
      source$,
      filter(result => !result.stale && !result.hasNext),
      take(1),
      toPromise
    );
  source$.then = (onResolve, onReject) =>
    source$.toPromise().then(onResolve, onReject);
  source$.subscribe = onResult => subscribe(onResult)(source$);
  return source$;
}
