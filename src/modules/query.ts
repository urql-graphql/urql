const createQuery = (q: string, vars?: object) => {
  return {
    query: q,
    variables: vars || {},
  };
};

export const query = createQuery;
export const mutation = createQuery;
export const subscription = createQuery;
