export const scheduleTask: (fn: () => void) => void =
  typeof Promise !== 'undefined'
    ? Promise.prototype.then.bind(Promise.resolve())
    : fn => setTimeout(fn, 0);
