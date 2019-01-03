import React from 'react';
import { mount } from 'enzyme';
import { useMutation } from './hook-mutation';
import { ContextProvider } from '../components/context';

const executeMutation = jest.fn();

const client = {
  createInstance: () => ({
    executeMutation,
  }),
};

describe('useMutation', () => {
  const query = `foobar`;

  it('returns a promise with the mutation resolution', () => {
    const Component = () => {
      const mutation = useMutation(query);

      return <div onClick={() => mutation({})} />;
    };

    const wrapper = mount(
      <div>
        <ContextProvider value={client}>
          <Component />
        </ContextProvider>
      </div>
    );

    wrapper.find('[onClick]').simulate('click');

    expect(executeMutation).toBeCalledWith(
      expect.objectContaining({
        query,
      })
    );
  });

  it('takes variables as part of the hook definition and/or the callsite', () => {
    const Component = () => {
      const mutation = useMutation(query, { arg1: true });

      return <div onClick={() => mutation({ arg2: true })} />;
    };

    const wrapper = mount(
      <div>
        <ContextProvider value={client}>
          <Component />
        </ContextProvider>
      </div>
    );

    wrapper.find('[onClick]').simulate('click');

    expect(executeMutation).toBeCalledWith(
      expect.objectContaining({
        variables: {
          arg1: true,
          arg2: true,
        },
      })
    );
  });
});
