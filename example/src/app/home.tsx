/* tslint:disable */

import * as React from 'react';
import {
  Connect,
  createQuery,
  createMutation,
  createSubscription,
} from '../../../src/';
import TodoList from './todo-list';
import TodoForm from './todo-form';

export interface ITodoQuery {
  todos: Array<{ id: string; text: string }>;
  user: {
    name: string;
  };
}

export interface ITodoMutations {
  addTodo: (input: { text: string }) => void;
  removeTodo: (input: { id: string }) => void;
}

const handleSubscription = (type, data, todo) => {
  switch (type) {
    case 'todoAdded':
      if (data.todos.find(t => t.id === todo.id) === undefined) {
        data.todos.push(todo);
      }
      break;
    case 'todoRemoved':
      data.todos.splice(data.todos.findIndex(t => t.id === todo.id), 1);
      break;
  }

  return data;
};

class Home extends React.Component<
  {},
  { attachAddSubscriptions: boolean; attachRemoveSubscriptions: boolean }
> {
  state = {
    attachAddSubscriptions: false,
    attachRemoveSubscriptions: false,
  };

  defaultSubscriptions = [
    createSubscription(TodoAdded),
    createSubscription(TodoRemoved),
  ];

  render() {
    const subscriptions = [];

    this.state.attachAddSubscriptions &&
      subscriptions.push(createSubscription(TodoAdded));
    this.state.attachRemoveSubscriptions &&
      subscriptions.push(createSubscription(TodoRemoved));

    return (
      <Connect
        query={createQuery(TodoQuery)}
        mutations={{
          addTodo: createMutation(AddTodo),
          removeTodo: createMutation(RemoveTodo),
        }}
        subscriptions={subscriptions}
        updateSubscription={handleSubscription}
        children={({ data, error, mutations, fetching, refetch }) => {
          const content = fetching ? (
            <Loading />
          ) : error ? (
            <Error />
          ) : (
            <TodoList todos={data.todos} removeTodo={mutations.removeTodo} />
          );

          return (
            <div>
              {content}
              <TodoForm addTodo={mutations.addTodo} />
              <button type="button" onClick={() => refetch()}>
                Refetch
              </button>
              <button type="button" onClick={() => refetch(true)}>
                Refetch (Skip Cache)
              </button>
              <br />
              <br />
              <div>
                <div>TodoAdded Subscription</div>
                <button
                  type="button"
                  onClick={() =>
                    this.setState(s => ({
                      attachAddSubscriptions: !s.attachAddSubscriptions,
                    }))
                  }
                >
                  {this.state.attachAddSubscriptions
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </div>

              <div>
                <div>TodoRemoved Subscription</div>
                <button
                  type="button"
                  onClick={() =>
                    this.setState(s => ({
                      attachRemoveSubscriptions: !s.attachRemoveSubscriptions,
                    }))
                  }
                >
                  {this.state.attachRemoveSubscriptions
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </div>
            </div>
          );
        }}
      />
    );
  }
}

const Loading = () => <p>Loading...</p>;

const Error = () => <p>Error!</p>;

const AddTodo = `
mutation($text: String!) {
  addTodo(text: $text) {
    id
    text
  }
}
`;

const RemoveTodo = `
mutation($id: ID!) {
  removeTodo(id: $id) {
    id
  }
}
`;

const TodoQuery = `
query {
  todos {
    id
    text
  }
  user {
    name
  }
}
`;

const TodoAdded = `
subscription todoAdded {
  todoAdded {
    id
    text
  }
}
`;

const TodoRemoved = `
subscription todoRemoved {
  todoRemoved {
    id
  }
}
`;

export default Home;
