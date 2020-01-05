import { html } from 'htm/preact';
import { useQuery, useMutation } from '@urql/preact';
import { useMemo } from 'preact/hooks';
import { Fragment } from 'preact';

const ToggleTodo = `
  mutation($id: ID!) {
    toggleTodo(id: $id) {
      id
      complete
    }
  }
`;

const DeleteTodo = `
  mutation($id: ID!) {
    deleteTodo(id: $id) {
      id
    }
  }
`;

const TodoQuery = gql`
  query {
    todos {
      id
      text
      complete
    }
  }
`;

export const Home = () => {
  const [res, executeQuery] = useQuery({ query: TodoQuery });

  const [toggleTodoMutation, executeToggleTodoMutation] = useMutation(
    ToggleTodo
  );
  const [deleteTodoMutation, executeDeleteTodoMutation] = useMutation(
    DeleteTodo
  );

  const todos = useMemo(() => {
    if (res.fetching || res.data === undefined) {
      return html`<p>Loading</p>`;
    }

    if (res.error) {
      return html`<p>${res.error.message}</p>`;
    }

    return html`
      <ul>
        ${res.data.todos.map(todo => html`
          <div key=${todo.id}>
            <p>${todo.text}</p>
            <button onClick=${() => executeToggleTodoMutation({ id: todo.id })}>
              ${todo.complete ? 'complete' : 'uncomplete'}
            </button>
            <button onClick=${() => executeDeleteTodoMutation({ id: todo.id })}>
              Delete
            </button>
          </div>
        `)}
      </ul>
    `;
  }, [
    res,
    toggleTodoMutation,
    deleteTodoMutation,
    executeToggleTodoMutation,
    executeDeleteTodoMutation,
  ]);

  return html`
    <${Fragment}>
      ${todos}
      <button onClick=${() => executeQuery({ requestPolicy: 'network-only' })}>Refetch</button>
    </${Fragment}>
  `;
};
