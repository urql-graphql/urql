import { Component, ReactNode } from 'react';
import {
  Client,
  ChildArgs,
  Query,
  Mutation,
  ClientInstance,
  StreamUpdate,
} from '../types';
import { CombinedError } from '../lib';

export interface ClientState<M> {
  client: ClientInstance;
  fetching: boolean;
  error: Error | CombinedError | CombinedError[];
  data: any | any[];
  mutations: { [type in keyof M]: (vals: any) => void };
}

export interface ClientProps<M> {
  client: Client;
  children: (obj: ChildArgs<M>) => ReactNode;
  query?: Query;
  mutations?: { [type in keyof M]: Mutation };
}

export class UrqlClient<M> extends Component<ClientProps<M>, ClientState<M>> {
  constructor(props: ClientProps<M>) {
    super(props);

    this.state = {
      client: props.client.createInstance({
        onChange: result => this.onStreamUpdate(result),
      }),
      data: undefined,
      error: undefined,
      fetching: true,
      mutations: this.getMutatorFunctions(),
    };
  }

  public componentDidMount() {
    this.state.client.executeQuery(this.props.query);
  }

  public componentDidUpdate(prevProps: ClientProps<M>) {
    if (
      JSON.stringify(prevProps.mutations) !==
      JSON.stringify(this.props.mutations)
    ) {
      this.setState({ mutations: this.getMutatorFunctions() });
    }

    if (JSON.stringify(prevProps.query) !== JSON.stringify(this.props.query)) {
      this.state.client.executeQuery(this.props.query);
    }
  }

  public componentWillUnmount() {
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
        this.state.client.executeQuery(this.props.query, noCache),
    });
  }

  private getMutatorFunctions() {
    if (this.props.mutations === undefined) {
      return;
    }

    const mutations = Object.keys(this.props.mutations).reduce(
      (prev, key) => ({
        ...prev,
        [key]: (variables: any) =>
          this.state.client.executeMutation({
            ...this.props.mutations[key],
            variables,
          }),
      }),
      {}
    ) as ClientState<M>['mutations'];

    return mutations;
  }

  private onStreamUpdate(updated: StreamUpdate) {
    this.setState({
      fetching: updated.fetching,
      error: updated.error,
      data: updated.data,
    });
  }
}
