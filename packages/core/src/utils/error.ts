import { GraphQLError } from 'graphql';

const generateErrorMessage = (
  networkErr?: Error,
  graphQlErrs?: GraphQLError[]
) => {
  let error = '';
  if (networkErr) return `[Network] ${networkErr.message}`;
  if (graphQlErrs) {
    for (const err of graphQlErrs) {
      if (error) error += '\n';
      error += `[GraphQL] ${err.message}`;
    }
  }
  return error;
};

const rehydrateGraphQlError = (error: any): GraphQLError => {
  if (typeof error === 'string') {
    return new GraphQLError(error);
  } else if (typeof error === 'object' && error.message) {
    return new GraphQLError(
      error.message,
      error.nodes,
      error.source,
      error.positions,
      error.path,
      error,
      error.extensions || {}
    );
  } else {
    return error as any;
  }
};

/** An error which can consist of GraphQL errors and Network errors. */
export class CombinedError extends Error {
  public name: string;
  public message: string;
  public graphQLErrors: GraphQLError[];
  public networkError?: Error;
  public response?: any;

  constructor(input: {
    networkError?: Error;
    graphQLErrors?: Array<string | Partial<GraphQLError> | Error>;
    response?: any;
  }) {
    const normalizedGraphQLErrors = (input.graphQLErrors || []).map(
      rehydrateGraphQlError
    );
    const message = generateErrorMessage(
      input.networkError,
      normalizedGraphQLErrors
    );

    super(message);

    this.name = 'CombinedError';
    this.message = message;
    this.graphQLErrors = normalizedGraphQLErrors;
    this.networkError = input.networkError;
    this.response = input.response;
  }

  toString() {
    return this.message;
  }
}
