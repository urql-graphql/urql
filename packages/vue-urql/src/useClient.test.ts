import { expect, it, describe } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { cacheExchange, Client, dedupExchange, fetchExchange } from '@urql/core';
import { useClient, provideClient } from './useClient';

describe('provideClient', () => {
  it('provides client to current component instance', async () => {
    const TestComponent = defineComponent({
      setup() {
        provideClient(
          new Client({
            url: 'test',
            exchanges: [dedupExchange, cacheExchange, fetchExchange]
          })
        );

        const client = useClient();
        expect(client).toBeDefined();
        return null;
      },
    });

    mount(TestComponent);
  });
});
