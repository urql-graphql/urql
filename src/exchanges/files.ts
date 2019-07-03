import { print } from 'graphql';
import { extractFiles } from 'extract-files';
import { filter, pipe, map } from 'wonka';
import { Operation } from 'src/types';

const fileExchange = ({ forward }) => {
  const isMutation = (operation: Operation) =>
    operation.operationName === 'mutation';

  return ops$ => {
    const preFlight$ = pipe(
      ops$,
      filter(isMutation),
      map(operation => {
        const { url } = operation.context;
        let { files } = extractFiles(operation);
        if (!files.length) return true;

        files = files.values();
        const extraOptions =
          typeof operation.context.fetchOptions === 'function'
            ? operation.context.fetchOptions()
            : operation.context.fetchOptions || {};

        const fetchOptions = {
          method: 'POST',
          headers: {
            ...extraOptions.headers,
          },
        };

        const form = new FormData();
        form.append(
          'operations',
          JSON.stringify({
            query: print(operation.query),
            variables: Object.assign({}, operation.variables, { file: null }),
          })
        );

        const map = files.reduce((acc, path, i) => ({ ...acc, [i]: path }), {});
        form.append('map', JSON.stringify(map));
        files.forEach((file, i) => {
          form.append(`${i}`, file, file.name);
        });

        (fetchOptions as any).body = form;

        fetch(url, fetchOptions)
          .then(res => res.json())
          .then(json => json);

        return false;
      })
    );

    return forward(preFlight$);
  };
};

export default fileExchange;
