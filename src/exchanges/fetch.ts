import { Exchange } from '../types';
import { mergeMap } from 'rxjs/operators';

export const fetchExchange = (): Exchange => () => ops$ =>
  ops$.pipe(
    mergeMap(operation =>
      fetch(operation.options.url, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          query: operation.query,
          variables: operation.variables,
        }),
      }).then(response => response.json())
    )
  );
