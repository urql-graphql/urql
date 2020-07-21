import { DocumentNode, parse, print } from 'graphql';
import { hash, phash } from './hash';
import { stringifyVariables } from './stringifyVariables';
import { GraphQLRequest, Operation, OperationContext } from '../types';

interface Documents {
  [key: number]: DocumentNode;
}

const hashQuery = (q: string): number =>
  hash(q.replace(/([\s,]|#[^\n\r]+)+/g, ' ').trim());

const docs: Documents = Object.create(null);

export const createRequest = (
  q: string | DocumentNode,
  vars?: object
): GraphQLRequest => {
  let key: number;
  let query: DocumentNode;
  if (typeof q === 'string') {
    key = hashQuery(q);
    query =
      docs[key] !== undefined ? docs[key] : parse(q, { noLocation: true });
  } else if ((q as any).__key !== undefined) {
    key = (q as any).__key;
    query = q;
  } else {
    key = hashQuery(print(q));
    query = docs[key] !== undefined ? docs[key] : q;
  }

  docs[key] = query;
  (query as any).__key = key;

  return {
    key: vars ? phash(key, stringifyVariables(vars)) >>> 0 : key,
    query,
    variables: vars || {},
  };
};

/** Spreads the provided metadata to the source operation's meta property in context.  */
export const addMetadata = (
  source: Operation,
  meta: Exclude<OperationContext['meta'], undefined>
) => ({
  ...source,
  context: {
    ...source.context,
    meta: {
      ...source.context.meta,
      ...meta,
    },
  },
});
