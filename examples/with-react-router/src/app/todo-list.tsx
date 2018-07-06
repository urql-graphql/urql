import * as React from 'react';
import { Link } from 'react-router-dom';

export interface TodoListProps {
  todos: Array<{ id: string; text: string }>;
  removeTodo: (input: { id: string }) => void;
}

const TodoList: React.SFC<TodoListProps> = ({ todos, removeTodo }) => (
  <ul>
    {todos.map(todo => (
      <li key={todo.id}>
        <Link to={`/about/${todo.id}`}>{todo.text} </Link>
        <button type="button" onClick={removeTodo.bind(null, { id: todo.id })}>
          Remove
        </button>
      </li>
    ))}
  </ul>
);

export default TodoList;
