import { pipe, make, onPush, onEnd, subscribe, Source } from 'wonka';

/** This converts a Source to a suspense Source; It will forward the first result synchronously or throw a promise that resolves when the result becomes available */
export const toSuspenseSource = <T>(source: Source<T>): Source<T> => {
  // Create a new Source from scratch so we have full control over the Source's lifecycle
  return make(([push, end]) => {
    let isCancelled = false;
    let resolveSuspense;
    let synchronousResult;

    // Subscribe to the source and wait for the first result only
    const [teardown] = pipe(
      source,
      onPush(push),
      onEnd(end),
      subscribe(value => {
        // When this operation resolved synchronously assign the result to
        // synchronousResult which will be picked up below
        if (resolveSuspense === undefined) {
          synchronousResult = value;
        } else if (!isCancelled) {
          // Otherwise we resolve this source and the thrown promise
          resolveSuspense(value);
          end();
          teardown();
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
      teardown();
    };
  });
};
