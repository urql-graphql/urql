export const maskTypename = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  } else if (Array.isArray(data)) {
    return data.map(maskTypename);
  } else if (data && typeof data === 'object' && '__typename' in data) {
    const acc = {};
    for (const key in data) {
      if (key === '__typename') {
        Object.defineProperty(acc, '__typename', {
          enumerable: false,
          value: data.__typename,
        });
      } else {
        acc[key] = maskTypename(data[key]);
      }
    }
    return acc;
  } else {
    return data;
  }
};
