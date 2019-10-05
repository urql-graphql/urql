import React, { FC } from 'react';
import { useMutation } from 'urql';

interface Props {
  complete: boolean;
  text: string;
  disabled: boolean;
  loading: boolean;
  toggleTodo: () => void;
  deleteTodo: () => void;
}

export const Todo: FC<Props> = ({
  complete,
  deleteTodo,
  loading,
  text,
  toggleTodo,
  disabled,
}) => {
  return (
    <li>
      <p onClick={toggleTodo} className={complete ? 'strikethrough' : ''}>
        {text}
      </p>
      {loading && <span>(updating)</span>}
      <button
        disabled={disabled}
        className="delete-button"
        onClick={deleteTodo}
      >
        x
      </button>
    </li>
  );
};

Todo.displayName = 'Todo';
