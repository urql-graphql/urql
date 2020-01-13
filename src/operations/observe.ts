import { readable } from 'svelte/store';
import { pipe, subscribe } from 'wonka';

export type Fulfill<T> = (value: T) => void;
export type Reject = (error: Error) => void;
export type Deferred<T> = T | Promise<T>;

export interface Resolve<T> {
  fulfill: Fulfill<T>;
  reject: Reject;
}

function deferred<T>(
  set: (value: Deferred<T>) => void,
  initial?: T
): Resolve<T> {
  let initialized = initial !== undefined;
  let resolve: (value: T) => void | undefined;
  let reject: (error: Error) => void | undefined;

  // Set initial value
  set(
    initialized
      ? initial!
      : new Promise<T>((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        })
  );

  return {
    fulfill(value) {
      if (initialized) return set(Promise.resolve(value));

      initialized = true;
      resolve(value);
    },
    reject(error) {
      if (initialized) return set(Promise.reject(error));

      initialized = true;
      reject(error);
    },
  };
}

export function observe<T>(observable: any, initial?: T): any {
  return readable((undefined as unknown) as Deferred<T>, set => {
    const { fulfill, reject } = deferred<T>(set, initial);

    const subscription = pipe(
      observable,
      subscribe((res: any) => {
        if (res.error) reject(res.error);
        else fulfill(res);
      })
    );

    // @ts-ignore
    return () => subscription.unsubscribe();
  });
}
