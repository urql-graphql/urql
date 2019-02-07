import React from 'react';
import { useMutation } from 'urql';

export const Todo = props => {
  const [mutation, executeMutation] = useMutation(RemoveTodo);

  const handleButtonClick = () => executeMutation({ id: props.id });

  const getButtonText = () => {
    if (mutation.fetching || mutation.data === undefined) {
      return 'deleting...';
    }

    if (mutation.error) {
      return 'unable to delete.';
    }

    return 'remove';
  };

  return (
    <li>
      <p>{props.text}</p>>
      <button type="button" onClick={handleButtonClick}>
        {getButtonText()}
      </button>
    </li>
  );
};

const RemoveTodo = `
mutation($id: ID!) {
  removeTodo(id: $id) {
    id
  }
}
`;
