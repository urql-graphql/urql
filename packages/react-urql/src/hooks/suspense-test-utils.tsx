import type { Mock } from 'vitest';
import { vi } from 'vitest';
import * as React from 'react';
import { Client, fetchExchange } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';

const fetch = (globalThis as any).fetch as Mock;

export interface FetchMockRequest {
  url: string;
  body: {
    query?: string;
    variables?: Record<string, unknown>;
    operationName?: string;
  } | null;
  resolve: (response: MockResponse) => void;
  resolved?: boolean;
}

export interface MockResponse {
  data?: unknown;
  errors?: Array<{ message: string; path?: string[] }>;
  hasNext?: boolean;
}

export interface FetchMockController {
  requests: FetchMockRequest[];
  respond: (
    data: unknown,
    options?: {
      errors?: Array<{ message: string; path?: string[] }>;
      hasNext?: boolean;
    }
  ) => void;
  respondToLatest: (
    data: unknown,
    options?: {
      errors?: Array<{ message: string; path?: string[] }>;
      hasNext?: boolean;
    }
  ) => void;
  respondWithNetworkError: (error: Error) => void;
  reset: () => void;
}

export const createFetchMockController = (): FetchMockController => {
  const requests: FetchMockRequest[] = [];
  const pendingResolvers: Array<{
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
  }> = [];

  fetch.mockImplementation((url: string, options?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      let body: FetchMockRequest['body'] = null;

      if (options && options.body) {
        if (typeof options.body === 'string') {
          try {
            body = JSON.parse(options.body);
          } catch {
            body = { query: options.body };
          }
        } else if (options.body instanceof FormData) {
          const operations = options.body.get('operations');
          if (operations && typeof operations === 'string') {
            try {
              body = JSON.parse(operations);
            } catch {
              // ignore
            }
          }
        }
      }

      if (!body && url.includes('?')) {
        const urlObj = new URL(url);
        const query = urlObj.searchParams.get('query');
        const variables = urlObj.searchParams.get('variables');
        const operationName = urlObj.searchParams.get('operationName');
        if (query || variables) {
          body = {
            query: query || undefined,
            variables: variables ? JSON.parse(variables) : undefined,
            operationName: operationName || undefined,
          };
        }
      }

      const request: FetchMockRequest = {
        url,
        body,
        resolve: (mockResponse: MockResponse) => {
          const responseBody = JSON.stringify({
            data: mockResponse.data,
            errors: mockResponse.errors,
            hasNext: mockResponse.hasNext,
          });
          resolve({
            status: 200,
            headers: { get: () => 'application/json' },
            text: vi.fn().mockResolvedValue(responseBody),
          } as unknown as Response);
        },
      };

      requests.push(request);
      pendingResolvers.push({ resolve: request.resolve as any, reject });
    });
  });

  return {
    requests,
    respond(data, options = {}) {
      const request = requests.find(r => !r.resolved);
      if (!request) throw new Error('No pending fetch request');
      request.resolve({
        data,
        errors: options.errors,
        hasNext: options.hasNext,
      });
      request.resolved = true;
    },
    respondToLatest(data, options = {}) {
      const request = requests[requests.length - 1];
      if (!request) throw new Error('No pending fetch request');
      if (request.resolved) throw new Error('Request already resolved');
      request.resolve({
        data,
        errors: options.errors,
        hasNext: options.hasNext,
      });
      request.resolved = true;
    },
    respondWithNetworkError(error: Error) {
      const pendingIndex = requests.findIndex(r => !r.resolved);
      if (pendingIndex === -1) throw new Error('No pending fetch request');
      pendingResolvers[pendingIndex].reject(error);
      requests[pendingIndex].resolved = true;
    },
    reset() {
      requests.length = 0;
      pendingResolvers.length = 0;
      fetch.mockClear();
    },
  };
};

export const assertSuspenseInvariant = (
  result: { data?: unknown; error?: unknown; fetching: boolean },
  pause?: boolean
) => {
  if (pause) return;
  const hasData = result.data !== undefined && result.data !== null;
  const hasError = result.error !== undefined;
  if (!hasData && !hasError) {
    throw new Error(
      `Suspense invariant violation: component rendered without data or error. ` +
        `This should never happen - suspense should keep the component suspended. ` +
        `Result: ${JSON.stringify({ data: result.data, error: result.error, fetching: result.fetching })}`
    );
  }
};

export const setupSuspenseTestEnvironment = (
  abort: ReturnType<typeof vi.fn>
) => {
  (globalThis as any).AbortController = function AbortController(this: any) {
    this.signal = undefined;
    this.abort = abort;
  };

  vi.spyOn(globalThis.console, 'error').mockImplementation(() => {
    // suppress React error boundary warnings in tests
  });
};

export interface CreateTestClientOptions {
  useGraphcache?: boolean;
  cacheOpts?: Parameters<typeof cacheExchange>[0];
  url?: string;
}

export const createTestClient = (options: CreateTestClientOptions = {}) => {
  const {
    useGraphcache = false,
    cacheOpts,
    url = 'http://test/graphql',
  } = options;

  const exchanges = useGraphcache
    ? [cacheExchange(cacheOpts), fetchExchange]
    : [fetchExchange];

  return new Client({
    url,
    suspense: true,
    exchanges,
  });
};

export const Fallback = () => <div data-testid="fallback">Loading...</div>;
