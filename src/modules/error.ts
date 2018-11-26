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

  return error.trim();
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

export class CombinedError implements Error {
  public name: string;
  public message: string;
  public graphQLErrors: Error[];
  public networkError?: Error;
  public response?: any;

  constructor({
    networkError,
    graphQLErrors,
    response,
  }: {
    networkError?: Error;
    graphQLErrors?: Array<string | IGraphQLError>;
    response?: any;
  }) {
    this.name = 'CombinedError';
    this.graphQLErrors = (graphQLErrors || []).map(rehydrateGraphQlError);
    this.message = generateErrorMessage(networkError, this.graphQLErrors);
    this.networkError = networkError;
    this.response = response;
  }
}
