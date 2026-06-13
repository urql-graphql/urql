import { stringifyVariables } from '@urql/core';
import type { Cache, Resolver, Variables, NullArray } from '../types';

export type MergeMode = 'outwards' | 'inwards';

/** Input parameters for the {@link relayPagination} factory. */
export interface PaginationParams {
  /** Flip between inwards and outwards pagination.
   *
   * @remarks
   * This is only relevant if you’re querying pages using forwards and
   * backwards pagination at the same time.
   * When set to `'inwards'`, its default, pages that have been queried
   * forward are placed in front of all pages that were queried backwards.
   * When set to `'outwards'`, the two sets are merged in reverse.
   */
  mergeMode?: MergeMode;
}

interface PageInfo {
  __typename: string;
  endCursor: null | string;
  startCursor: null | string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Page {
  __typename: string;
  edges: NullArray<string>;
  nodes: NullArray<string>;
  pageInfo: PageInfo;
}

const defaultPageInfo: PageInfo = {
  __typename: 'PageInfo',
  endCursor: null,
  startCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
};

const ensureKey = (x: any): string | null => (typeof x === 'string' ? x : null);

const concatEdges = (
  cache: Cache,
  leftEdges: NullArray<string>,
  rightEdges: NullArray<string>
) => {
  const ids = new Set<string>();
  for (let i = 0, l = leftEdges.length; i < l; i++) {
    const edge = leftEdges[i] as string | null;
    const node = cache.resolve(edge, 'node');
    if (typeof node === 'string') ids.add(node);
  }

  const newEdges = leftEdges.slice();
  for (let i = 0, l = rightEdges.length; i < l; i++) {
    const edge = rightEdges[i] as string | null;
    const node = cache.resolve(edge, 'node');
    if (typeof node === 'string' && !ids.has(node)) {
      ids.add(node);
      newEdges.push(edge);
    }
  }

  return newEdges;
};

const concatNodes = (
  leftNodes: NullArray<string>,
  rightNodes: NullArray<string>
) => {
  const ids = new Set<string>();
  for (let i = 0, l = leftNodes.length; i < l; i++) {
    const node = leftNodes[i];
    if (typeof node === 'string') ids.add(node);
  }

  const newNodes = leftNodes.slice();
  for (let i = 0, l = rightNodes.length; i < l; i++) {
    const node = rightNodes[i];
    if (typeof node === 'string' && !ids.has(node)) {
      ids.add(node);
      newNodes.push(node);
    }
  }

  return newNodes;
};

const compareArgs = (
  fieldArgs: Variables,
  connectionArgs: Variables
): boolean => {
  for (const key in connectionArgs) {
    if (
      key === 'first' ||
      key === 'last' ||
      key === 'after' ||
      key === 'before'
    ) {
      continue;
    } else if (!(key in fieldArgs)) {
      return false;
    }

    const argA = fieldArgs[key];
    const argB = connectionArgs[key];

    if (
      typeof argA !== typeof argB || typeof argA !== 'object'
        ? argA !== argB
        : stringifyVariables(argA) !== stringifyVariables(argB)
    ) {
      return false;
    }
  }

  for (const key in fieldArgs) {
    if (
      key === 'first' ||
      key === 'last' ||
      key === 'after' ||
      key === 'before'
    ) {
      continue;
    }

    if (!(key in connectionArgs)) return false;
  }

  return true;
};

const getPage = (
  cache: Cache,
  entityKey: string,
  fieldKey: string
): Page | null => {
  const link = ensureKey(cache.resolve(entityKey, fieldKey));
  if (!link) return null;

  const typename = cache.resolve(link, '__typename') as string;
  const edges = (cache.resolve(link, 'edges') || []) as NullArray<string>;
  const nodes = (cache.resolve(link, 'nodes') || []) as NullArray<string>;
  if (typeof typename !== 'string') {
    return null;
  }

  const page: Page = {
    __typename: typename,
    edges,
    nodes,
    pageInfo: defaultPageInfo,
  };

  const pageInfoKey = cache.resolve(link, 'pageInfo');
  if (typeof pageInfoKey === 'string') {
    const pageInfoType = ensureKey(cache.resolve(pageInfoKey, '__typename'));
    const endCursor = ensureKey(cache.resolve(pageInfoKey, 'endCursor'));
    const startCursor = ensureKey(cache.resolve(pageInfoKey, 'startCursor'));
    const hasNextPage = cache.resolve(pageInfoKey, 'hasNextPage');
    const hasPreviousPage = cache.resolve(pageInfoKey, 'hasPreviousPage');

    const pageInfo: PageInfo = (page.pageInfo = {
      __typename: typeof pageInfoType === 'string' ? pageInfoType : 'PageInfo',
      hasNextPage: typeof hasNextPage === 'boolean' ? hasNextPage : !!endCursor,
      hasPreviousPage:
        typeof hasPreviousPage === 'boolean' ? hasPreviousPage : !!startCursor,
      endCursor,
      startCursor,
    });

    if (pageInfo.endCursor === null) {
      const edge = edges[edges.length - 1] as string | null;
      if (edge) {
        const endCursor = cache.resolve(edge, 'cursor');
        pageInfo.endCursor = ensureKey(endCursor);
      }
    }

    if (pageInfo.startCursor === null) {
      const edge = edges[0] as string | null;
      if (edge) {
        const startCursor = cache.resolve(edge, 'cursor');
        pageInfo.startCursor = ensureKey(startCursor);
      }
    }
  }

  return page;
};

/** Reorders cached pages into their logical cursor order.
 *
 * @remarks
 * `inspectFields` returns a connection's pages in the order they were written
 * to the cache, which isn't guaranteed to match the order they should be
 * concatenated in. When two pages are in flight at the same time and the later
 * page's response is written first, the pages would otherwise be merged in the
 * wrong order.
 *
 * Each forward page continues the page whose `endCursor` equals its `after`
 * (and each backward page the one whose `startCursor` equals its `before`), so
 * we can place every linked page directly after the page it continues from.
 * Pages without a known predecessor — including the base page and any page
 * whose predecessor isn't cached — keep their original order, so this only ever
 * corrects pages that have a resolvable place in the chain.
 */
type PageEntry = { args: Variables; page: Page };

const sortPages = (pages: Array<PageEntry>): Array<PageEntry> => {
  if (pages.length < 2) return pages;

  // Index pages by the cursor at each of their boundaries so a page can find
  // the page it directly continues from.
  const byEndCursor = new Map<string, number>();
  const byStartCursor = new Map<string, number>();
  for (let i = 0; i < pages.length; i++) {
    const { endCursor, startCursor } = pages[i].page.pageInfo;
    if (typeof endCursor === 'string') byEndCursor.set(endCursor, i);
    if (typeof startCursor === 'string') byStartCursor.set(startCursor, i);
  }

  const predecessors = new Array<number | undefined>(pages.length);
  const children: number[][] = pages.map(() => []);
  let hasLink = false;
  for (let i = 0; i < pages.length; i++) {
    const { args } = pages[i];
    let predecessor: number | undefined;
    if (typeof args.after === 'string') {
      predecessor = byEndCursor.get(args.after);
    } else if (typeof args.before === 'string') {
      predecessor = byStartCursor.get(args.before);
    }
    if (predecessor !== undefined && predecessor !== i) {
      predecessors[i] = predecessor;
      children[predecessor].push(i);
      hasLink = true;
    }
  }

  if (!hasLink) return pages;

  // Emit each root (a page without a known predecessor) at its original
  // position, immediately followed by the chain of pages that continue from it.
  const sorted: Array<PageEntry> = [];
  const seen = new Set<number>();
  const emit = (index: number): void => {
    if (seen.has(index)) return;
    seen.add(index);
    sorted.push(pages[index]);
    for (let i = 0; i < children[index].length; i++) emit(children[index][i]);
  };
  for (let i = 0; i < pages.length; i++) {
    if (predecessors[i] === undefined) emit(i);
  }
  // Emit any pages left out by a cursor cycle, preserving their original order.
  for (let i = 0; i < pages.length; i++) emit(i);

  return sorted;
};

/** Creates a {@link Resolver} that combines pages that comply to the Relay pagination spec.
 *
 * @param params - A {@link PaginationParams} configuration object.
 * @returns the created Relay pagination {@link Resolver}.
 *
 * @remarks
 * `relayPagination` is a factory that creates a {@link Resolver} that can combine
 * multiple pages on a field that complies to the Relay pagination spec into a single,
 * combined list for infinite scrolling.
 *
 * This resolver will only work on fields that return a `Connection` GraphQL object
 * type, according to the Relay pagination spec.
 *
 * Hint: It's not recommended to use this when you can handle infinite scrolling
 * in your UI code instead.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/local-resolvers#relay-pagination} for more information.
 * @see {@link https://urql.dev/goto/docs/basics/ui-patterns/#infinite-scrolling} for an alternate approach.
 */
export const relayPagination = (
  params: PaginationParams = {}
): Resolver<any, any, any> => {
  const mergeMode = params.mergeMode || 'inwards';

  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const unsortedPages: Array<PageEntry> = [];
    for (let i = 0; i < size; i++) {
      const { fieldKey, arguments: args } = fieldInfos[i];
      if (args === null || !compareArgs(fieldArgs, args)) {
        continue;
      }

      const page = getPage(cache, entityKey, fieldKey);
      if (page !== null) {
        unsortedPages.push({ args, page });
      }
    }

    const pages = sortPages(unsortedPages);

    let typename: string | null = null;
    let startEdges: NullArray<string> = [];
    let endEdges: NullArray<string> = [];
    let startNodes: NullArray<string> = [];
    let endNodes: NullArray<string> = [];
    let pageInfo: PageInfo = { ...defaultPageInfo };

    for (let i = 0; i < pages.length; i++) {
      const { args, page } = pages[i];
      if (page.nodes.length === 0 && page.edges.length === 0 && typename) {
        continue;
      }

      if (
        mergeMode === 'inwards' &&
        typeof args.last === 'number' &&
        typeof args.first === 'number'
      ) {
        const firstEdges = page.edges.slice(0, args.first + 1);
        const lastEdges = page.edges.slice(-args.last);
        const firstNodes = page.nodes.slice(0, args.first + 1);
        const lastNodes = page.nodes.slice(-args.last);

        startEdges = concatEdges(cache, startEdges, firstEdges);
        endEdges = concatEdges(cache, lastEdges, endEdges);
        startNodes = concatNodes(startNodes, firstNodes);
        endNodes = concatNodes(lastNodes, endNodes);

        pageInfo = page.pageInfo;
      } else if (args.after) {
        startEdges = concatEdges(cache, startEdges, page.edges);
        startNodes = concatNodes(startNodes, page.nodes);
        pageInfo.endCursor = page.pageInfo.endCursor;
        pageInfo.hasNextPage = page.pageInfo.hasNextPage;
      } else if (args.before) {
        endEdges = concatEdges(cache, page.edges, endEdges);
        endNodes = concatNodes(page.nodes, endNodes);
        pageInfo.startCursor = page.pageInfo.startCursor;
        pageInfo.hasPreviousPage = page.pageInfo.hasPreviousPage;
      } else if (typeof args.last === 'number') {
        endEdges = concatEdges(cache, page.edges, endEdges);
        endNodes = concatNodes(page.nodes, endNodes);
        pageInfo = page.pageInfo;
      } else {
        startEdges = concatEdges(cache, startEdges, page.edges);
        startNodes = concatNodes(startNodes, page.nodes);
        pageInfo = page.pageInfo;
      }

      if (page.pageInfo.__typename !== pageInfo.__typename)
        pageInfo.__typename = page.pageInfo.__typename;
      if (typename !== page.__typename) typename = page.__typename;
    }

    if (typeof typename !== 'string') {
      return undefined;
    }

    const hasCurrentPage = !!ensureKey(
      cache.resolve(entityKey, fieldName, fieldArgs)
    );
    if (!hasCurrentPage) {
      if (!(info as any).store.schema) {
        return undefined;
      } else {
        info.partial = true;
      }
    }

    return {
      __typename: typename,
      edges:
        mergeMode === 'inwards'
          ? concatEdges(cache, startEdges, endEdges)
          : concatEdges(cache, endEdges, startEdges),
      nodes:
        mergeMode === 'inwards'
          ? concatNodes(startNodes, endNodes)
          : concatNodes(endNodes, startNodes),
      pageInfo: {
        __typename: pageInfo.__typename,
        endCursor: pageInfo.endCursor,
        startCursor: pageInfo.startCursor,
        hasNextPage: pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.hasPreviousPage,
      },
    };
  };
};
