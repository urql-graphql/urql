import { Source, filter, take, pipe, toPromise, toObservable } from 'wonka';
import { OperationResult, SourceExtensions } from '../types';

export function extendSource<T extends OperationResult>(
  source$: Source<T>
): SourceExtensions<T> {
  const result$ = pipe(
    source$,
    filter(result => !result.stale && !result.hasNext),
    take(1)
  );

  const then: PromiseLike<T>['then'] = (onResolve, onReject) =>
    toPromise(result$).then(onResolve, onReject);

  return Object.assign(source$ as SourceExtensions<T>, toObservable(source$), {
    toPromise: then,
    then,
  });
}
