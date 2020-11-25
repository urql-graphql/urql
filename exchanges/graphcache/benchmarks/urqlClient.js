import { createClient, dedupExchange } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import { executeExchange } from '@urql/exchange-execute';
import { buildSchema } from 'graphql';

export const cache = cacheExchange({
    resolvers: {
        Todo: {
            text(parent, args, cache, info) {
                console.log("query => parent", parent);
                console.log("query => args", args);
                console.log("query => cache", cache);
                console.log("query => info", info);
                return parent.text;
            }
        }
    },
    updates: {
        Mutation: {
            addTodo: (result, args, cache) => {
                console.log("mutations => result", result);
                console.log("mutations => args", args);
                console.log("mutations => cache", cache);
                return result;
            }
        }
    }
});

// local schema to be used with Execute Exchange
const schema = buildSchema(`
    type Todo {
        id: ID!
        text: String!
        complete: Boolean!
    }

    input NewTodo {
        id: ID!
        text: String!
        complete: Boolean!
    }

    input NewTodosInput {
        todos: [NewTodo]!
    }
    
    type Query {
        todos: [Todo]!
    }
    
    type Mutation {
        addTodo( text: String!, complete: Boolean! ): Todo!
        addTodos( newTodos: NewTodosInput! ): [Todo]
    }
`);

// // local state to be used with Execute Exchange
const todos = [];

// // root value with resolvers to be used with Execute Exchange
const rootValue = {
    todos: () => {
        return todos;
    },
    addTodo: args => {
        const todo = { id: todos.length.toString(), ...args };
        todos.push(todo);
        return todo;
    },
    addTodos: ({ newTodos }) => {
        const todosToBeAdded = newTodos.todos;
        todos.push(...todosToBeAdded);
        return todos;
    }
};

const client = createClient({
    url: "http://localhost:3000/graphql",
    exchanges: [
        dedupExchange,
        // cache,
        cacheExchange({}),
        executeExchange({ schema, rootValue })
    ]
});

export default client;