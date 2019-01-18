import { Component, ReactNode } from 'react';
import { CombinedError } from '../lib';
import {
  ChildArgs,
  Client,
  ClientInstance,
  Mutation,
  Query,
  StreamUpdate,
  Subscription,
  SubscriptionStreamUpdate,
} from '../types';

export interface ClientState<MutationDeclarations> {
  client: ClientInstance;
  fetching: boolean;
  error?: Error | CombinedError | CombinedError[];
  data?: any | any[];
  mutations?: { [type in keyof MutationDeclarations]: (vals: any) => void };
}

export interface ClientProps<MutationDeclarations> {
  client: Client;
  children: (obj: ChildArgs<MutationDeclarations>) => ReactNode;
  query?: Query;
  mutations?: { [type in keyof MutationDeclarations]: Mutation };
  subscriptions?: Subscription[];
  updateSubscription?: (
    type: string,
    prev: object | null,
    next: object | null
  ) => object | null;
}

/** Component responsible for implementing the [Client]{@link Client} utility in React. */
export class UrqlClient<MutationDeclarations> extends Component<
  ClientProps<MutationDeclarations>,
  ClientState<MutationDeclarations>
> {
  constructor(props: ClientProps<MutationDeclarations>) {
    super(props);

    this.state = {
      client: props.client.createInstance({
        onChange: result => this.onStreamUpdate(result),
        onSubscriptionUpdate: result => this.onSubscriptionStreamUpdate(result),
      }),
      data: undefined,
      error: undefined,
      fetching: true,
      mutations: this.getMutatorFunctions(),
    };

    if (process.env.NODE_ENV !== 'production') {
      if (props.subscriptions && !props.updateSubscription) {
        throw new Error(
          'You instantiated an Urql Client component with a subscription but forgot an updateSubscription prop. updateSubscription callbacks are required to work with subscriptions.'
        );
      }
    }
  }

  public componentDidMount() {
    if (this.props.query !== undefined) {
      this.state.client.executeQuery(this.props.query);
    }

    this.activateSubscriptions();
  }

  public componentDidUpdate(prevProps: ClientProps<MutationDeclarations>) {
    if (
      JSON.stringify(prevProps.mutations) !==
      JSON.stringify(this.props.mutations)
    ) {
      this.setState({ mutations: this.getMutatorFunctions() });
    }

    if (
      this.props.query !== undefined &&
      JSON.stringify(prevProps.query) !== JSON.stringify(this.props.query)
    ) {
      this.state.client.executeQuery(this.props.query);
    }

    if (
      JSON.stringify(prevProps.subscriptions) !==
      JSON.stringify(this.props.subscriptions)
    ) {
      this.deactiveSubscriptions(prevProps.subscriptions);
      this.activateSubscriptions();
    }
  }

  deactiveSubscriptions = (subscriptions: Subscription[] = []) => {
    subscriptions.forEach(sub =>
      this.state.client.executeUnsubscribeSubscription(sub)
    );
  };

  activateSubscriptions = () => {
    (this.props.subscriptions || []).forEach(sub =>
      this.state.client.executeSubscription(sub)
    );
  };

  public componentWillUnmount() {
    this.deactiveSubscriptions(this.props.subscriptions);
    this.state.client.unsubscribe();
  }

  public render() {
    if (typeof this.props.children !== 'function') {
      return null;
    }

    return this.props.children({
      fetching: this.state.fetching,
      error: this.state.error,
      data: this.state.data,
      mutations: this.state.mutations,
      refetch: (noCache: boolean = false) =>
        this.props.query !== undefined
          ? this.state.client.executeQuery(this.props.query, noCache)
          : undefined,
    });
  }

  private getMutatorFunctions() {
    if (this.props.mutations === undefined) {
      return undefined;
    }

    const mutations = Object.keys(this.props.mutations).reduce(
      (prev, key) => ({
        ...prev,
        [key]: (variables: any) =>
          this.state.client.executeMutation({
            // @ts-ignore -  mutation key definitely exists
            ...this.props.mutations[key],
            variables,
          }),
      }),
      {}
    ) as ClientState<MutationDeclarations>['mutations'];

    return mutations;
  }

  private onStreamUpdate(updated: StreamUpdate) {
    this.setState({
      fetching: updated.fetching,
      error: updated.error,
      data: updated.data,
    });
  }

  private onSubscriptionStreamUpdate(updated: SubscriptionStreamUpdate) {
    const [type, data] = Object.entries(updated.data)[0];

    if (process.env.NODE_ENV !== 'production') {
      if (updated.error) {
        throw updated.error;
      }
    }

    this.setState({
      error: updated.error,
      data: this.props.updateSubscription
        ? this.props.updateSubscription(type, this.state.data, data)
        : this.state.data,
    });
  }
}
