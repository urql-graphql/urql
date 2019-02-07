import React from 'react';

export interface NotificationResponse {
  id: number;
  message: string;
}

export const Notification: React.SFC<NotificationResponse> = props => (
  <li>{props.message}</li>
);
