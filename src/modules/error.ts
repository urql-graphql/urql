import { GraphQLError } from 'graphql';
import { IGraphQLError } from '../interfaces/response';

const generateErrorMessage = (
  networkErr?: Error,
  graphQlErrs?: IGraphQLError[]
) => {
  let error = '';
  if (networkErr) {
    error = `[Network] ${networkErr.message}`;
    return error;
  }

  for (let err of graphQlErrs) {
    error += `[GraphQL] ${err.message}\n`;
  }
  return error;
};

const rehydrateGraphQlError = (error: string | IGraphQLError) => {
  if (typeof error === 'string') {
    return new GraphQLError(error);
  } else if (error.message) {
    return new GraphQLError(error.message);
  } else {
    return error;
  }
};

export class CombinedError extends Error {
  public message: string;
  public graphQLErrors: GraphQLError[];
  public networkError?: Error;

  constructor({
    networkError,
    graphQLErrors,
  }: {
    networkError?: Error;
    graphQLErrors?: Array<string | IGraphQLError>;
  }) {
    const gqlErrors = (graphQLErrors || []).map(rehydrateGraphQlError);
    const errorMessage = generateErrorMessage(networkError, gqlErrors);

    super(errorMessage);

    this.message = errorMessage;
    this.graphQLErrors = gqlErrors;
    this.networkError = networkError;

    Object.setPrototypeOf(this, CombinedError.prototype);
  }
}
