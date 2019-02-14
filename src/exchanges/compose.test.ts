import { empty, Source } from 'wonka';
import { Client } from '../client';
import { Exchange } from '../types';
import { composeExchanges } from './compose';

const mockClient = {} as Client;
const noopExchange: Exchange = ({ forward }) => ops$ => forward(ops$);

it('returns the first exchange if it is the only input', () => {
  expect(composeExchanges([noopExchange])).toBe(noopExchange);
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

  exchange({ client: mockClient, forward: outerFw })(empty as Source<any>);
  expect(outerFw).toHaveBeenCalled();
  expect(counter).toBe(4);
});
