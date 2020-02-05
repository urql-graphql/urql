import React from 'react';
import { useQuery } from 'urql';

const Messages = () => {
  const [result] = useQuery({
    query: `query { messages { id from message } }`,
    requestPolicy: 'cache-only',
  });
  return <p>{JSON.stringify(result)}</p>;
};

export default Messages;
