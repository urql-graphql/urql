import { Readable } from 'svelte/store';

export const initialState = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
};

const scheduleTask: (fn: () => void) => void =
  process.env.NODE_ENV === 'production' && typeof Promise !== 'undefined'
    ? Promise.prototype.then.bind(Promise.resolve())
    : fn => setTimeout(fn, 0);

export const batchReadable = <T>(input: Readable<T>): Readable<T> => ({
  subscribe(onValue) {
    let scheduled = false;
    let value: T | undefined;

    const notify = () => {
      if (scheduled) {
        onValue(value!);
        scheduled = false;
      }
    };

    const unsubscribe = input.subscribe(update => {
      value = update;
      if (!scheduled) {
        scheduled = true;
        scheduleTask(notify);
      }
    });

    if (value !== undefined) {
      scheduled = false;
      onValue(value);
    }

    return () => {
      scheduled = false;
      unsubscribe();
    };
  },
});
