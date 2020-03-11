import React, { useState } from 'react';
import styled from 'styled-components';

import Article, { ArticleStyling } from './article';
import Header from './header';
import Sidebar, { SidebarStyling } from '../../components/sidebar';

import burger from '../../assets/burger.svg';
import closeButton from '../../assets/close.svg';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;

  width: 100%;
  max-width: ${p => p.theme.layout.page};
  margin: 0 auto;
  margin-top: ${p => p.theme.layout.header};
`;

const OpenCloseSidebar = styled.img.attrs(props => ({
  src: props.sidebarOpen ? closeButton : burger,
}))`
  cursor: pointer;
  display: block;
  margin: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1;

  @media ${p => p.theme.media.sm} {
    display: none;
  }
`;

const Docs = ({ isLoading, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header />
      <Container>
        <OpenCloseSidebar
          sidebarOpen={sidebarOpen}
          onClick={() => setSidebarOpen(prev => !prev)}
        />
        {/* load just the styles if Suspense fallback in use */}
        {isLoading ? (
          <>
            <SidebarStyling sidebarOpen={sidebarOpen} />
            <ArticleStyling>{children}</ArticleStyling>
          </>
        ) : (
          <>
            <Sidebar sidebarOpen={sidebarOpen} />
            <Article>{children}</Article>
          </>
        )}
      </Container>
    </>
  );
};

export default Docs;
