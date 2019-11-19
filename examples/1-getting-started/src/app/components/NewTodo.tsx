import React, { FC, useState } from 'react';
import { useMutation } from 'urql';

const AddTodo = `
  mutation($text: String!) {
    addTodo(text: $text) @populate
  }
`;

export const NewTodo: FC = () => {
  const [value, setValue] = useState('');

  const [addTodoMutation, executeAddTodoMutation] = useMutation(AddTodo);

  function addTodo() {
    executeAddTodoMutation({ text: value });
    setValue('');
  }

  return (
    <div>
      <input
        type="text"
        required
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        disabled={addTodoMutation.fetching || value.length === 0}
        onClick={addTodo}
      >
        add
      </button>
    </div>
  );
};

NewTodo.displayName = 'NewTodo';
