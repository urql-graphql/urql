'use client';

import { AnyVariables, createRequest, useQuery as orig_useQuery } from 'urql';
import { useUrqlValue } from './useUrqlValue';

const transportKeys = ['data', 'error'];
export const useQuery: typeof orig_useQuery = args => {
  const request = createRequest(
    args.query,
    (args.variables || {}) as AnyVariables
  );
  useUrqlValue(request.key);

  const [result, execute] = orig_useQuery(args);

  const transported: any = {};
  for (const key of transportKeys) {
    // @ts-ignore
    transported[key] = result[key];
  }

  useUrqlValue(request.key, transported);

  return [result, execute];
};
