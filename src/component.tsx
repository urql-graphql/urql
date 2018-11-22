import * as React from 'react';
import { Observable, of, Subscription } from 'rxjs';
import { cacheExchange, dedupeExchange, fetchExchange } from './exchanges';
import { hashString } from './lib';
import { Exchange, Operation, ExchangeResult, Mutation, Query } from './types';

interface UrqlState {
  fetching: boolean;
  error: boolean;
  data: any[];
  mutate: UrqlProps['mutations'];
  refetch: () => void;
}

interface UrqlProps {
  query: Query | Query[];
  mutations: {
    [key: string]: Mutation;
  };
  exchanges?: Exchange[];
  requestOptions: {
    url: string;
  };
}

const defaultState: UrqlState = {
  fetching: false,
  error: false,
  data: [],
  mutate: {},
  refetch: () => true,
};

export const Context = React.createContext(defaultState);

export const UrqlConsumer = Context.Consumer;

export class UrqlContext extends React.Component<UrqlProps, UrqlState> {
  private subscriptions: Subscription[] = [];

  constructor(props) {
    super(props);

    this.state = {
      fetching: false,
      error: false,
      data: [],
      mutate: this.getMutationTriggers(),
      refetch: () => this.executeQueries(true),
    };
  }

  public componentDidMount() {
    this.executeQueries();
  }

  public componentWillUnmount() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  public render() {
    return (
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    );
  }

  private getMutationTriggers() {
    const mutationTriggers = {};

    Object.keys(this.props.mutations).forEach(mutationKey => {
      mutationTriggers[mutationKey] = () => {
        this.setState({ fetching: true, error: false });

        const operation = {
          ...this.props.mutations[mutationKey],
          key: hashString(JSON.stringify(this.props.mutations[mutationKey])),
          operationName: 'mutation',
          options: this.props.requestOptions,
        };

        const subscription = this.executeOperation(operation).subscribe(
          () => this.executeQueries(),
          err => this.setState({ fetching: false, error: true, data: err })
        );

        this.subscriptions.push(subscription);
      };
    });

    return mutationTriggers;
  }

  private executeQueries(force: boolean = false) {
    const queries = Array.isArray(this.props.query)
      ? this.props.query
      : [this.props.query];

    queries.forEach(query => {
      const operation = {
        ...query,
        key: hashString(JSON.stringify(query)),
        operationName: 'query',
        options: {
          ...this.props.requestOptions,
          force,
        },
      };

      this.setState({ fetching: true });

      const subscription = this.executeOperation(operation).subscribe(
        data => this.setState({ fetching: false, data }),
        err => this.setState({ fetching: false, error: true, data: err })
      );

      this.subscriptions.push(subscription);
    });
  }

  private executeOperation(operation: Operation) {
    const exchanges =
      this.props.exchanges !== undefined
        ? this.props.exchanges
        : defaultExchanges;

    const callExchanges = (
      value: Observable<Operation | ExchangeResult>,
      index: number
    ) => {
      if (exchanges.length <= index) {
        return value;
      }

      return exchanges[index](val => callExchanges(val, index + 1))(
        value as Observable<Operation>
      );
    };

    return callExchanges(of(operation), 0);
  }
}

const defaultExchanges = [dedupeExchange(), cacheExchange(), fetchExchange()];
