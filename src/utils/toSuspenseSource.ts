import { pipe, make, onPush, onEnd, subscribe, Source } from 'wonka';

/** This converts a Source to a suspense Source; It will forward the first result synchronously or throw a promise that resolves when the result becomes available */
export const toSuspenseSource = <T>(source: Source<T>): Source<T> => {
  // Create a new Source from scratch so we have full control over the Source's lifecycle
  return make<T>(({ next, complete }) => {
    let isCancelled = false;
    let resolveSuspense: (value: T) => void;
    let synchronousResult: undefined | T;

    const { unsubscribe } = pipe(
      source,
      // The onPush and onEnd forward the underlying results as usual, so that when no
      // suspense promise is thrown, the source behaves as it normally would
      onPush(next),
      onEnd(complete as any),
      subscribe(value => {
        // When this operation resolved synchronously assign the result to
        // synchronousResult which will be picked up below
        if (resolveSuspense === undefined) {
          synchronousResult = value;
        } else if (!isCancelled) {
          // Otherwise resolve the thrown promise,
          resolveSuspense(value);
          // And end and teardown both sources, since suspense will abort the
          // underlying rendering component anyway
          complete();
          unsubscribe();
        }
      })
    );

    // If we have a synchronous result, push it onto this source, which is synchronous
    // otherwise throw a new promise which will resolve later
    if (synchronousResult === undefined) {
      throw new Promise(resolve => {
        resolveSuspense = resolve;
      });
    }

    // Since promises aren't cancellable we have a flag that prevents
    // the thrown promise from resolving if this source is cancelled
    return () => {
      isCancelled = true;
      unsubscribe();
    };
  });
};
