import React, { FC, useState } from 'react';
import { useSubscription } from 'urql';
import { Error, NotificationResponse, Notification } from './components';

export const Home: FC = () => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const handleSubscription = (notification: NotificationResponse) =>
    setNotifications([...notifications, notification]);

  const [subscription] = useSubscription<NotificationResponse>(
    { query: NotificationSubQuery },
    handleSubscription
  );

  if (subscription.error) {
    return <Error>{subscription.error.message}</Error>;
  }

  return notifications.map(notif => <Notification key={notif.id} {...notif} />);
};

const NotificationSubQuery = `
subscription neNotifications {
  newNotification {
    id
    message
  }
}
`;
