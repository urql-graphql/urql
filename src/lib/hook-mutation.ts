// @ts-ignore
import { useContext } from 'react';
import { context } from '../components/context';
import { Client, MutationHook } from '../types';

export function useMutation<Args>(
  mutationQuery: string,
  passedVars: object = {}
): MutationHook<Args> {
  const client = (useContext(context) as any) as Client;

  return variables =>
    new Promise((resolve, reject) => {
      const inst = client.createInstance({
        onChange: result => {
          if (result.error) {
            reject(result.error);
            return;
          }

          resolve(result);
        },
      });

      inst.executeMutation({
        query: mutationQuery,
        variables: {
          ...passedVars,
          ...((variables as any) as object),
        },
      });
    });
}
