import { GraphQLError } from 'graphql';

const generateErrorMessage = (
  networkErr?: Error,
  graphQlErrs?: GraphQLError[]
) => {
  let error = '';
  if (networkErr !== undefined) {
    error = `[Network] ${networkErr.message}`;
    return error;
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
      error.originalError,
      error.extensions || {}
    );
  } else {
    return error as any;
  }
};

/** An error which can consist of GraphQL errors and Network errors. */
export class CombinedError implements Error {
  public name: string;
  public message: string;
  public graphQLErrors: GraphQLError[];
  public networkError?: Error;
  public response?: any;

  constructor({
    networkError,
    graphQLErrors,
    response,
  }: {
    networkError?: Error;
    graphQLErrors?: Array<string | GraphQLError | Error>;
    response?: any;
  }) {
    this.name = 'CombinedError';
    this.graphQLErrors = (graphQLErrors || []).map(rehydrateGraphQlError);
    this.message = generateErrorMessage(networkError, this.graphQLErrors);
    this.networkError = networkError;
    this.response = response;
  }
}
