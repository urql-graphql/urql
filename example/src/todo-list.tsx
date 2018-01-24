import React from 'react';

const TodoList = ({ todos, removeTodo }) => (
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
