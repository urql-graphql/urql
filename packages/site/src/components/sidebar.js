import React, { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as path from 'path';

import { useMarkdownTree, useMarkdownPage } from 'react-static-plugin-md-pages';

import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarNavSubItemWrapper,
  SidebarContainer,
  SidebarWrapper,
  SideBarStripes,
} from './navigation';

import closeButton from '../assets/close.svg';
import logoSidebar from '../assets/sidebar-badge.svg';

const HeroLogo = styled.img.attrs(() => ({
  src: logoSidebar,
  alt: 'urql',
}))`
  width: ${p => p.theme.layout.logo};
  margin-bottom: ${p => p.theme.spacing.sm};
  align-self: center;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${p => p.theme.spacing.xs} 0;
`;

const CloseButton = styled.img.attrs(() => ({
  src: closeButton
}))`
  cursor: pointer;
  top: 1rem;
  right: 7rem;
  position: absolute;
  display: none;
`;

const relative = (from, to) => {
  if (!from || !to) return null;
  const pathname = path.relative(path.dirname(from), to);
  return { pathname };
};

const Sidebar = () => {
  const currentPage = useMarkdownPage();
  const tree = useMarkdownTree();

  const sidebarItems = useMemo(() => {
    if (!currentPage || !tree || !tree.children) {
      return null;
    }

    return tree.children.map(page => {
      return (
        <Fragment key={page.key}>
          <SidebarNavItem to={relative(currentPage.path, page.path)}>
            {page.frontmatter.title}
          </SidebarNavItem>

          {page.children && (
            <SidebarNavSubItemWrapper>
              {page.children.map(childPage => (
                <SidebarNavSubItem
                  to={relative(currentPage.path, childPage.path)}
                  key={childPage.key}
                >
                  {childPage.frontmatter.title}
                </SidebarNavSubItem>
              ))}
            </SidebarNavSubItemWrapper>
          )}
        </Fragment>
      );
    });
  }, [tree, currentPage]);

  return (
    <SidebarContainer>
      <SideBarStripes />
      <SidebarWrapper>
        <CloseButton />
        <HeroLogo />
        <ContentWrapper>
          {sidebarItems}
        </ContentWrapper>
      </SidebarWrapper>
    </SidebarContainer>
  );
};

export default Sidebar;
