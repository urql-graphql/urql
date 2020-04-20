import { empty, Source } from 'wonka';
import { Exchange } from '../types';
import { composeExchanges } from './compose';
import { noop } from '../utils';

const mockClient = {} as any;

const forward = jest.fn();
const noopExchange: Exchange = ({ forward }) => ops$ => forward(ops$);

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(1234);
});

it('composes exchanges correctly', () => {
  let counter = 0;

  const firstExchange: Exchange = ({ client, forward }) => {
    expect(client).toBe(mockClient);
    expect(counter++).toBe(1);

    return ops$ => {
      expect(counter++).toBe(2);
      return forward(ops$);
    };
  };

  const secondExchange: Exchange = ({ client, forward }) => {
    expect(client).toBe(mockClient);
    expect(counter++).toBe(0);

    return ops$ => {
      expect(counter++).toBe(3);
      return forward(ops$);
    };
  };

  const exchange = composeExchanges([firstExchange, secondExchange]);
  const outerFw = jest.fn(() => noopExchange) as any;

  exchange({ client: mockClient, forward: outerFw, dispatchDebug: noop })(
    empty as Source<any>
  );
  expect(outerFw).toHaveBeenCalled();
  expect(counter).toBe(4);
});

describe('on dispatchDebug', () => {
  it('dispatches debug event with exchange source name', () => {
    const dispatchDebug = jest.fn();
    const debugArgs = {
      type: 'test',
      message: 'Hello',
    } as any;

    const testExchange: Exchange = ({ dispatchDebug }) => {
      dispatchDebug(debugArgs);
      return () => empty as Source<any>;
    };

    composeExchanges([testExchange])({
      client: mockClient,
      forward,
      dispatchDebug,
    });

    expect(dispatchDebug).toBeCalledTimes(1);
    expect(dispatchDebug).toBeCalledWith({
      ...debugArgs,
      timestamp: Date.now(),
      source: 'testExchange',
    });
  });
});
