import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useMarkdownPage } from 'react-static-plugin-md-pages';

export const ScrollToTop = () => {
  const inputRef = useRef(null);
  const location = useLocation();
  const md = useMarkdownPage();

  const hash =
    location.hash ||
    (location.pathname && location.pathname.match(/#[a-z|-]+/));

  useEffect(() => {
    if (hash && md) {
      inputRef.current.click();
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, md]);

  return <a href={hash} ref={inputRef} />;
};
