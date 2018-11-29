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
  mutation?: { [type in keyof M]: Mutation };
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

  public componentDidUpdate(prevProps) {
    if (prevProps.mutation !== this.props.mutation) {
      this.setState({ mutations: this.getMutatorFunctions() });
    }

    if (prevProps.query !== this.props.query) {
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
    if (this.props.mutation === undefined) {
      return;
    }

    const mutations = Object.keys(this.props.mutation).reduce(
      (prev, key) => ({
        ...prev,
        [key]: (variables: any) =>
          this.state.client.executeMutation({
            ...this.props.mutation[key],
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
