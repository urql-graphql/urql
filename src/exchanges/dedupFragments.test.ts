import { empty, pipe, fromValue, toPromise, Source } from 'wonka';
import { dedupFragmentsExchange } from './dedupFragments';
import { queryOperation } from '../test-utils';
import { createRequest } from '../utils';
import { OperationResult } from '../types';
import { Client } from '../client';

const linkFragment = `
fragment LinkFragment on Link {
  url
}
`;

const imageFragment = `
fragment ImageFragment on Image {
  src 
  link {
    ...LinkFragment
  }
}
${linkFragment}
`;

const queryWithDuplicateFragments = `
query MyQuery {
  homepage {
    content {
      ...on Image {
        ...ImageFragment
      }
      ...on Link {
        ...LinkFragment
      }
    }
  }
  ${linkFragment}
  ${imageFragment}
}
`;

const request = createRequest(queryWithDuplicateFragments);

const exchangeArgs = {
  forward: () => empty as Source<OperationResult>,
  client: {} as Client,
};

it('removes duplicate fragment definitions from the query', async () => {
  const fetchOptions = jest.fn().mockReturnValue({});
  const data = await pipe(
    fromValue({
      ...queryOperation,
      query: request.query,
      operationName: 'query',
      context: {
        ...queryOperation.context,
        fetchOptions,
      },
    }),
    dedupFragmentsExchange(exchangeArgs),
    toPromise
  );
  /** ?? */
});
