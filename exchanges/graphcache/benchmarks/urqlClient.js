import { createClient, dedupExchange } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import { executeExchange } from '@urql/exchange-execute';
import { buildSchema } from 'graphql';

export const cache = cacheExchange({});

// // local schema to be used with Execute Exchange
const schema = buildSchema(`
    type Todo {
        id: ID!
        text: String!
    }

    type Query {
        todos: [Todo]!
    }

    type Mutation {
        addTodo( text: String! ): Todo!
    }
`);

// // local state to be used with Execute Exchange
const todos = [
    { id: 1, text: '1st todo' },
    { id: 2, text: '2nd todo' }
];

// // root value with resolvers to be used with Execute Exchange
const rootValue = {
    todos: () => todos,
    addTodo: args => {
        const todo = { id: todos.length.toString(), ...args };
        todos.push(todo);
        return todo;
    }
};

const client = createClient({
    url: "http://localhost:3000/graphql",
    exchanges: [
        dedupExchange,
        cache,
        executeExchange({schema, rootValue})
    ]
});

export default client;