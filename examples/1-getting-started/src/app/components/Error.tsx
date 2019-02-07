import React, { FC } from 'react';

export const Error: FC = props => (
  <>
    <h4>Error</h4>
    <p>Something went wrong</p>
    <p>Message: {props.children}</p>
  </>
);
