// @ts-ignore
import { useState, useEffect, useContext } from 'react';
import Client from '../client';
import { context } from '../../components/context';
import { IExchangeResult, IMutationHook } from '../../interfaces/index';

export function useMutation<Args, Result>(
  mutationQuery: string,
  passedVars: Object = {}
): IMutationHook<Args, Result> {
  const client: Client = useContext(context);

  return variables =>
    new Promise<IExchangeResult<Result>['data']>((resolve, reject) => {
      client
        .executeMutation$({
          query: mutationQuery,
          variables: {
            ...passedVars,
            ...(variables as Object),
          },
        })
        .subscribe({
          error: e => {
            reject(e);
          },
          next: result => {
            resolve(result);
          },
        });
    });
}
