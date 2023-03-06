import { GraphQLError } from 'graphql';

export const rehydrateGraphQlError = (error: any): GraphQLError => {
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

    super('[CombinedError]');
    this.name = 'CombinedError';
    this.graphQLErrors = normalizedGraphQLErrors;
    this.networkError = input.networkError;
    this.response = input.response;
  }

  get message(): string {
    let error = '';
    if (this.networkError) return `[Network] ${this.networkError.message}`;
    if (this.graphQLErrors) {
      for (const err of this.graphQLErrors) {
        if (error) error += '\n';
        error += `[GraphQL] ${err.message}`;
      }
    }
    return error;
  }

  toString() {
    return this.message;
  }
}
