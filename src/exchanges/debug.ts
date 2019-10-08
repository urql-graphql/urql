import { pipe, tap } from 'wonka';
import { Exchange } from '../types';

const defaultLogFormat = (message: string, data: object) => ({ message, data });
// eslint-disable-next-line no-console
const defaultLogFn = ({ message, data }) => console.log(message, data);

export const debugExchange = ({
  logFn = defaultLogFn,
  logFormat = defaultLogFormat,
}): Exchange => ({ forward }) => {
  if (process.env.NODE_ENV === 'production') {
    return ops$ => forward(ops$);
  } else {
    return ops$ =>
      pipe(
        ops$,
        tap(op =>
          logFn(logFormat('[Exchange debug]: Incoming operation: ', op))
        ),
        forward,
        tap(result =>
          logFn(logFormat('[Exchange debug]: Completed operation: ', result))
        )
      );
  }
};
