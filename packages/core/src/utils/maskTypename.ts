export const maskTypename = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  return Object.keys(data).reduce(
    (acc, key: string) => {
      const value = data[key];
      if (key === '__typename') {
        Object.defineProperty(acc, '__typename', {
          enumerable: false,
          value,
        });
      } else if (Array.isArray(value)) {
        acc[key] = value.map(maskTypename);
      } else if (value && typeof value === 'object' && '__typename' in value) {
        acc[key] = maskTypename(value);
      } else {
        acc[key] = value;
      }

      return acc;
    },
    Array.isArray(data) ? [] : {}
  );
};
