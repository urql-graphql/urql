import { readable, Readable } from 'svelte/store';
import { pipe, subscribe } from 'wonka';
import { OperationResult } from 'urql';

export interface Resolve<T> {
  fulfill: (value: T) => void;
  reject: (error: Error) => void;
}

function deferred<T>(
  set: (value: T | Promise<T>) => void,
  initial?: T
): Resolve<T> {
  let resolve: (value: T) => void | undefined,
    reject: (error: Error) => void | undefined,
    initialized = initial !== undefined;

  set(
    initialized
      ? (initial as T)
      : new Promise<T>((res, rej) => {
          (resolve = res), (reject = rej);
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

export function observe<T>(
  observable: any,
  initial?: OperationResult<T>
): Readable<OperationResult<T> | undefined> {
  return readable(initial, set => {
    const p = deferred<OperationResult<T>>(set as any, initial);

    const subscription = pipe(
      observable,
      subscribe((res: OperationResult<T>) => {
        if (res.error) p.reject(res.error);
        else p.fulfill(res);
      })
    );

    return () => subscription.unsubscribe();
  });
}
