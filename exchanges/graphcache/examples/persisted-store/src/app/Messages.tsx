import React, { useEffect } from 'react';
import { useQuery } from 'urql';

const Messages = ({ requestPolicy, updatedAt }) => {
  console.log(
    `<Messages requestPolicy=${requestPolicy} updatedAt=${updatedAt} />`
  );

  const [result, reexecuteQuery] = useQuery({
    query: `query { messages { id from message } }`,
    requestPolicy: requestPolicy,
  });

  useEffect(reexecuteQuery, [updatedAt]);

  console.log('Query result', result);

  const { data, fetching, error } = result;
  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return <pre>{JSON.stringify(data, null, ' ')}</pre>;
};

export default Messages;
