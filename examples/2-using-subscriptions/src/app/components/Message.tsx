import React from 'react';

export interface MessageResponse {
  newMessages: MessageEntry;
}

export interface MessageEntry {
  id: number;
  from: string;
  message: string;
}

export const Message: React.SFC<MessageEntry> = props => (
  <div className="notif">
    <h4>{props.from}</h4>
    <li>{props.message}</li>
  </div>
);
