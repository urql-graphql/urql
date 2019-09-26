import { Cache, Resolver, NullArray } from '../types';

export type MergeMode = 'outwards' | 'inwards';

export interface PaginationParams {
  mergeMode?: MergeMode;
}

interface PageInfo {
  endCursor: null | string;
  startCursor: null | string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Page {
  edges: NullArray<string>;
  pageInfo: PageInfo;
}

const defaultPageInfo: PageInfo = {
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

const getPage = (cache: Cache, linkKey: string): Page | null => {
  const link = ensureKey(cache.resolveValueOrLink(linkKey));
  if (!link) return null;

  const edges = cache.resolve(link, 'edges') as NullArray<string>;
  if (
    !Array.isArray(edges) ||
    !edges.every(x => x === null || typeof x === 'string')
  ) {
    return null;
  }

  const page: Page = { edges, pageInfo: defaultPageInfo };
  const pageInfoKey = cache.resolve(link, 'pageInfo');
  if (typeof pageInfoKey === 'string') {
    const endCursor = ensureKey(cache.resolve(pageInfoKey, 'endCursor'));
    const startCursor = ensureKey(cache.resolve(pageInfoKey, 'startCursor'));
    const hasNextPage = cache.resolve(pageInfoKey, 'hasNextPage');
    const hasPreviousPage = cache.resolve(pageInfoKey, 'hasPreviousPage');

    const pageInfo: PageInfo = (page.pageInfo = {
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

  return (_parent, args, cache, info) => {
    const { parentKey: key, fieldName } = info;

    const connections = cache.resolveConnections(key, fieldName);
    const size = connections.length;
    const entityKey = ensureKey(cache.resolve(key, fieldName, args));
    if (size === 0 || !entityKey) {
      return undefined;
    }

    const typename = cache.resolve(entityKey, '__typename');

    const pageInfoKey = ensureKey(cache.resolve(entityKey, 'pageInfo'));
    const pageInfoTypename = cache.resolve(pageInfoKey, '__typename');
    if (typeof typename !== 'string' || typeof pageInfoTypename !== 'string') {
      return undefined;
    }

    let startEdges: NullArray<string> = [];
    let endEdges: NullArray<string> = [];
    let pageInfo: PageInfo = { ...defaultPageInfo };

    for (let i = 0; i < size; i++) {
      const [args, linkKey] = connections[i];
      const page = getPage(cache, linkKey);
      if (page === null) {
        continue;
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
    }

    return {
      __typename: typename,
      edges:
        mergeMode === 'inwards'
          ? concatEdges(cache, startEdges, endEdges)
          : concatEdges(cache, endEdges, startEdges),
      pageInfo: {
        __typename: pageInfoTypename,
        endCursor: pageInfo.endCursor,
        startCursor: pageInfo.startCursor,
        hasNextPage: pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.hasPreviousPage,
      },
    };
  };
};
