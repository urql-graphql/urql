import urqlClient from './urqlClient.js';
import { ALL_TODOS_QUERY, ADD_TODO_MUTATION, ADD_TODOS_MUTATION, ADD_WRITERS_MUTATION } from "./operations.js";

// create functions that execute operations/queries/mutaitons to be benchmarked
export const getAllTodos = async () => {
    const queryResult = await urqlClient.query(ALL_TODOS_QUERY).toPromise();
    console.log("getAllTodoss Query Result", queryResult);
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
    console.log("writersToBeAdded => ", writersToBeAdded);
    const newWriters = { newWriters: { writers: writersToBeAdded } };
    console.log("newWriters => ", newWriters);
    const mutationResult = await urqlClient.mutation(ADD_WRITERS_MUTATION, newWriters).toPromise();
    console.log("addWriters Mutation Result", mutationResult);
};