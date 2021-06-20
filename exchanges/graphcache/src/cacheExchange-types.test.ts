import {
  cacheExchange,
  Resolver as GraphCacheResolver,
  UpdateResolver as GraphCacheUpdateResolver,
  OptimisticMutationResolver as GraphCacheOptimisticMutationResolver,
} from './index';

type Maybe<T> = T | null;

type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};
type Author = {
  __typename?: 'Author';
  id?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  friends?: Maybe<Array<Maybe<Author>>>;
  friendsPaginated?: Maybe<Array<Maybe<Author>>>;
};

type MutationToggleTodoArgs = {
  id: Scalars['ID'];
};

type Query = {
  __typename?: 'Query';
  todos?: Maybe<Array<Maybe<Todo>>>;
};

type Todo = {
  __typename?: 'Todo';
  id?: Maybe<Scalars['ID']>;
  text?: Maybe<Scalars['String']>;
  complete?: Maybe<Scalars['Boolean']>;
  author?: Maybe<Author>;
};

type WithTypename<T extends { __typename?: any }> = {
  [K in Exclude<keyof T, '__typename'>]?: T[K];
} & { __typename: NonNullable<T['__typename']> };

type GraphCacheKeysConfig = {
  Todo?: (data: WithTypename<Todo>) => null | string;
};

type GraphCacheResolvers = {
  Query?: {
    todos?: GraphCacheResolver<
      WithTypename<Query>,
      Record<string, never>,
      Array<WithTypename<Todo> | string>
    >;
  };
  Todo?: {
    id?: GraphCacheResolver<
      WithTypename<Todo>,
      Record<string, never>,
      Scalars['ID'] | string
    >;
    text?: GraphCacheResolver<
      WithTypename<Todo>,
      Record<string, never>,
      Scalars['String'] | string
    >;
    complete?: GraphCacheResolver<
      WithTypename<Todo>,
      Record<string, never>,
      Scalars['Boolean'] | string
    >;
    author?: GraphCacheResolver<
      WithTypename<Todo>,
      Record<string, never>,
      WithTypename<Author> | string
    >;
  };
};

type GraphCacheOptimisticUpdaters = {
  toggleTodo?: GraphCacheOptimisticMutationResolver<
    MutationToggleTodoArgs,
    WithTypename<Todo>
  >;
};

type GraphCacheUpdaters = {
  Mutation?: {
    toggleTodo?: GraphCacheUpdateResolver<
      { toggleTodo: WithTypename<Todo> },
      MutationToggleTodoArgs
    >;
  };
  Subscription?: {};
};

type GraphCacheConfig = {
  updates?: GraphCacheUpdaters;
  keys?: GraphCacheKeysConfig;
  optimistic?: GraphCacheOptimisticUpdaters;
  resolvers?: GraphCacheResolvers;
};

describe('typings', function () {
  it('should work with a generic', function () {
    cacheExchange<GraphCacheConfig>({
      keys: {
        Todo: data => data.id || null,
      },
      updates: {
        Mutation: {
          toggleTodo: result => {
            result.toggleTodo.author?.name;
          },
        },
      },
      resolvers: {
        Todo: {
          id: parent => parent.id + '_' + parent.complete,
        },
      },
      optimistic: {
        toggleTodo: (args, cache) => {
          return {
            __typename: 'Todo',
            complete: !cache.resolve(
              { __typename: 'Todo', id: args.id },
              'complete'
            ),
            id: args.id,
          };
        },
      },
    });
  });
});
