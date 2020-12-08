import { createClient, dedupExchange } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import { executeExchange } from '@urql/exchange-execute';
import { buildSchema } from 'graphql';
import { ALL_TODOS_QUERY } from './operations';

export const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache) => {
        cache.updateQuery({ query: ALL_TODOS_QUERY }, data => {
          data.todos.push(result.addTodo);
          return data;
        });
        return result;
      },
    },
  },
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
        review: Review
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

    type Author {
        id: ID!
        name: String!
        recognized: Boolean!
        book: Book!
    }

    type Review {
        id: ID!
        score: Int!
        name: String!
        reviewer: Person!
    }

    type Person {
        id: ID!
        name: String!
        verfied: Boolean!
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
        review: NewReview
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

    input NewAuthor {
        id: ID!
        name: String!
        recognized: Boolean!
        book: NewBook!
    }

    
    input NewAuthorsInput {
        authors: [NewAuthor]!
    }
    
    input NewReview {
        id: ID!
        score: Int!
        name: String!
        reviewer: NewPerson!
    }

    input NewPerson {
        id: ID!
        name: String!
        verified: Boolean!
    }

    type Query {
        todos: [Todo]!
        writers: [Writer]!
        books: [Book]!
        stores: [Store]!
        employees: [Employee]!
        authors: [Author]!
    }
    
    type Mutation {
        addTodo( text: String!, complete: Boolean! ): Todo!
        updateTodo( id: ID!, complete: Boolean! ): Todo!
        addTodos( newTodos: NewTodosInput! ): [Todo]!
        addWriters( newWriters: NewWritersInput! ): [Writer]!
        addBooks( newBooks: NewBooksInput! ): [Book]!
        addStores( newStores: NewStoresInput! ): [Store]!
        addEmployees( newEmployees: NewEmployeesInput! ): [Employee]!
        addAuthors( newAuthors: NewAuthorsInput! ): [Author]!
    }
`);

// local state to be used with Execute Exchange
const todos = [];
const writers = [];
const books = [];
const stores = [];
const employees = [];
const authors = [];

// root value with resolvers to be used with Execute Exchange
const rootValue = {
  todos: () => {
    return todos;
  },
  writers: () => {
    return writers;
  },
  books: () => {
    return books;
  },
  stores: () => {
    return stores;
  },
  employees: () => {
    return employees;
  },
  authors: () => {
    return authors;
  },
  addTodo: args => {
    const todo = { id: todos.length.toString(), ...args };
    todos.push(todo);
    return todo;
  },
  updateTodo: ({ id, complete }) => {
    const [todoToBeUpdated] = todos.filter(todo => todo.id === id);
    todoToBeUpdated.complete = complete;
    return todoToBeUpdated;
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
    return employees;
  },
  addAuthors: ({ newAuthors }) => {
    const authorsToBeAdded = newAuthors.authors;
    authors.push(...authorsToBeAdded);
    return authors;
  },
};

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    dedupExchange,
    cache,
    // cacheExchange({}),
    executeExchange({ schema, rootValue }),
  ],
});

export default client;
