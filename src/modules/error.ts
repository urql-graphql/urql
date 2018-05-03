import { IGraphQLError } from '../interfaces/index';

const generateErrorMessage = (
  networkErr?: Error,
  graphQlErrs?: IGraphQLError[]
) => {
  let error = '';
  if (networkErr) {
    error = `[Network] ${networkErr.message}`;
    return error;
  }

  graphQlErrs.forEach(err => {
    error += `[GraphQL] ${err.message}\n`;
  });

  return error;
};

const rehydrateGraphQlError = (error: string | IGraphQLError): Error => {
  if (typeof error === 'string') {
    return new Error(error);
  } else if (error.message) {
    return new Error(error.message);
  } else {
    return error as any;
  }
};

export class CombinedError extends Error {
  public message: string;
  public graphQLErrors: Error[];
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
