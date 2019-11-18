import { pipe, tap, map } from 'wonka';
import { Exchange, Operation, OperationResult } from '../types';
import {
  DocumentNode,
  SelectionSetNode,
  print,
  ASTNode,
  FieldNode,
  buildClientSchema,
  buildASTSchema,
  buildSchema,
  typeFromAST,
  execute,
  visitWithTypeInfo,
  printSchema,
  TypeInfo,
} from 'graphql';
import { parse, visit, NonNullTypeNode } from 'graphql';
import { type } from 'os';
import { object } from 'prop-types';

type TypeFragmentMap<T extends string = string> = Record<
  T & '_fragments',
  string[] | undefined
>;

interface ExchangeArgs {
  schema: any;
}

/** An exchange for auto-populating mutations with a required response body. */
export const mutateBodyExchange = ({ schema }: ExchangeArgs): Exchange => ({
  forward,
}) => {
  let typeFragments: TypeFragmentMap = { _fragments: [] };

  const handleMutation = op => op;

  const handleTeardown = op => op;

  const handleOperation = (op: Operation) => {
    if (op.operationName === 'mutation') {
      return handleMutation(op);
    }

    if (op.operationName === 'query') {
      return handleQuery(op);
    }

    if (op.operationName === 'teardown') {
      return handleTeardown(op);
    }

    return op;
  };

  const handleQueryResponse = (op: OperationResult) => {
    if (op.error) {
      return;
    }

    if (op.operation.query) console.log(op.operation.query);
    console.log(op.data);
    console.log('map response', buildTypeMap(op.data));
  };

  const handleResponse = (op: OperationResult) => {
    if (op.operation.operationName === 'query') {
      return handleQueryResponse(op);
    }
  };

  const handleIncomingQuery = (op: Operation) => {
    if (op.operationName !== 'query') {
      return;
    }

    typeFragments = makeFragmentsFromQuery(schema, op.query, typeFragments);
  };

  return ops$ => {
    return pipe(
      ops$,
      map(handleOperation),
      forward,
      tap(handleResponse)
    );
  };
};

const buildTypeMap = (obj: any, typemap: any = {}) => {
  if (Array.isArray(obj)) {
    return buildTypeMap(obj[0], typemap);
  }

  if (typeof obj !== 'object' || obj === null) {
    return typemap;
  }

  if ('__typename' in obj) {
    const { __typename, ...keys } = obj;
    const existingKeys = typemap[__typename] || [];

    console.log(existingKeys);
    return {
      ...typemap,
      [obj.__typename]: [...existingKeys, ...Object.keys(keys)],
    };
  }

  return Object.values(obj).reduce(
    (map, vals) => buildTypeMap(vals, map),
    typemap
  );
};

/** Stolen from urql */
const collectTypes = (obj: any, types: string[] = []) => {
  if (Array.isArray(obj)) {
    obj.forEach(inner => {
      collectTypes(inner, types);
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (key === '__typename' && typeof val === 'string') {
          types.push(val);
        } else if (typeof val === 'object' && val !== null) {
          collectTypes(val, types);
        }
      }
    }
  }

  return types;
};

const collectTypesFromResponse = (response: object) =>
  collectTypes(response as any).filter((v, i, a) => a.indexOf(v) === i);

/** Creates fragments object from query */
export const makeFragmentsFromQuery = (
  schema: any,
  query: DocumentNode,
  fragmentMap: TypeFragmentMap
) => {
  let f = fragmentMap;
  const typeInfo = new TypeInfo(buildClientSchema(schema));

  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: (node, key, parent, path) => {
        if (!node.selectionSet) {
          return undefined;
        }

        // @ts-ignore
        const t = typeInfo.getType().ofType;

        if (!t) {
          return undefined;
        }

        f = {
          ...f,
          [t]: [...(f[t] || []), print(node.selectionSet)],
        };
      },
      FragmentDefinition: (node, key, parent, path) => {
        f = {
          ...f,
          _fragments: [...(f._fragments || []), print(node)],
        };
      },
    })
  );

  return f;
};

const nodeHasTypename = (o: SelectionSetNode) =>
  o.selections.some(v => v.kind === 'Field' && v.name.value === '__typename');

// export const getTypeFromSchema = (
//   schema: any,
//   query: DocumentNode,
//   path: readonly (string | number)[]
// ) => {
//   const s = schema.__schema;
//   // console.log('schema is', schema);
//   path.reduce(
//     (p, c) => {
//       if (p.node.kind !== 'Field') {
//         return { ...p, node: p.node[c] };
//       }

//       const newType = schema.__schema
//       return { type:  }

//       console.log('node is', p.node);
//       console.log('path is', c);
//       return p;
//     },
//     {
//       type: schema.__schema.types.find(t => t.name === 'Query'),
//       node: query as ASTNode,
//     }
//   );
//   // console.log(query);
//   // console.log(path);
// };

const getTypenameFromResponse = (
  query: DocumentNode,
  data: any,
  path: readonly (string | number)[]
) => {
  console.log('path is', path);
  const reduced = path.reduce(
    (p, key, i) => {
      // console.log('key is', key);
      // console.log(p.node);
      // console.log('node is', p.node[key]);

      if (p.node.kind !== 'Field' && p.node.kind !== 'SelectionSet') {
        return { ...p, node: p.node[key] };
      }

      // console.log('data is', p.data[key]);
      return {
        node: p.node[key],
        data: Array.isArray(p.data) ? p.data[0][key] : p.data[key],
      };
    },
    { node: query as ASTNode, data }
  );

  console.log(reduced);

  return Array.isArray(reduced.data)
    ? reduced.data[0]['__typename']
    : reduced.data['__typename'];
};
