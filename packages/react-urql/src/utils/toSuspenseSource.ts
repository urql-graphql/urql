import { pipe, share, onPush, toPromise, takeWhile, take, Source } from 'wonka';

/** This converts a Source to a suspense Source; It will forward the first result synchronously or throw a promise that resolves when the result becomes available */
export const toSuspenseSource = <T>(source: Source<T>): Source<T> => sink => {
  const shared = share(source);
  let hasResult = false;
  let hasSuspended = false;

  pipe(
    shared,
    takeWhile(() => !hasSuspended),
    onPush(() => (hasResult = true))
  )(sink);

  if (!hasResult) {
    hasSuspended = true;
    sink(0); /* End */
    throw pipe(shared, take(1), toPromise);
  }
};
