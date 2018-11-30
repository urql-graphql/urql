export const createQuery = (q: string, vars?: any) => ({
  query: q,
  variables: vars || {},
});

export const createMutation = createQuery;
