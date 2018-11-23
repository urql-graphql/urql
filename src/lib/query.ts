export const createQuery = (query: string, variables: object = {}) => ({
  query,
  variables,
});

export const createMutation = createQuery;

export const createSubscription = createQuery;
