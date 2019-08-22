import { pipe, map } from 'wonka';
import { Exchange, Operation } from '../types';
import { DefinitionNode } from 'graphql';

export const dedupFragmentsExchange: Exchange = ({ forward }) => {
  const dedupFragments = (operation: Operation) => {
    const { query } = operation;
    const { definitions } = query;

    const filteredDefinitions = definitions.reduce(
      (acc: DefinitionNode[], definition: DefinitionNode) => {
        // @ts-ignore TODO
        const { kind, name } = definition;
        /* If this definition isn't a fragment, include it */
        if (kind !== 'FragmentDefinition') return [...acc, definition];
        /* If the accumulator already has a fragment with this name, omit this definition */
        return acc.some(
          def =>
            def.kind === 'FragmentDefinition' && def.name.value === name.value
        )
          ? acc
          : [...acc, definition];
      },
      []
    );

    return {
      ...operation,
      query: {
        ...query,
        definitions: filteredDefinitions,
      },
    };
  };

  return ops$ => {
    const forward$ = pipe(
      ops$,
      map(dedupFragments)
    );
    return forward(forward$);
  };
};
