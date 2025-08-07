// @vitest-environment jsdom

import { expect, it, describe } from 'vitest';
import { defineComponent, effectScope, h } from 'vue';
import { mount } from '@vue/test-utils';
import { Client } from '@urql/core';
import { useClient, provideClient } from './useClient';

describe('provideClient and useClient', () => {
  it('provides client to current component instance', async () => {
    const TestComponent = defineComponent({
      setup() {
        provideClient(
          new Client({
            url: 'test',
            exchanges: [],
          })
        );

        const client = useClient();
        expect(client).toBeDefined();
        return null;
      },
    });

    mount(TestComponent);
  });

  it('provides client to child components via provide/inject', async () => {
    const ChildComponent = defineComponent({
      setup() {
        const client = useClient();
        expect(client).toBeDefined();
        return () => null;
      },
    });

    const ParentComponent = defineComponent({
      components: { ChildComponent },
      setup() {
        provideClient(
          new Client({
            url: 'test',
            exchanges: [],
          })
        );
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent);
  });

  it('works in effect scopes outside components', () => {
    const scope = effectScope();

    scope.run(() => {
      provideClient(
        new Client({
          url: 'test',
          exchanges: [],
        })
      );

      const client = useClient();
      expect(client).toBeDefined();
    });
  });

  it('throws error when no client is provided', () => {
    expect(() => {
      const TestComponent = defineComponent({
        setup() {
          // No provideClient called
          useClient(); // Should throw
          return null;
        },
      });

      mount(TestComponent);
    }).toThrow('No urql Client was provided');
  });

  it('throws error when called outside reactive context', () => {
    expect(() => {
      // Called outside any component or scope
      useClient();
    }).toThrow('reactive context');
  });
});
