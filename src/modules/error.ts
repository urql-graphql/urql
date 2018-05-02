import { GraphQLError } from 'graphql';

export class UrqlError extends Error {
  public message: string;
  public graphQLErrors: GraphQLError[];
  public networkError?: Error;

  constructor({
    message,
    networkError,
    graphQLErrors,
  }: {
    message?: string;
    networkError?: Error;
    graphQLErrors?: GraphQLError[];
  }) {
    super(message);

    this.graphQLErrors = graphQLErrors || [];
    this.networkError = networkError;
  }
}
