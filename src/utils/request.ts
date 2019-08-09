import { DocumentNode, parse, print } from 'graphql';
import { hash, phash } from './hash';
import stringify from 'fast-json-stable-stringify';
import { GraphQLRequest, Operation, OperationContext } from '../types';

interface Documents {
  [key: number]: DocumentNode;
}

const docs: Documents = Object.create(null);
const keyProp = '__key';

export const createRequest = (
  q: string | DocumentNode,
  vars?: object
): GraphQLRequest => {
  let key: number;
  let query: DocumentNode;
  if (typeof q === 'string') {
    key = hash(q.replace(/[\s,]+/, ' ').trim());
    query = docs[key] !== undefined ? docs[key] : parse(q);
  } else if ((q as any)[keyProp] !== undefined) {
    key = (q as any)[keyProp];
    query = q;
  } else {
    key = hash(print(q));
    query = docs[key] !== undefined ? docs[key] : q;
  }

  docs[key] = query;
  (query as any)[keyProp] = key;

  if (typeof vars === 'object' && vars !== null) {
    return {
      key: phash(key, stringify(vars)) >>> 0,
      query,
      variables: vars || {},
    };
  } else {
    return {
      key,
      query,
      variables: {},
    };
  }
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
