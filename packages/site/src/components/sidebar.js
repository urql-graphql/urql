import React, { Fragment, useMemo } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
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

import logoSidebar from '../assets/sidebar-badge.svg';

const HeroLogo = styled.img.attrs(() => ({
  src: logoSidebar,
  alt: 'urql',
}))`
  display: none;
  width: ${p => p.theme.layout.logo};
  margin-bottom: ${p => p.theme.spacing.sm};
  align-self: center;

  @media ${p => p.theme.media.sm} {
    display: block;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: ${p => p.theme.spacing.xs};
  padding-bottom: ${p => p.theme.spacing.lg};
  padding-left: ${p => p.theme.spacing.sm};
`;

const relative = (from, to) => {
  if (!from || !to) return null;
  let pathname = path.relative(path.dirname(from), to);
  if (from.endsWith('/')) pathname = '../' + pathname;
  return { pathname };
};

const Sidebar = ({ sidebarOpen }) => {
  const { pathname } = useLocation();
  const currentPage = useMarkdownPage();
  const tree = useMarkdownTree();

  const sidebarItems = useMemo(() => {
    if (!currentPage || !tree || !tree.children) {
      return null;
    }

    let children = tree.children;
    if (tree.frontmatter && tree.originalPath) {
      children = [
        { ...tree, children: undefined },
        ...children
      ];
    }

    return children.map(page => {
      return (
        <Fragment key={page.key}>
          <SidebarNavItem to={relative(pathname, page.path)}>
            {page.frontmatter.title}
          </SidebarNavItem>

          {page.children && page.children.length ? (
            <SidebarNavSubItemWrapper>
              {page.children.map(childPage => (
                <SidebarNavSubItem
                  to={relative(pathname, childPage.path)}
                  key={childPage.key}
                >
                  {childPage.frontmatter.title}
                </SidebarNavSubItem>
              ))}
            </SidebarNavSubItemWrapper>
          ) : null}
        </Fragment>
      );
    });
  }, [currentPage, tree, pathname]);

  return (
    <SidebarContainer hidden={!sidebarOpen}>
      <SideBarStripes />
      <SidebarWrapper>
        <HeroLogo />
        <ContentWrapper>{sidebarItems}</ContentWrapper>
      </SidebarWrapper>
    </SidebarContainer>
  );
};

export default Sidebar;
