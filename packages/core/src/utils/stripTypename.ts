export const stripTypename = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  return Object.keys(data).reduce((acc, key: string) => {
    const value = data[key];
    if (key === '__typename') {
      Object.defineProperty(acc, '__typename', {
        enumerable: false,
        value,
      });
    } else if (Array.isArray(value)) {
      acc[key] = value.map(stripTypename);
    } else if (typeof value === 'object') {
      acc[key] = stripTypename(value);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});
}
