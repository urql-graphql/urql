import {
  createRequest,
  OperationContext,
  OperationResult,
  RequestPolicy,
  TypedDocumentNode,
} from '@urql/core';
import { Accessor, createResource, onCleanup, ResourceFetcher } from 'solid-js';
import {
  combine,
  fromValue,
  never,
  pipe,
  Source,
  subscribe,
  Subscription,
  switchMap,
} from 'wonka';
import { DocumentNode } from 'graphql';
import { useClient } from './context';

export const createQuery = <Data = any, Variables = object>(
  args: Accessor<CreateQueryArgs<Variables, Data>>,
  {
    deferStream,
  }: {
    deferStream?: boolean;
  } = {}
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useClient();
  const subscriptions = [] as Subscription[];

  // Resource fetcher
  const fetcher: ResourceFetcher<
    CreateQueryArgs<Variables, Data>,
    OperationResult<Data, Variables>
  > = (source, { refetching }) => {
    return new Promise<OperationResult<Data, Variables>>((resolve, reject) => {
      const subscription = pipe(
        combine(fromValue(source), fromValue(refetching)),
        switchMap(
          ([source$, refetching$]): Source<
            OperationResult<Data, Variables>
          > => {
            if (source$.pause) return never as any;

            // If refetching, merge refetch options into main source options
            const mergedSource = isRefetchPayload<
              Partial<CreateQueryArgs<Variables, Data>>
            >(refetching$)
              ? {
                  ...source$,
                  ...refetching$,
                }
              : source$;

            const request = createRequest(
              mergedSource.query,
              mergedSource.variables
            );
            const operation = client.createRequestOperation('query', request, {
              requestPolicy: mergedSource.requestPolicy,
              ...mergedSource.context,
            });

            return client.executeRequestOperation(operation);
          }
        ),
        subscribe(result => {
          if (result.error) reject(result.error);
          else resolve(result);
        })
      );
      subscriptions.push(subscription);
    });
  };

  onCleanup(() => {
    subscriptions.forEach(sub => sub.unsubscribe());
  });

  // Create the resource and override the refetch method for better typing/defaults.
  const [data, ops] = createResource(args, fetcher, { deferStream });
  const refetch = (args: Partial<CreateQueryArgs<Variables, Data>> = {}) =>
    ops.refetch(args);
  return [
    data,
    {
      ...ops,
      refetch,
    },
  ] as const;
};

const isRefetchPayload = <T>(payload: unknown): payload is T =>
  typeof payload === 'object' && payload !== null;

export type CreateQueryArgs<Variables = object, Data = any> = {
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  variables?: Variables;
  requestPolicy?: RequestPolicy;
  context?: Partial<OperationContext>;
  pause?: boolean;
};
