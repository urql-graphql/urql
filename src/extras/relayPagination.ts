import { stringifyVariables } from 'urql';
import { Cache, Resolver, Variables, NullArray } from '../types';

export type MergeMode = 'outwards' | 'inwards';

export interface PaginationParams {
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
    const edge = leftEdges[i];
    const node = cache.resolve(edge, 'node');
    if (typeof node === 'string') ids.add(node);
  }

  const newEdges = leftEdges.slice();
  for (let i = 0, l = rightEdges.length; i < l; i++) {
    const edge = rightEdges[i];
    const node = cache.resolve(edge, 'node');
    if (typeof node === 'string' && !ids.has(node)) {
      ids.add(node);
      newEdges.push(edge);
    }
  }

  return newEdges;
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

  return true;
};

const getPage = (cache: Cache, linkKey: string): Page | null => {
  const link = ensureKey(cache.resolveValueOrLink(linkKey));
  if (!link) return null;

  const typename = cache.resolve(link, '__typename') as string;
  const edges = cache.resolve(link, 'edges') as NullArray<string>;
  if (typeof typename !== 'string' || !Array.isArray(edges)) {
    return null;
  }

  const page: Page = {
    __typename: typename,
    edges,
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
      const edge = edges[edges.length - 1];
      if (edge) {
        const endCursor = cache.resolve(edge, 'cursor');
        pageInfo.endCursor = ensureKey(endCursor);
      }
    }

    if (pageInfo.startCursor === null) {
      const edge = edges[0];
      if (edge) {
        const startCursor = cache.resolve(edge, 'cursor');
        pageInfo.startCursor = ensureKey(startCursor);
      }
    }
  }

  return page;
};

export const relayPagination = (params: PaginationParams = {}): Resolver => {
  const mergeMode = params.mergeMode || 'inwards';

  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: key, fieldName } = info;

    const connections = cache.resolveConnections(key, fieldName);
    const size = connections.length;
    if (size === 0) {
      return undefined;
    }

    let typename = '';
    let startEdges: NullArray<string> = [];
    let endEdges: NullArray<string> = [];
    let pageInfo: PageInfo = { ...defaultPageInfo };

    for (let i = 0; i < size; i++) {
      const [args, linkKey] = connections[i];
      if (!compareArgs(fieldArgs, args)) {
        continue;
      }

      const page = getPage(cache, linkKey);
      if (page === null) {
        continue;
      } else if (
        mergeMode === 'inwards' &&
        typeof args.last === 'number' &&
        typeof args.first === 'number'
      ) {
        // This is a special but rare case for simultaneously merging first and last edges
        if (page.edges.length < args.first + args.last) {
          startEdges = concatEdges(cache, startEdges, page.edges);
          pageInfo.hasNextPage = false;
          pageInfo.hasPreviousPage = false;
          pageInfo.startCursor = null;
          pageInfo.endCursor = null;
          break;
        } else {
          const firstEdges = page.edges.slice(0, args.first);
          const lastEdges = page.edges.slice(-args.last);
          startEdges = concatEdges(cache, startEdges, firstEdges);
          endEdges = concatEdges(cache, lastEdges, endEdges);
        }

        pageInfo = page.pageInfo;
      } else if (args.after) {
        startEdges = concatEdges(cache, startEdges, page.edges);
        pageInfo.endCursor = page.pageInfo.endCursor;
        pageInfo.hasNextPage = page.pageInfo.hasNextPage;
      } else if (args.before) {
        endEdges = concatEdges(cache, page.edges, endEdges);
        pageInfo.startCursor = page.pageInfo.startCursor;
        pageInfo.hasPreviousPage = page.pageInfo.hasPreviousPage;
      } else if (typeof args.last === 'number') {
        endEdges = concatEdges(cache, endEdges, page.edges);
        pageInfo = page.pageInfo;
      } else {
        startEdges = concatEdges(cache, startEdges, page.edges);
        pageInfo = page.pageInfo;
      }

      if (page.pageInfo.__typename !== pageInfo.__typename)
        pageInfo.__typename = page.pageInfo.__typename;
      if (typename !== page.__typename) typename = page.__typename;
    }

    if (
      typeof typename !== 'string' ||
      startEdges.length + endEdges.length === 0
    ) {
      return undefined;
    }

    const hasCurrentPage = !!ensureKey(
      cache.resolve(key, fieldName, fieldArgs)
    );
    if (!hasCurrentPage) {
      if ((info as any).schemaPredicates === undefined) {
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
