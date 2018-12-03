/** Create a [Query]{@link Query} from a query and (optionally) variables. */
export const createQuery = (q: string, vars?: any) => ({
  query: q,
  variables: vars || {},
});

/** Create a [Mutation]{@link Mutation} from a mutation query. */
export const createMutation = createQuery;
