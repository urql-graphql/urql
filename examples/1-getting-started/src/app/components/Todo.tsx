import React, { FC } from 'react';
import { useMutation } from 'urql';

interface Props {
  complete: boolean;
  text: string;
  id: string;
}

export const Todo: FC<Props> = props => {
  const [mutation, executeMutation] = useMutation(RemoveTodo);

  const handleToggle = () => executeMutation({ id: props.id });

  return (
    <li onClick={handleToggle}>
      <p className={props.complete ? 'strikethrough' : ''}>{props.text}</p>
      {mutation.fetching && <span>(updating)</span>}
    </li>
  );
};

Todo.displayName = 'Todo';

const RemoveTodo = `
mutation($id: ID!) {
  toggleTodo(id: $id) {
    id
  }
}
`;
