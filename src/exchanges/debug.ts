import { pipe, tap } from 'wonka';
import { Exchange } from '../types';

export const debugExchange: Exchange = ({ forward }) => {
  if (process.env.NODE_ENV === 'production') {
    return ops$ => forward(ops$);
  } else {
    return ops$ =>
      pipe(
        ops$,
        // eslint-disable-next-line no-console
        tap(op => console.log('[Exchange debug]: Incoming operation: ', op)),
        forward,
        tap(result =>
          // eslint-disable-next-line no-console
          console.log('[Exchange debug]: Completed operation: ', result)
        )
      );
  }
};
