import React from 'react';

type TodoFormProps = {
  addTodo: (text: object) => void;
};

class TodoForm extends React.Component<TodoFormProps> {
  input: HTMLInputElement;
  addTodo = () => {
    this.props.addTodo({ text: this.input.value });
    this.input.value = '';
  };
  render() {
    return (
      <div>
        <input
          type="text"
          ref={i => {
            this.input = i;
          }}
        />
        <button type="button" onClick={this.addTodo}>
          Add Todo
        </button>
      </div>
    );
  }
}

export default TodoForm;
