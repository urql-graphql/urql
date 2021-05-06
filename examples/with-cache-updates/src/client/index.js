import { createClient, dedupExchange, fetchExchange, gql } from 'urql';
import { makeOperation } from '@urql/core';
import { authExchange } from '@urql/exchange-auth';
import { cacheExchange } from '@urql/exchange-graphcache';

const getAuth = async ({ authState }) => {
  if (!authState) {
    const token = localStorage.getItem('authToken');

    if (token) {
      return { token };
    }

    return null;
  }

  // This is where auth has gone wrong and we need to clean up and redirect to a login page
  localStorage.clear();
  window.location.reload();

  return null;
};

const addAuthToOperation = ({ authState, operation }) => {
  if (!authState || !authState.token) {
    return operation;
  }

  const fetchOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return makeOperation(operation.kind, operation, {
    ...operation.context,
    fetchOptions: {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: `Bearer ${authState.token}`,
      },
    },
  });
};

const didAuthError = ({ error }) => {
  return error.graphQLErrors.some(e => e.extensions?.code === 'UNAUTHORIZED');
};

const willAuthError = ({ operation, authState }) => {
  if (!authState) {
    // Detect our login mutation and let this operation through:
    return (
      operation.kind !== 'mutation' ||
      // Here we find any mutation definition with the "signin" field
      !operation.query.definitions.some(definition => {
        return (
          definition.kind === 'OperationDefinition' &&
          definition.selectionSet.selections.some(node => {
            // The field name is just an example, since register may also be an exception
            return node.kind === 'Field' && node.name.value === 'signin';
          })
        );
      })
    );
  }

  return false;
};

const client = createClient({
  url: 'https://trygql.dev/graphql/web-collections',
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          createLink(result, _args, cache, _info) {
            const LinksList = gql`
              query Links($first: Int!) {
                links(first: $first) {
                  nodes {
                    id
                    canonicalUrl
                  }
                }
              }
            `;

            const linksPages = cache
              .inspectFields('Query')
              .filter(field => field.fieldName === 'links');

            if (linksPages.length > 0) {
              const lastField = linksPages[linksPages.length - 1];

              cache.updateQuery(
                {
                  query: LinksList,
                  variables: { first: lastField.arguments.first },
                },
                data => {
                  data.links.nodes.push(result.createLink.node);

                  return data;
                }
              );
            }
          },
        },
      },
    }),
    authExchange({ getAuth, addAuthToOperation, didAuthError, willAuthError }),
    fetchExchange,
  ],
});

export default client;
