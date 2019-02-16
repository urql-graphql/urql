import { DocumentNode } from 'graphql';

/** Create a [Query]{@link Query} from a query and (optionally) variables. */
export const createQuery = (q: string | DocumentNode, vars?: object) => ({
  query: q,
  variables: vars || {},
});

/** Create a [Mutation]{@link Mutation} from a mutation query. */
export const createMutation = createQuery;

/** Create a [Subscription]{@link Subscription} from a subscription query. */
export const createSubscription = createQuery;
