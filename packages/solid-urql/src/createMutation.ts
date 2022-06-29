import {
  createRequest,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core';
import { createResource, onCleanup, ResourceFetcher } from 'solid-js';
import {
  fromValue,
  pipe,
  Source,
  subscribe,
  Subscription,
  switchMap,
} from 'wonka';
import { DocumentNode } from 'graphql';
import { useClient } from './context';

export const createMutation = <Data = any, Variables = object>(
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>,
  {
    deferStream,
  }: {
    deferStream?: boolean;
  } = {}
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useClient();
  const subscriptions = [] as Subscription[];

  type ExecutePayload = {
    variables: Variables;
    context?: Partial<OperationContext>;
  };

  const fetcher: ResourceFetcher<
    undefined,
    OperationResult<Data, Variables> | undefined
  > = (undefined, { refetching }) => {
    return new Promise<OperationResult<Data, Variables> | undefined>(
      (resolve, reject) => {
        const subscription = pipe(
          fromValue(refetching),
          switchMap(
            (source$): Source<OperationResult<Data, Variables> | 'idle'> => {
              // Only execute the mutation when in "refetch" mode, which is
              //  detected when refetching is not false
              if (isExecutePayload<ExecutePayload>(source$)) {
                const request = createRequest(query, source$.variables);
                const operation = client.createRequestOperation(
                  'mutation',
                  request,
                  source$.context
                );

                return client.executeRequestOperation(operation);
              }

              // On first pass, just pass-thru "idle" flag.
              return fromValue('idle');
            }
          ),
          subscribe(_result => {
            if (_result === 'idle') {
              resolve(undefined);
            } else {
              if (_result.error) reject(_result.error);
              else resolve(_result);
            }
          })
        );
        subscriptions.push(subscription);
      }
    );
  };

  onCleanup(() => {
    subscriptions.forEach(sub => sub.unsubscribe());
  });

  // Create the resource and custom-define execute fn
  const [result, { refetch }] = createResource(fetcher, {
    deferStream,
  });
  const executeMutation = (
    variables: Variables,
    context?: Partial<OperationContext>
  ) => Promise.resolve(refetch({ variables, context }));

  return [result, executeMutation] as const;
};

const isExecutePayload = <T>(payload: unknown): payload is T =>
  typeof payload === 'object' &&
  payload !== null &&
  'variables' in payload &&
  'context' in payload;
