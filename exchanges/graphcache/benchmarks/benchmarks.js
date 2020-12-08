import urqlClient from './urqlClient.js';
import {
  ALL_TODOS_QUERY,
  ALL_WRITERS_QUERY,
  ALL_BOOKS_QUERY,
  ALL_STORES_QUERY,
  ALL_EMPLOYEES_QUERY,
  ALL_AUTHORS_QUERY,
  ADD_TODO_MUTATION,
  UPDATE_TODO_MUTATION,
  ADD_TODOS_MUTATION,
  ADD_WRITERS_MUTATION,
  ADD_BOOKS_MUTATION,
  ADD_STORES_MUTATION,
  ADD_EMPLOYEES_MUTATION,
  ADD_AUTHORS_MUTATION,
} from './operations.js';

// create functions that execute operations/queries/mutaitons to be benchmarked
export const getAllTodos = async () => {
  const queryResult = await urqlClient.query(ALL_TODOS_QUERY).toPromise();
  return queryResult.data.todos;
};
export const getAllWriters = async () => {
  const queryResult = await urqlClient.query(ALL_WRITERS_QUERY).toPromise();
  return queryResult.data.writers;
};
export const getAllBooks = async () => {
  const queryResult = await urqlClient.query(ALL_BOOKS_QUERY).toPromise();
  return queryResult.data.books;
};
export const getAllStores = async () => {
  const queryResult = await urqlClient.query(ALL_STORES_QUERY).toPromise();
  return queryResult.data.stores;
};
export const getAllEmployees = async () => {
  const queryResult = await urqlClient.query(ALL_EMPLOYEES_QUERY).toPromise();
  return queryResult.data.employees;
};
export const getAllAuthors = async () => {
  const queryResult = await urqlClient.query(ALL_AUTHORS_QUERY).toPromise();
  return queryResult.data.authors;
};
export const addTodo = async () => {
  const newTodo = { text: 'New todo', complete: true };
  const mutationResult = await urqlClient
    .mutation(ADD_TODO_MUTATION, newTodo)
    .toPromise();
  return mutationResult.data.addTodo;
};
export const updateTodo = async ({ id, complete }) => {
  const updatedTodo = { id, complete };
  const mutationResult = await urqlClient
    .mutation(UPDATE_TODO_MUTATION, updatedTodo)
    .toPromise();
  return mutationResult.data.updateTodo;
};
export const addTodos = async todosToBeAdded => {
  const newTodos = { newTodos: { todos: todosToBeAdded } };
  const mutationResult = await urqlClient
    .mutation(ADD_TODOS_MUTATION, newTodos)
    .toPromise();
  return mutationResult.data.addTodos;
};
export const addWriters = async writersToBeAdded => {
  const newWriters = { newWriters: { writers: writersToBeAdded } };
  const mutationResult = await urqlClient
    .mutation(ADD_WRITERS_MUTATION, newWriters)
    .toPromise();
  return mutationResult.data.addWriters;
};
export const addBooks = async booksToBeAdded => {
  const newBooks = { newBooks: { books: booksToBeAdded } };
  const mutationResult = await urqlClient
    .mutation(ADD_BOOKS_MUTATION, newBooks)
    .toPromise();
  return mutationResult.data.addBooks;
};
export const addStores = async storesToBeAdded => {
  const newStores = { newStores: { stores: storesToBeAdded } };
  const mutationResult = await urqlClient
    .mutation(ADD_STORES_MUTATION, newStores)
    .toPromise();
  return mutationResult.data.addStores;
};
export const addEmployees = async employeesToBeAdded => {
  const newEmployees = { newEmployees: { employees: employeesToBeAdded } };
  const mutationResult = await urqlClient
    .mutation(ADD_EMPLOYEES_MUTATION, newEmployees)
    .toPromise();
  return mutationResult.data.addEmployees;
};
export const addAuthors = async authorsToBeAdded => {
  const newAuthors = { newAuthors: { authors: authorsToBeAdded } };
  const mutationResult = await urqlClient
    .mutation(ADD_AUTHORS_MUTATION, newAuthors)
    .toPromise();
  return mutationResult.data.addAuthors;
};
