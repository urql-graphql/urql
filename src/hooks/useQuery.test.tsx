import { FunctionalComponent as FC, h } from 'preact';
import { render, cleanup } from '@testing-library/preact';
import { OperationContext } from 'urql/core';
import { useQuery, UseQueryArgs, UseQueryState } from './useQuery';
import { map, interval, pipe } from 'wonka';
import { Provider } from '../context';

const mock = {
  executeQuery: jest.fn(() =>
    pipe(
      interval(400),
      map((i: number) => ({ data: i, error: i + 1, extensions: { i: 1 } }))
    )
  ),
};

// @ts-ignore
const client = mock as { executeQuery: jest.Mock };
const props: UseQueryArgs<{ myVar: number }> = {
  query: '{ example }',
  variables: {
    myVar: 1234,
  },
  pause: false,
};

// @ts-ignore
let state: UseQueryState<any> | undefined;
// @ts-ignore
let execute: ((opts?: Partial<OperationContext>) => void) | undefined;

const QueryUser: FC<UseQueryArgs<{ myVar: number }>> = ({
  query,
  variables,
  pause,
}) => {
  const [s, e] = useQuery({ query, variables, pause });
  state = s;
  execute = e;
  return h('p', {}, s.data);
};

beforeAll(() => {
  // eslint-disable-next-line no-console
  console.log(
    'supressing console.error output due to react-test-renderer spam (hooks related)'
  );
  jest.spyOn(global.console, 'error').mockImplementation();
});

describe('useQuery', () => {
  beforeEach(() => {
    client.executeQuery.mockClear();
    state = undefined;
    execute = undefined;
  });

  afterEach(() => cleanup());

  it('executes subscription', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );
    expect(client.executeQuery).toBeCalledTimes(1);
  });

  it('passes query and vars to executeQuery', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    expect(client.executeQuery).toBeCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: props.variables,
      },
      expect.objectContaining({
        requestPolicy: undefined,
      })
    );
  });

  it('sets fetching to true', () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );
    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );
    expect(state).toHaveProperty('fetching', true);
  });
});
