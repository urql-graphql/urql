export const stripTypename = (data: any): any => {
  if (!data) return data;

  return Object.keys(data).reduce((acc, key: string) => {
    const value = data[key];
    if (key === '__typename') {
      return acc;
    } else if (Array.isArray(value)) {
      return {
        ...acc,
        [key]: value.map(stripTypename),
      };
    } else if (typeof value === 'object') {
      return {
        ...acc,
        [key]: stripTypename(value),
      };
    } else {
      return { ...acc, [key]: value };
    }
  }, {});
}
