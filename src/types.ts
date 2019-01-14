import { Observable, Subject } from 'rxjs';
import { ClientState } from './components';
import { CombinedError } from './lib';

/** A Graphql query. */
export interface Query {
  /** Graphql query string. */
  query: string;
  /** Graphql query variables. */
  variables?: object;
}

/** A Graphql mutation. */
export type Mutation = Query;

/** A Graphql [query]{@link Query} or [mutation]{@link Mutation} accompanied with metadata. */
export interface Operation extends Query {
  /** Unique identifier of the operation. */
  key: string;
  /** The type of Grapqhql operation being executed. */
  operationName: string;
  /** Additional metadata passed to [exchange]{@link Exchange} functions. */
  context: {
    [key: string]: any;
    fetchOptions?: RequestInit;
    url: ClientOptions['url'];
  };
}

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Exchange = (
  args: {
    /** Function to call the next [exchange]{@link Exchange} in the chain. */
    forward: ExchangeIO;
    /** Subject from which the stream of [operations]{@link Operation} is created. */
    subject: Subject<Operation>;
  }
) => ExchangeIO;

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link ExchangeResult}. */
export type ExchangeIO = (
  /** A stream of operations. */
  ops$: Observable<Operation>
) => Observable<ExchangeResult>;

/** Resulting data from an [operation]{@link Operation}. */
export interface ExchangeResult {
  /** The [operation]{@link Operation} which has been executed. */
  operation: Operation;
  /** The data returned from the Graphql server. */
  data: any;
  /** Any errors resulting from the operation. */
  error?: Error | CombinedError;
}

/** The arguments for the child function of a connector. */
export interface ChildArgs<MutationDeclarations> {
  /** Whether a dependent GraphQL request is currently being fetched. */
  fetching: ClientState<MutationDeclarations>['fetching'];
  /** Any network or GraphQL errors. */
  error: ClientState<MutationDeclarations>['error'];
  /** The data returned from a GraphQL [query]{@link Query} to the server. */
  data: ClientState<MutationDeclarations>['data'];
  /** A collection of functions for executing pre-specified [mutations]{@link Mutation} */
  mutations: ClientState<MutationDeclarations>['mutations'];
  /** Trigger a fetch of the pre-specified [query]{@link Query}. */
  refetch: (noCache?: boolean) => void;
}

/** Options for configuring the URQL [client]{@link Client}. */
export interface ClientOptions {
  /** Target endpoint URL such as `https://my-target:8080/graphql`. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An ordered array of Exchanges. */
  exchanges?: Exchange[];
}

/** The URQL applicaiton-wide client library. */
export interface Client {
  /** Creates a client instance for usage by stateful components. */
  createInstance: (opts: CreateClientInstanceOpts) => ClientInstance;
}

/** An instance of a [client]{@link Client}. */
export interface ClientInstance {
  /** Executes a given query. */
  executeQuery: (query: Query, force?: boolean) => void;
  /** Executes a given mutation. */
  executeMutation: (mutation: Mutation, force?: boolean) => void;
  /** Removes any [subscriptions]{@link Subscription} created by the client instance. */
  unsubscribe: () => void;
}

/** A new response/update from the [client]{@link Client} stream. */
export interface StreamUpdate {
  /** Any data returned from a [GraphQL]{@link GraphQL} query. */
  data?: ExchangeResult['data'];
  /** Any errors returned from a [GraphQL]{@link GraphQL} query. */
  error?: ExchangeResult['error'];
  /** Indicator of whether a query is being executed. */
  fetching: boolean;
}

/** Arguments for creating a client instance. */
export interface CreateClientInstanceOpts {
  /** A callback function for when changes occur. */
  onChange: (data: StreamUpdate) => any;
}

/** An error from the GraphQL client. */
export interface GraphQLError {
  message?: string;
}

// Adapted from: https://github.com/graphql/graphql-js/blob/ae5b163d2e6c124107fa0971f6d838c8a7d29f51/src/execution/execute.js#L105-L114<Paste>
export interface ExecutionResult {
  errors?: Error[];
  data?: any;
}
