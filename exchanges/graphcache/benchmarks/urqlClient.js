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

    type Writer {
        id: ID!
        name: String
        amountOfBooks: Float!
        recognized: Boolean!
        number: Int!
        interests: String!
    }

    type Book {
        id: ID!
        title: String!
        published: Boolean!
        genre: String!
        rating: Float!
    }

    type Store {
        id: ID!
        name: String!
        country: String!
    }

    type Employee {
        id: ID!
        name: String!
        origin: String!
    }

    input NewTodo {
        id: ID!
        text: String!
        complete: Boolean!
    }

    input NewTodosInput {
        todos: [NewTodo]!
    }
    
    input NewWriter {
        id: ID!
        name: String
        amountOfBooks: Float!
        recognized: Boolean!
        number: Int!
        interests: String!
    }

    input NewWritersInput {
        writers: [NewWriter]!
    }

    input NewBook {
        id: ID!
        title: String!
        published: Boolean!
        genre: String!
        rating: Float!
    }

    input NewBooksInput {
        books: [NewBook]!
    }

    input NewStore {
        id: ID!
        name: String!
        country: String!
    }

    input NewStoresInput {
        stores: [NewStore]!
    }

    input NewEmployee {
        id: ID!
        name: String!
        origin: String!
    }

    input NewEmployeesInput {
        employees: [NewEmployee]!
    }

    type Query {
        todos: [Todo]!
    }
    
    type Mutation {
        addTodo( text: String!, complete: Boolean! ): Todo!
        addTodos( newTodos: NewTodosInput! ): [Todo]!
        addWriters( newWriters: NewWritersInput! ): [Writer]!
        addBooks( newBooks: NewBooksInput! ): [Book]!
        addStores( newStores: NewStoresInput! ): [Store]!
        addEmployees( newEmployees: NewEmployeesInput! ): [Employee]!
    }
`);

// // local state to be used with Execute Exchange
const todos = [];
const writers = [];
const books = [];
const stores = [];
const employees = [];

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
    },
    addWriters: ({ newWriters }) => {
        const writersToBeAdded = newWriters.writers;
        writers.push(...writersToBeAdded);
        return writers;
    },
    addBooks: ({ newBooks }) => {
        const booksToBeAdded = newBooks.books;
        books.push(...booksToBeAdded);
        return books;
    },
    addStores: ({ newStores }) => {
        const storesToBeAdded = newStores.stores;
        stores.push(...storesToBeAdded);
        return stores;
    },
    addEmployees: ({ newEmployees }) => {
        const employeesToBeAdded = newEmployees.employees;
        employees.push(...employeesToBeAdded);
        console.log("employees => ", employees);
        return employees;
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