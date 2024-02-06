import { Client, fetchExchange, gql } from 'urql';
import { authExchange } from '@urql/exchange-auth';
import { cacheExchange } from '@urql/exchange-graphcache';

const cache = cacheExchange({
  updates: {
    Mutation: {
      createLink(result, _args, cache, _info) {
        const LinksList = gql`
          query Links($first: Int!) {
            links(first: $first) {
              nodes {
                id
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
              return {
                ...data,
                links: {
                  ...data.links,
                  nodes: [...data.links.nodes, result.createLink.node],
                },
              };
            }
          );
        }
      },
    },
  },
});

const auth = authExchange(async utilities => {
  let token = localStorage.getItem('authToken');

  return {
    addAuthToOperation(operation) {
      if (!token) return operation;
      return token
        ? utilities.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          })
        : operation;
    },
    didAuthError(error) {
      return error.graphQLErrors.some(
        e => e.extensions?.code === 'UNAUTHORIZED'
      );
    },
    willAuthError(operation) {
      if (!token) {
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
    },
    async refreshAuth() {
      token = localStorage.getItem('authToken');
      if (!token) {
        // This is where auth has gone wrong and we need to clean up and redirect to a login page
        localStorage.clear();
        window.location.reload();
      }
    },
  };
});

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/web-collections',
  exchanges: [cache, auth, fetchExchange],
});

export default client;
