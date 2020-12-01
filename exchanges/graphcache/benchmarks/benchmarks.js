import urqlClient from './urqlClient.js';
import { ALL_TODOS_QUERY, ALL_WRITERS_QUERY, ALL_BOOKS_QUERY, ALL_STORES_QUERY, ALL_EMPLOYEES_QUERY,ADD_TODO_MUTATION, ADD_TODOS_MUTATION, ADD_WRITERS_MUTATION, ADD_BOOKS_MUTATION, ADD_STORES_MUTATION, ADD_EMPLOYEES_MUTATION } from "./operations.js";

// create functions that execute operations/queries/mutaitons to be benchmarked
export const getAllTodos = async () => {
    const queryResult = await urqlClient.query(ALL_TODOS_QUERY).toPromise();
    console.log("getAllTodoss Query Result", queryResult);
};
export const getAllWriters = async () => {
    const queryResult = await urqlClient.query(ALL_WRITERS_QUERY).toPromise();
    console.log("getAllWriterss Query Result", queryResult);
};
export const getAllBooks = async () => {
    const queryResult = await urqlClient.query(ALL_BOOKS_QUERY).toPromise();
    console.log("getAllBooks Query Result", queryResult);
};
export const getAllStores = async () => {
    const queryResult = await urqlClient.query(ALL_STORES_QUERY).toPromise();
    console.log("getAllStores Query Result", queryResult);
};
export const getAllEmployees = async () => {
    const queryResult = await urqlClient.query(ALL_EMPLOYEES_QUERY).toPromise();
    console.log("getAllEmployees Query Result", queryResult);
};
export const addTodo = async () => {
    const newTodo = newTodo = { text: 'New todo', complete: true };
    const mutationResult = await urqlClient.mutation(ADD_TODO_MUTATION, newTodo).toPromise();
    console.log("addTodo Mutation Result", mutationResult);
};
export const addTodos = async todosToBeAdded => {
    const newTodos = { newTodos: { todos: todosToBeAdded } };
    const mutationResult = await urqlClient.mutation(ADD_TODOS_MUTATION, newTodos).toPromise();
    console.log("addTodos Mutation Result", mutationResult);
};
export const addWriters = async writersToBeAdded => {
    const newWriters = { newWriters: { writers: writersToBeAdded } };
    const mutationResult = await urqlClient.mutation(ADD_WRITERS_MUTATION, newWriters).toPromise();
    console.log("addWriters Mutation Result", mutationResult);
};
export const addBooks = async booksToBeAdded => {
    const newBooks = { newBooks: { books: booksToBeAdded } };
    const mutationResult = await urqlClient.mutation(ADD_BOOKS_MUTATION, newBooks).toPromise();
    console.log("addBooks Mutation Result", mutationResult);
};
export const addStores = async storesToBeAdded => {
    const newStores = { newStores: { stores: storesToBeAdded } };
    const mutationResult = await urqlClient.mutation(ADD_STORES_MUTATION, newStores).toPromise();
    console.log("addStores Mutation Result", mutationResult);
};
export const addEmployees = async employeesToBeAdded => {
    const newEmployees = { newEmployees: { employees: employeesToBeAdded } };
    const mutationResult = await urqlClient.mutation(ADD_EMPLOYEES_MUTATION, newEmployees).toPromise();
    console.log("addEmployees Mutation Result", mutationResult);
};