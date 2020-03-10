import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useMarkdownPage } from 'react-static-plugin-md-pages';

import styled from 'styled-components';

const ScrollToHash = styled.a``;
export const ScrollToTop = () => {
  const { hash } = useLocation();

  let md;
  try {
    md = useMarkdownPage(); // eslint-disable-line react-hooks/rules-of-hooks
  } catch (_e) {}
  const inputRef = useRef(null);

  useEffect(() => {
    if (hash && md) {
      inputRef.current.click();
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, md]);

  return <ScrollToHash href={hash} ref={inputRef} />;
};
