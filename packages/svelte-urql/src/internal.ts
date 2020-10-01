export const _contextKey = '$$_urql';
export const _storeUpdate = new Set<object>();
export const _markStoreUpdate =
  process.env.NODE_ENV !== 'production'
    ? (value: object) => _storeUpdate.add(value)
    : () => undefined;
