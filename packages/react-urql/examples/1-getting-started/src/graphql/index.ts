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

  type Mutation {
    toggleTodo(id: ID!): Todo
    addTodo(text: String!): Todo
    deleteTodo(id: ID!): Todo
  }

  type Query {
    todos: [Todo]
  }
`);

export const rootValue = {
  todos: async () => {
    console.log('getting todos');
    const db = await database;
    return db
      .transaction(['todos'], 'readonly')
      .objectStore('todos')
      .getAll();
  },
  toggleTodo: async (root: any, { id }: any) => {
    console.log('toggling todos');
    const db = await database;
    const txTodos = db.transaction(['todos'], 'readwrite').objectStore('todos');

    const oldTodo = await txTodos.get(id);
    const newTodo = { ...oldTodo, complete: !oldTodo.complete };

    await txTodos.put(newTodo);
    await txTodos.transaction.done;

    console.log(newTodo);
    return newTodo;
  },
  addTodo: () => {
    return null;
  },
  deleteTodo: () => {
    return null;
  },
};
