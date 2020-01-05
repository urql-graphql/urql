import { h } from 'preact';
import { render } from '@testing-library/preact';
import { useImmediateEffect } from './useImmediateEffect';
import { act } from 'preact/test-utils';

const Component = ({ assertion, effect }) => {
  useImmediateEffect(effect, [effect]);
  if (assertion) assertion();
  return null;
};

it('calls effects immediately on mount', () => {
  const effect = jest.fn();

  act(() => {
    render(
      h(Component, {
        assertion: () => expect(effect).toHaveBeenCalledTimes(1),
        effect,
      })
    );
  });

  expect(effect).toHaveBeenCalledTimes(1);
});

it('behaves like useEffect otherwise', () => {
  const effect = jest.fn();
  const effectRerender = jest.fn();
  let rerender;

  act(() => {
    ({ rerender } = render(
      h(Component, {
        assertion: () => expect(effect).toHaveBeenCalledTimes(1),
        effect,
      })
    ));
  });

  act(() => {
    rerender(
      h(Component, {
        assertion: () => expect(effectRerender).toHaveBeenCalledTimes(0),
        effect: effectRerender,
      })
    );
  });
  expect(effectRerender).toHaveBeenCalledTimes(1);
});
