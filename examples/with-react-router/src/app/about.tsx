/* tslint:disable */

import * as React from 'react';
import { Connect, query, mutation, UrqlProps } from '../../../../src/index';
import TodoList from './todo-list';
import TodoForm from './todo-form';
import Loading from './loading';
import { Url } from 'url';

export interface IAboutTodoQuery {
  todo: Array<{ id: string; text: string }>;
}

const About: React.SFC<{}> = props => (
  <Connect
    query={query(AboutTodoQuery, { id: props.match.params.id })}
    children={({
      cache,
      loaded,
      data,
      addTodo,
      removeTodo,
      refetch,
    }: UrqlProps<IAboutTodoQuery>) => {
      if (loaded) {
        return (
          <div>
            <p>{data.todo.id}</p>
            <p>{data.todo.text}</p>
          </div>
        );
      } else {
        return <div>loading...</div>;
      }
    }}
  />
);

const AboutTodoQuery = `
query ($id : ID!) {
  todo(id: $id) {
    id
    text
  }
}
`;

export default About;
