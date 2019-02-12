import React from 'react';
import { useMutation } from 'urql';

export const Todo = props => {
  const [mutation, executeMutation] = useMutation(RemoveTodo);

  const handleToggle = () => executeMutation({ id: props.id });

  return (
    <li onClick={handleToggle}>
      <p className={`${props.complete ? 'strikethrough' : ''}`}>{props.text}</p>
      {mutation.fetching && <span>(updating)</span>}
    </li>
  );
};

const RemoveTodo = `
mutation($id: ID!) {
  toggleTodo(id: $id) {
    id
  }
}
`;
