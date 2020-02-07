export const stripTypename = (data: any): any => {
  const result = {};

  Object.keys(data).forEach((key: string) => {
    const value = data[key];
    if (key === '__typename') { // SKIP!
    } else if (Array.isArray(value)) {
      result[key] = value.map(stripTypename);
    } else if (typeof value === 'object') {
      result[key] = stripTypename(value);
    } else {
      result[key] = value;
    }
  });

  return result;
}
