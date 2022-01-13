import { GraphQLError } from 'graphql';

const generateErrorMessage = (
  networkErr?: Error,
  graphQlErrs?: GraphQLError[]
) => {
  let error = '';
  if (networkErr !== undefined) {
    return (error = `[Network] ${networkErr.message}`);
  }

  if (graphQlErrs !== undefined) {
    graphQlErrs.forEach(err => {
      error += `[GraphQL] ${err.message}\n`;
    });
  }

  return error.trim();
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
  public executionResult?: any;

  constructor({
    networkError,
    graphQLErrors,
    response,
    executionResult,
  }: {
    networkError?: Error;
    graphQLErrors?: Array<string | Partial<GraphQLError> | Error>;
    response?: any;
    executionResult?: any;
  }) {
    const normalizedGraphQLErrors = (graphQLErrors || []).map(
      rehydrateGraphQlError
    );
    const message = generateErrorMessage(networkError, normalizedGraphQLErrors);

    super(message);

    this.name = 'CombinedError';
    this.message = message;
    this.graphQLErrors = normalizedGraphQLErrors;
    this.networkError = networkError;
    this.response = response;
    this.executionResult = executionResult;
  }

  toString() {
    return this.message;
  }
}

export class NoContentError extends Error {
  public name: string;
  public message: string;
  response?: any;
  executionResult?: any;

  constructor({
    response,
    executionResult,
  }: {
    response?: any;
    executionResult?: any;
  }) {
    super('No Content');

    this.name = 'NoContentError';
    this.message = 'No Content';
    this.response = response;
    this.executionResult = executionResult;
  }

  toString() {
    return this.message;
  }
}
