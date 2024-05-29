import { GraphQLError } from '@0no-co/graphql.web';
import type { ErrorLike } from '../types';

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
  if (
    error &&
    error.message &&
    (error.extensions || error.name === 'GraphQLError')
  ) {
    return error;
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
    return new GraphQLError(error as any);
  }
};

/** An abstracted `Error` that provides either a `networkError` or `graphQLErrors`.
 *
 * @remarks
 * During a GraphQL request, either the request can fail entirely, causing a network error,
 * or the GraphQL execution or fields can fail, which will cause an {@link ExecutionResult}
 * to contain an array of GraphQL errors.
 *
 * The `CombinedError` abstracts and normalizes both failure cases. When {@link OperationResult.error}
 * is set to this error, the `CombinedError` abstracts all errors, making it easier to handle only
 * a subset of error cases.
 *
 * @see {@link https://urql.dev/goto/docs/basics/errors} for more information on handling
 * GraphQL errors and the `CombinedError`.
 */
export class CombinedError extends Error {
  public name: string;
  public message: string;

  /** A list of GraphQL errors rehydrated from a {@link ExecutionResult}.
   *
   * @remarks
   * If an {@link ExecutionResult} received from the API contains a list of errors,
   * the `CombinedError` will rehydrate them, normalize them to
   * {@link GraphQLError | GraphQLErrors} and list them here.
   * An empty list indicates that no GraphQL error has been sent by the API.
   */
  public graphQLErrors: GraphQLError[];

  /** Set to an error, if a GraphQL request has failed outright.
   *
   * @remarks
   * A GraphQL over HTTP request may fail and not reach the API. Any error that
   * prevents a GraphQl request outright, will be considered a “network error” and
   * set here.
   */
  public networkError?: Error;

  /** Set to the {@link Response} object a fetch exchange received.
   *
   * @remarks
   * If a built-in fetch {@link Exchange} is used in `urql`, this may
   * be set to the {@link Response} object of the Fetch API response.
   * However, since `urql` doesn’t assume that all users will use HTTP
   * as the only or exclusive transport for GraphQL this property is
   * neither typed nor guaranteed and may be re-used for other purposes
   * by non-fetch exchanges.
   *
   * Hint: It can be useful to use `response.status` here, however, if
   * you plan on relying on this being a {@link Response} in your app,
   * which it is by default, then make sure you add some extra checks
   * before blindly assuming so!
   */
  public response?: any;

  constructor(input: {
    networkError?: Error;
    graphQLErrors?: Array<string | ErrorLike>;
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

  toString(): string {
    return this.message;
  }
}
