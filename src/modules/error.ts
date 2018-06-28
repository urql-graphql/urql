import { IGraphQLError, IGraphQLErrorInput } from '../interfaces/index';

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

  return error.trim();
};

const rehydrateGraphQlError = (
  error: string | IGraphQLError
): IGraphQLError => {
  if (typeof error === 'string') {
    return new Error(error);
  } else if (error.message) {
    const err: IGraphQLError = new Error(error.message);
    err.path = error.path;
    err.locations = error.locations;
    err.extensions = error.extensions;
    return err;
  } else {
    return error as any;
  }
};

// Shared interface extending Error
// tslint:disable-next-line no-empty-interface interface-name
export interface CombinedError extends Error {}

export class CombinedError {
  public name: string;
  public message: string;
  public graphQLErrors: IGraphQLError[];
  public networkError?: Error;
  public response?: any;

  constructor({
    networkError,
    graphQLErrors,
    response,
  }: {
    networkError?: Error;
    graphQLErrors?: Array<string | IGraphQLErrorInput | IGraphQLError>;
    response?: any;
  }) {
    this.name = 'CombinedError';
    this.graphQLErrors = (graphQLErrors || []).map(rehydrateGraphQlError);
    this.message = generateErrorMessage(networkError, this.graphQLErrors);
    this.networkError = networkError;
    this.response = response;
  }
}

CombinedError.prototype = Object.create(Error.prototype);
