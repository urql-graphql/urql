import { buildSchema } from 'graphql';
import { openDB } from 'idb';

const database = openDB('SW_STATE_DB', 2, {
  upgrade: async db => {
    const store = await db.createObjectStore('todos', {
      keyPath: 'id',
      autoIncrement: true,
    });
    store.put({ text: 'Go to the shops', complete: false });
    store.put({ text: 'Pick up the kids', complete: true });
    store.put({ text: 'Install urql', complete: false });
  },
});

export const schema = buildSchema(`
  type Todo {
    id: ID
    text: String
    complete: Boolean
  }

  type Query {
    todos: [Todo]
  }

  type Mutation {
    toggleTodo(id: ID!): Todo
    addTodo(text: String!): Todo
    deleteTodo(id: ID!): Todo
  }
`);

export const rootValue = {
  todos: async () => {
    const db = await database;
    return db
      .transaction(['todos'], 'readonly')
      .objectStore('todos')
      .getAll();
  },
  toggleTodo: async ({ id }: any) => {
    const db = await database;
    const txTodos = db.transaction(['todos'], 'readwrite').objectStore('todos');

    const oldTodo = await txTodos.get(Number(id));
    const newTodo = { ...oldTodo, complete: !oldTodo.complete };

    await txTodos.put(newTodo);
    await txTodos.transaction.done;

    return newTodo;
  },
  addTodo: async (args: any) => {
    const db = await database;
    const txTodos = db.transaction(['todos'], 'readwrite').objectStore('todos');

    const id = await txTodos.put(args);
    const todo = await txTodos.get(id);
    await txTodos.transaction.done;

    return todo;
  },
  deleteTodo: async ({ id }: any) => {
    const db = await database;
    const txTodos = db.transaction(['todos'], 'readwrite').objectStore('todos');

    const todo = await txTodos.get(Number(id));
    await txTodos.delete(Number(id));
    await txTodos.transaction.done;

    return todo;
  },
};
