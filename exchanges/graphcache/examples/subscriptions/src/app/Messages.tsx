import React, { FC } from 'react';
import gql from 'graphql-tag';
import { useSubscription, useQuery } from 'urql';
import { Error, Message } from './components';

export const Messages: FC = () => {
  const [{ data: result, fetching, error }] = useQuery({
    query: messagesQuery,
  });

  const [res] = useSubscription({ query: NewMessageSubQuery });

  if (res.error !== undefined || error) {
    return <Error>{(error && error.message) || res.error.message}</Error>;
  }

  if (fetching || result.messages.length === 0) {
    return <p>LOADING</p>;
  }

  return (
    <ul>
      {result.messages.map(notif => (
        <Message key={notif.id} {...notif} />
      ))}
    </ul>
  );
};

Messages.displayName = 'Messages';

const messagesQuery = gql`
  query {
    messages {
      id
      message
    }
  }
`;

const NewMessageSubQuery = gql`
  subscription messageSub {
    newMessage {
      id
      from
      message
    }
  }
`;
