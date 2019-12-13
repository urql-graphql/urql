export const defer: (fn: () => void) => void =
  process.env.NODE_ENV === 'production' && typeof Promise !== 'undefined'
    ? Promise.prototype.then.bind(Promise.resolve())
    : fn => setTimeout(fn, 0);
