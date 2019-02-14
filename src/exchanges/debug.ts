// tslint:disable no-console
import { pipe, tap } from 'wonka';
import { Exchange } from '../types';

export const debugExchange: Exchange = ({ forward }) => {
  return ops$ =>
    pipe(
      ops$,
      tap(op => console.log('[Exchange debug]: Incoming operation: ', op)),
      forward,
      tap(result =>
        console.log('[Exchange debug]: Completed operation: ', result)
      )
    );
};
