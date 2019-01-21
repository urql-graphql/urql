import {
  filter,
  makeSubject,
  pipe,
  publish,
  share,
  Source,
  Subject,
  subscribe,
  take,
} from 'wonka';

import { defaultExchanges } from '../exchanges';
import { CombinedError } from './error';
import { hashString } from './hash';

import {
  Exchange,
  ExchangeResult,
  GraphQLRequest,
  Mutation,
  Operation,
  OperationContext,
  OperationType,
  Query,
  Subscription,
} from '../types';

/** Options for configuring the URQL [client]{@link Client}. */
export interface ClientOptions {
  /** Target endpoint URL such as `https://my-target:8080/graphql`. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An ordered array of Exchanges. */
  exchanges?: Exchange[];
}

/** The URQL application-wide client library. Each execute method starts a GraphQL request and
 returns a stream of results. */
export class Client implements ClientOptions {
  // These are variables derived from ClientOptions
  url: string;
  fetchOptions: RequestInit;
  exchanges: Exchange[];

  // These are internals to be used to keep track of operations
  dispatchOperation: (operation: Operation) => void;
  operations$: Source<Operation>;
  results$: Source<ExchangeResult>;

  constructor(opts: ClientOptions) {
    this.url = opts.url;

    this.fetchOptions =
      typeof opts.fetchOptions === 'function'
        ? opts.fetchOptions()
        : (opts.fetchOptions || {});

    this.exchanges =
      opts.exchanges !== undefined
        ? opts.exchanges
        : defaultExchanges;

    // This subject forms the input of operations; executeOperation may be
    // called to dispatch a new operation on the subject
    const [operations$, nextOperation] = makeSubject<Operation>();
    this.operations$ = operations$;
    this.dispatchOperation = nextOperation;

    // All operations run through the exchanges in a pipeline-like fashion
    // and this observable then combines all their results
    this.results$ = pipeExchanges(this, this.exchanges, this.operations$);
  }

  createOperation = (
    type: OperationType,
    query: GraphQLRequest,
    context: Partial<OperationContext>
  ): Operation => ({
    ...query,
    key: hashString(JSON.stringify(query)),
    operationName: type,
    context: {
      url: this.url,
      fetchOptions: this.fetchOptions,
      ...context
    }
  });

  executeOperation(operation: Operation): Source<ExchangeResult> {
    this.dispatchOperation(operation);
    const isSpecificExchangeResult = filter((res: ExchangeResult) => res.operation.key === operation.key);

    if (operation.operationName === 'mutation') {
      return pipe(this.results$, isSpecificExchangeResult, take(1));
    } else {
      return pipe(this.results$, isSpecificExchangeResult);
    }
  }

  executeQuery = (query: Query, opts: Partial<OperationContext>): Source<ExchangeResult> =>
    this.executeOperation(this.createOperation('query', query, opts));

  executeSubscription = (query: Subscription, opts: Partial<OperationContext>): Source<ExchangeResult> =>
    this.executeOperation(this.createOperation('subscription', query, opts));

  executeMutation = (query: Mutation, opts: Partial<OperationContext>): Source<ExchangeResult> =>
    this.executeOperation(this.createOperation('mutation', query, opts));
}

/** Create pipe of exchanges */
const pipeExchanges = (
  client: Client,
  exchanges: Exchange[],
  operation$: Source<Operation>
): Source<ExchangeResult> => {
  /** Recursively pipe to each exchange */
  const callExchanges = (value: Source<Operation>, index: number = 0) => {
    if (index >= exchanges.length) {
      return value;
    }

    const currentExchange = exchanges[index];
    return currentExchange({
      forward: val => callExchanges(val, index + 1),
      client,
    })(value);
  };

  return share(callExchanges(operation$, 0));
};
