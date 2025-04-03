import type * as GraphQL from 'graphql';

type OrNever<T> = void extends T ? never : T;

export type IntrospectionQuery =
  | {
      readonly __schema: {
        queryType: { name: string; kind?: any };
        mutationType?: { name: string; kind?: any } | null;
        subscriptionType?: { name: string; kind?: any } | null;
        types?: readonly IntrospectionType[];
      };
    }
  | OrNever<GraphQL.IntrospectionQuery>;

export type IntrospectionTypeRef =
  | {
      readonly kind:
        | 'SCALAR'
        | 'OBJECT'
        | 'INTERFACE'
        | 'ENUM'
        | 'UNION'
        | 'INPUT_OBJECT';
      readonly name?: string;
      readonly ofType?: IntrospectionTypeRef;
    }
  | OrNever<GraphQL.IntrospectionTypeRef>;

export type IntrospectionInputTypeRef =
  | {
      readonly kind: 'SCALAR' | 'ENUM' | 'INPUT_OBJECT';
      readonly name?: string;
      readonly ofType?: IntrospectionInputTypeRef;
    }
  | OrNever<GraphQL.IntrospectionInputTypeRef>;

export type IntrospectionInputValue =
  | {
      readonly name: string;
      readonly description?: string | null;
      readonly defaultValue?: string | null;
      readonly type: IntrospectionInputTypeRef;
    }
  | OrNever<GraphQL.IntrospectionInputValue>;

export type IntrospectionType =
  | {
      readonly kind: string;
      readonly name: string;
      readonly fields?: readonly any[];
      readonly interfaces?: readonly any[];
      readonly possibleTypes?: readonly any[];
    }
  | OrNever<GraphQL.IntrospectionType>;
