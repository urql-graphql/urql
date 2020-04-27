import React from 'react';
import styled from 'styled-components';
import { Link as ReactRouterLink } from 'react-router-dom';

import { buttonLinkStyling } from './button';

export const Link = styled(({ isExternal, ...rest }) =>
  isExternal ? (
    <a href={rest.to} {...rest}>
      {rest.children}
    </a>
  ) : (
    <ReactRouterLink {...rest} />
  )
)`
  ${buttonLinkStyling}
`;
