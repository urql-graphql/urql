import { Component, ReactNode } from 'react';
import {
  empty,
  filter,
  makeSubject,
  map,
  pipe,
  Source,
  subscribe,
  switchAll,
  toPromise,
} from 'wonka';

import { Client } from '../lib/client';
import { CombinedError } from '../lib/error';
import { ConnectProps } from './connect';

import {
  ChildArgs,
  ExchangeResult,
  Mutation,
  Query,
  Subscription,
} from '../types';

export type Mutations<MutationDeclarations> = {
  [type in keyof MutationDeclarations]: Mutation
};

export type MutationFns<MutationDeclarations> = {
  [type in keyof MutationDeclarations]: (
    variables?: object
  ) => Promise<ExchangeResult>
};

export interface ClientState<MutationDeclarations> {
  loaded: boolean;
  error?: CombinedError;
  data?: any;
  mutations?: MutationFns<MutationDeclarations>;
}

export interface ClientProps<MutationDeclarations>
  extends ConnectProps<MutationDeclarations> {
  client: Client;
}

/** Component responsible for implementing the [Client]{@link Client} utility in React. */
export class UrqlClient<MutationDeclarations> extends Component<
  ClientProps<MutationDeclarations>,
  ClientState<MutationDeclarations>
> {
  unsubscribe: () => void;
  nextQueryProp: (query?: Query) => void;
  nextSubscriptionProp: (subscription?: Subscription) => void;
  mutations = getMutationFns(this.props.client, this.props.mutations);

  state = {
    data: undefined,
    error: undefined,
    loaded: false,
  };

  constructor(props) {
    super(props);

    if (
      process.env.NODE_ENV !== 'production' &&
      props.subscription &&
      !props.updateSubscription
    ) {
      throw new Error(
        'You instantiated an Urql Client component with a subscription but forgot an updateSubscription prop. updateSubscription callbacks are required to work with subscriptions.'
      );
    }

    const [queryProp$, nextQueryProp] = makeSubject<void | Query>();
    const [
      subscriptionProp$,
      nextSubscriptionProp,
    ] = makeSubject<void | Subscription>();
    this.nextQueryProp = nextQueryProp;
    this.nextSubscriptionProp = nextSubscriptionProp;

    const queryResults$ = makeQueryResults$(props.client, queryProp$);
    const subscriptionResults$ = makeSubscriptionResults$(
      props.client,
      subscriptionProp$
    );

    const [queryTeardown] = pipe(
      queryResults$,
      subscribe(this.onQueryUpdate)
    );
    const [subscriptionTeardown] = pipe(
      queryResults$,
      subscribe(this.onSubscriptionUpdate)
    );

    this.unsubscribe = () => {
      queryTeardown();
      subscriptionTeardown();
    };
  }

  private onQueryUpdate(result: ExchangeResult) {
    this.setState({
      loaded: true,
      error: result.error,
      data: result.data,
    });
  }

  private onSubscriptionUpdate({ data, error }: ExchangeResult) {
    if (process.env.NODE_ENV !== 'production' && error) {
      throw error;
    }

    this.setState({
      loaded: true,
      error,
      data: this.props.updateSubscription
        ? this.props.updateSubscription(this.state.data, data)
        : this.state.data,
    });
  }

  componentDidMount() {
    this.nextQueryProp(this.props.query);
    this.nextSubscriptionProp(this.props.subscription);
  }

  componentDidUpdate(prevProps: ClientProps<MutationDeclarations>) {
    this.nextQueryProp(this.props.query);
    this.nextSubscriptionProp(this.props.subscription);

    if (prevProps.mutations !== this.props.mutations) {
      this.mutations = getMutationFns(this.props.client, this.props.mutations);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    if (typeof this.props.children !== 'function') {
      return null;
    }

    return this.props.children({
      loaded: this.state.loaded,
      error: this.state.error,
      data: this.state.data,
      mutations: this.mutations || undefined,
    });
  }
}

const makeQueryResults$ = (
  client: Client,
  queryProp$: Source<void | Query>
): Source<ExchangeResult> => {
  const noopQuery = empty as Source<ExchangeResult>;
  let lastResults$: void | Source<ExchangeResult>;

  return pipe(
    queryProp$,
    map(query => {
      return query === undefined ? noopQuery : client.executeQuery(query);
    }),
    filter(x => {
      const isDistinct = x !== lastResults$;
      if (isDistinct) {
        lastResults$ = x;
      }
      return isDistinct;
    }),
    switchAll
  );
};

const makeSubscriptionResults$ = (
  client: Client,
  subscriptionProp$: Source<void | Subscription>
): Source<ExchangeResult> => {
  const noopSubscription = empty as Source<ExchangeResult>;
  let lastResults$: void | Source<ExchangeResult>;

  return pipe(
    subscriptionProp$,
    map(query => {
      return query === undefined
        ? noopSubscription
        : client.executeSubscription(query);
    }),
    filter(x => {
      const isDistinct = x !== lastResults$;
      if (isDistinct) {
        lastResults$ = x;
      }
      return isDistinct;
    }),
    switchAll
  );
};

const getMutationFns = <T>(
  client: Client,
  mutations?: Mutations<T>
): void | MutationFns<T> => {
  if (mutations === undefined) {
    return undefined;
  }

  return Object.keys(mutations).reduce(
    (acc, key) => {
      acc[key] = (variables?: object) =>
        pipe(
          client.executeMutation({
            ...mutations[key],
            variables,
          }),
          toPromise
        );

      return acc;
    },
    {} as MutationFns<T>
  );
};
