import { Source, pipe, toPromise, take } from 'wonka';
import { PromisifiedSource } from '../types';

export function withPromise<T>(source$: Source<T>): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () =>
    pipe(
      source$,
      take(1),
      toPromise
    );
  return source$ as PromisifiedSource<T>;
}
