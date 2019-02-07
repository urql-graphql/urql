import React, { FC } from 'react';
import { useSubscription } from 'urql';
import { Error, NotificationResponse, Notification } from './components';

export const Home: FC = () => {
  const handleSubscription = (
    notifications: NotificationResponse[],
    notification: NotificationResponse
  ) => [...notifications, notification];

  const [subscription] = useSubscription<
    NotificationResponse,
    NotificationResponse[]
  >({ query: NotificationSubQuery }, handleSubscription);

  if (subscription.error) {
    return <Error>{subscription.error.message}</Error>;
  }

  return subscription.data.map(notif => (
    <Notification key={notif.id} {...notif} />
  ));
};

const NotificationSubQuery = `
subscription newNotifications {
  notification {
    id
    message
  }
}
`;
