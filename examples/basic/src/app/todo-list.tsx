import * as React from 'react';

export interface TodoListProps {
  todos: Array<{ id: string; text: string }>;
  removeTodo: (input: { id: string }) => void;
}

const TodoList: React.SFC<TodoListProps> = ({ todos, removeTodo }) => (
  <ul>
    {todos.map(todo => (
      <li key={todo.id}>
        {todo.text}{' '}
        <button type="button" onClick={removeTodo.bind(null, { id: todo.id })}>
          Remove
        </button>
      </li>
    ))}
  </ul>
);

export default TodoList;
