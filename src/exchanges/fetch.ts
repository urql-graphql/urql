import { flatMap } from 'rxjs/operators';
import { Exchange } from '../types';
import { CombinedError } from '../lib';

/** A default exchange for fetching GraphQL requests. */
export const fetchExchange: Exchange = () => {
  return ops$ =>
    ops$.pipe(
      flatMap(async operation => {
        if (operation.operationName === 'subscription') {
          throw new Error(
            'Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?'
          );
        }

        const body = JSON.stringify({
          query: operation.query,
          variables: operation.variables,
        });

        let response: Response;
        let result: any;

        try {
          const { url, fetchOptions } = operation.context;
          response = await fetch(url, {
            body,
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            ...fetchOptions,
          });

          checkStatus(fetchOptions.redirect, response);

          result = await response.json();

          return {
            operation,
            data: result.data,
            error: Array.isArray(result.errors)
              ? new CombinedError({
                  graphQLErrors: result.errors,
                  response,
                })
              : undefined,
          };
        } catch (err) {
          if (err.name === 'AbortError') {
            return;
          }

          return {
            operation,
            data: undefined,
            error: new CombinedError({
              networkError: err,
              response,
            }),
          };
        }
      })
    );
};

const checkStatus = (redirectMode: string = 'follow', response: Response) => {
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;

  if (response.status < 200 || response.status > statusRangeEnd) {
    throw new Error(response.statusText);
  }
};
