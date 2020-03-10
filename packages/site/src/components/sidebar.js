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
  ChevronItem,
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
`;

const relative = (from, to) => {
  if (!from || !to) return null;
  let pathname = path.relative(path.dirname(from), to);
  if (!pathname)
    pathname = path.join(path.relative(from, to), path.basename(to));
  if (from.endsWith('/')) pathname = '../' + pathname;
  return { pathname };
};

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();
  const currentPage = useMarkdownPage();
  const tree = useMarkdownTree();

  const pathname = location.pathname.endsWith('/')
    ? currentPage.path + '/'
    : currentPage.path;

  const sidebarItems = useMemo(() => {
    if (!currentPage || !tree || !tree.children) {
      return null;
    }

    let children = tree.children;
    if (tree.frontmatter && tree.originalPath) {
      children = [{ ...tree, children: undefined }, ...children];
    }

    return children.map(page => {
      const pageChildren = page.children || [];

      const isActive = pageChildren.length
        ? currentPage.path.startsWith(page.path)
        : currentPage.path === page.path;

      return (
        <Fragment key={page.key}>
          <SidebarNavItem
            to={relative(pathname, page.path)}
            isActive={() => isActive}
          >
            {page.frontmatter.title}
            {pageChildren.length ? <ChevronItem /> : null}
          </SidebarNavItem>

          {pageChildren.length && isActive ? (
            <SidebarNavSubItemWrapper>
              {pageChildren.map(childPage => (
                <SidebarNavSubItem
                  isActive={() => childPage.path === currentPage.path}
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
    <>
      <SideBarStripes />
      <SidebarContainer hidden={!sidebarOpen}>
        <SidebarWrapper>
          <HeroLogo />
          <ContentWrapper>{sidebarItems}</ContentWrapper>
        </SidebarWrapper>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
