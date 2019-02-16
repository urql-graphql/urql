import React, { FC } from 'react';
import gql from 'graphql-tag';
import { useSubscription } from 'urql';
import { Error, MessageEntry, Message, MessageResponse } from './components';

export const Messages: FC = () => {
  const handleSubscription = (
    messages: MessageEntry[] = [],
    response: MessageResponse
  ) => [response.newMessages, ...messages];

  const [subscription] = useSubscription(
    { query: NewMessageSubQuery },
    handleSubscription
  );

  if (subscription.error !== undefined) {
    return <Error>{subscription.error.message}</Error>;
  }

  if (subscription.data === undefined) {
    return <p>No new messages</p>;
  }

  return (
    <ul>
      {subscription.data.map(notif => (
        <Message key={notif.id} {...notif} />
      ))}
    </ul>
  );
};

const NewMessageSubQuery = gql`
  subscription messageSub {
    newMessages {
      id
      from
      message
    }
  }
`;
