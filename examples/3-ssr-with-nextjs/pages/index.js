import React from 'react';
import Submit from '../components/Submit';
import PostList from '../components/PostList';
import withUrqlClient from '../src/with-urql-client';

const Root = () => (
  <React.Fragment>
    <Submit />
    <PostList />
  </React.Fragment>
);

export default withUrqlClient(Root);
