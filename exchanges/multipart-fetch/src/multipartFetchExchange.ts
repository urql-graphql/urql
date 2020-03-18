import { Kind, DocumentNode, OperationDefinitionNode, print } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import { extractFiles } from 'extract-files';
import {
  Exchange,
  Operation,
  OperationResult,
  makeResult,
  makeErrorResult,
} from '@urql/core';

interface Body {
  query: string;
  variables: void | object;
  operationName?: string;
}

const isOperationFetchable = (operation: Operation) =>
  operation.operationName === 'query' || operation.operationName === 'mutation';

export const multipartFetchExchange: Exchange = ({ forward }) => ops$ => {
  const sharedOps$ = share(ops$);

  const fetchResults$ = pipe(
    sharedOps$,
    filter(isOperationFetchable),
    mergeMap(operation => {
      const teardown$ = pipe(
        sharedOps$,
        filter(
          op => op.operationName === 'teardown' && op.key === operation.key
        )
      );

      return pipe(
        createFetchSource(
          operation,
          operation.operationName === 'query' &&
            !!operation.context.preferGetMethod
        ),
        takeUntil(teardown$)
      );
    })
  );

  const forward$ = pipe(
    sharedOps$,
    filter(op => !isOperationFetchable(op)),
    forward
  );

  return merge([fetchResults$, forward$]);
};

const getOperationName = (query: DocumentNode): string | null => {
  const node = query.definitions.find(
    (node: any): node is OperationDefinitionNode => {
      return node.kind === Kind.OPERATION_DEFINITION && node.name;
    }
  );

  return node && node.name ? node.name.value : null;
};

const createFetchSource = (operation: Operation, shouldUseGet: boolean) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    operation.operationName === 'subscription'
  ) {
    throw new Error(
      'Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?'
    );
  }

  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;

    const { context } = operation;
    // Spreading operation.variables here in case someone made a variables with Object.create(null).
    const { files, clone } = extractFiles({ ...operation.variables });

    const extraOptions =
      typeof context.fetchOptions === 'function'
        ? context.fetchOptions()
        : context.fetchOptions || {};

    const operationName = getOperationName(operation.query);

    const body: Body = {
      query: print(operation.query),
      variables: operation.variables,
    };

    if (operationName !== null) {
      body.operationName = operationName;
    }

    const fetchOptions = {
      ...extraOptions,
      method: shouldUseGet ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...extraOptions.headers,
      },
      signal:
        abortController !== undefined ? abortController.signal : undefined,
    };

    if (!!files.size) {
      fetchOptions.body = new FormData();
      fetchOptions.method = 'POST';
      // Make fetch auto-append this for correctness
      delete fetchOptions.headers['content-type'];

      fetchOptions.body.append('operations', JSON.stringify({
        ...body,
        variables: clone,
      }));

      const map = {};
      let i = 0;
      files.forEach(paths => {
        map[++i] = paths.map(path => `variables.${path}`);
      });
      fetchOptions.body.append('map', JSON.stringify(map));

      i = 0;
      files.forEach((_, file) => {
        (fetchOptions.body as FormData).append(`${++i}`, file, file.name);
      });
    } else if (shouldUseGet) {
      operation.context.url = convertToGet(operation.context.url, body);
    } else {
      fetchOptions.body = JSON.stringify(body);
    }

    let ended = false;

    Promise.resolve()
      .then(() => (ended ? undefined : executeFetch(operation, fetchOptions)))
      .then((result: OperationResult | undefined) => {
        if (!ended) {
          ended = true;
          if (result) next(result);
          complete();
        }
      });

    return () => {
      ended = true;
      if (abortController !== undefined) {
        abortController.abort();
      }
    };
  });
};

const executeFetch = (
  operation: Operation,
  opts: RequestInit
): Promise<OperationResult> => {
  const { url, fetch: fetcher } = operation.context;
  let response: Response | undefined;

  return (fetcher || fetch)(url, opts)
    .then(res => {
      const { status } = res;
      const statusRangeEnd = opts.redirect === 'manual' ? 400 : 300;
      response = res;

      if (status < 200 || status >= statusRangeEnd) {
        throw new Error(res.statusText);
      } else {
        return res.json();
      }
    })
    .then(result => makeResult(operation, result, response))
    .catch(err => {
      if (err.name !== 'AbortError') {
        return makeErrorResult(operation, err, response);
      }
    });
};

export const convertToGet = (uri: string, body: Body): string => {
  const queryParams: string[] = [`query=${encodeURIComponent(body.query)}`];

  if (body.variables) {
    queryParams.push(
      `variables=${encodeURIComponent(JSON.stringify(body.variables))}`
    );
  }

  return uri + '?' + queryParams.join('&');
};
