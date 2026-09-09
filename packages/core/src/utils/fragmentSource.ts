import type { Source } from 'wonka';
import { make } from 'wonka';
import type { FragmentDefinitionNode } from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import type { GraphQLRequestParams } from '../types';
import { createRequest } from './request';
import { getFragments } from './selection';
import type { MaskFragmentResult } from './maskFragment';
import { maskFragment } from './maskFragment';

/** Input arguments for {@link makeFragmentSource}. (BETA)
 *
 * @beta
 */
export interface FragmentSourceArgs<Data = any, Input = Data> {
  /** A GraphQL document containing the fragment definition to mask against.
   *
   * @remarks
   * The document must contain at least one `FragmentDefinitionNode`. When it
   * contains several, `name` selects the definition to use.
   */
  fragment: GraphQLRequestParams<Data, any>['query'];
  /** A JSON object containing this fragment's fields.
   *
   * @remarks
   * `Input` is separate from `Data` so opaque fragment-reference types from
   * gql.tada and GraphQL Code Generator can be passed directly. `null` and
   * `undefined` are emitted unchanged.
   */
  data: Input | null | undefined;
  /** An optional name of the fragment to use from the passed document. */
  name?: string;
}

/** Creates a {@link Source} of masked fragment snapshots for a piece of data. (BETA)
 *
 * @param args - a {@link FragmentSourceArgs} object, passing a `fragment` and `data`.
 * @returns a Wonka {@link Source} issuing {@link MaskFragmentResult | MaskFragmentResults}.
 *
 * @remarks
 * `makeFragmentSource` masks `data` against the fragment's selection set and
 * issues the result synchronously. When the snapshot isn't `fulfilled` because
 * a `@defer`-red part of the selection is still streaming in, the source stays
 * open and issues a new snapshot each time a deferred patch arrives, until the
 * masked data is complete.
 *
 * The {@link Client} associates the underlying deferred promises with streamed
 * query results automatically, so this works for any data that originates from
 * a streamed `@defer` query — independently of any framework bindings.
 *
 * The source completes after issuing a `fulfilled` snapshot, or immediately
 * when missing data has no pending deferred patch (in which case nothing could
 * ever resolve it).
 *
 * @beta
 */
export const makeFragmentSource = <Data = any, Input = Data>(
  args: FragmentSourceArgs<Data, Input>
): Source<MaskFragmentResult<Data>> => {
  const request = createRequest(args.fragment, {});

  const fragment = request.query.definitions.find(
    definition =>
      definition.kind === Kind.FRAGMENT_DEFINITION &&
      (!args.name || definition.name.value === args.name)
  ) as FragmentDefinitionNode | undefined;

  if (!fragment) {
    throw new Error(
      `Passed document did not contain a fragment definition${
        args.name ? ` for "${args.name}"` : ''
      }.`
    );
  }

  const fragments = getFragments(request.query.definitions);

  return make<MaskFragmentResult<Data>>(observer => {
    let ended = false;

    const update = () => {
      if (ended) return;

      const result = maskFragment<Data>(
        args.data as Data,
        fragment.selectionSet,
        fragments
      );

      observer.next(result);
      if (!result.fulfilled && result.pending) {
        result.pending.then(update);
      } else {
        observer.complete();
      }
    };

    if (args.data == null) {
      observer.next({ data: args.data as Data, fulfilled: true });
      observer.complete();
    } else if (typeof args.data !== 'object' || Array.isArray(args.data)) {
      throw new Error(
        'makeFragmentSource expects data to be a fragment object.'
      );
    } else {
      update();
    }

    return () => {
      ended = true;
    };
  });
};
