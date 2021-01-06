/* eslint-disable react-hooks/rules-of-hooks */

import React, { Fragment, useMemo, useState } from 'react';
import styled from 'styled-components';
import Fuse from 'fuse.js';
import { useBasepath } from 'react-static';
import { Link, useLocation } from 'react-router-dom';
import * as path from 'path';

import { useMarkdownPage, useMarkdownTree } from 'react-static-plugin-md-pages';

import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarNavSubItemWrapper,
  SidebarContainer,
  SidebarWrapper,
  SideBarStripes,
  ChevronItem,
} from './navigation';
import SidebarSearchInput from './sidebar-search-input';

import logoSidebar from '../assets/sidebar-badge.svg';

const HeroLogoLink = styled(Link)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-bottom: ${p => p.theme.spacing.sm};
  align-self: center;
`;

const HeroLogo = styled.img.attrs(() => ({
  src: logoSidebar,
  alt: 'urql',
}))`
  display: none;
  width: ${p => p.theme.layout.logo};
  height: ${p => p.theme.layout.logo};

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

export const relative = (from, to) => {
  if (!from || !to) return null;
  let [toPath, hash] = to.split('#');
  let pathname = path.relative(path.dirname(from), toPath);
  if (!pathname)
    pathname = path.join(path.relative(from, toPath), path.basename(toPath));
  if (from.endsWith('/')) pathname = '../' + pathname + '/';
  if (!pathname.endsWith('/')) pathname += '/';
  if (hash) pathname += `#${hash}`;
  return { pathname };
};

export const SidebarStyling = ({ children, sidebarOpen, closeSidebar }) => {
  const basepath = useBasepath() || '';
  const homepage = basepath ? `/${basepath}/` : '/';

  return (
    <>
      <SideBarStripes />
      <SidebarContainer hidden={!sidebarOpen} onClick={closeSidebar}>
        <SidebarWrapper>
          <HeroLogoLink to={homepage}>
            <HeroLogo />
          </HeroLogoLink>
          <ContentWrapper>{children}</ContentWrapper>
        </SidebarWrapper>
      </SidebarContainer>
    </>
  );
};

const getMatchTree = (() => {
  const sortByRefIndex = (a, b) => a.refIndex - b.refIndex;

  const titleLocation = 'frontmatter.title';
  const options = {
    distance: 100,
    findAllMatches: true,
    includeMatches: true,
    keys: [titleLocation, `children.${titleLocation}`],
    threshold: 0.2,
  };

  return (children, pattern) => {
    const fuse = new Fuse(children, options);
    let matches = fuse.search(pattern);
    return matches
      .reduce((matches, match) => {
        // Add the top level heading but don't add subheadings unless they match
        const currentItem = {
          ...match.item,
          refIndex: match.refIndex,
          children: [],
        };
        // For every match, add the matching indices
        // For child matches, add the matching sorted children
        match.matches.forEach(individualMatch => {
          const isTopLevel = individualMatch.key === titleLocation;
          if (isTopLevel) {
            currentItem.matchedIndices = individualMatch.indices;
          } else {
            currentItem.children.push({
              ...match.item.children[individualMatch.refIndex],
              refIndex: individualMatch.refIndex,
              matchedIndices: individualMatch.indices,
            });
          }
        });
        if (currentItem.children.length) {
          currentItem.children.sort(sortByRefIndex);
        }
        return [...matches, currentItem];
      }, [])
      .sort(sortByRefIndex);
  };
})();

// Wrap matching substrings in <strong>
const highlightText = (text, indices) => (
  <>
    {indices.map(([startIndex, endIndex], i) => {
      const isLastIndex = !indices[i + 1];
      const prevEndIndex = indices[i - 1] ? indices[i - 1][1] : -1;

      return (
        <>
          {startIndex != 0 ? text.slice(prevEndIndex + 1, startIndex) : ''}
          <strong>{text.slice(startIndex, endIndex + 1)}</strong>
          {isLastIndex && endIndex < text.length
            ? text.slice(endIndex + 1, text.length)
            : ''}
        </>
      );
    })}
  </>
);

const Sidebar = props => {
  const [filterTerm, setFilterTerm] = useState('');
  const location = useLocation();
  const tree = useMarkdownTree();
  const page = useMarkdownPage();

  const sidebarItems = useMemo(() => {
    let pathname = location.pathname.match(/docs\/?(.+)?/);

    if (!pathname || !tree || !tree.children || !location) {
      return null;
    }
    pathname = pathname[0];
    const trimmedPathname = pathname.replace(/(\/$)|(\/#.+)/, '');

    let children = tree.children;
    if (tree.frontmatter && tree.originalPath) {
      children = [{ ...tree, children: undefined }, ...children];
    }

    if (filterTerm) {
      children = getMatchTree(children, filterTerm);
    }

    return children.map(page => {
      const pageChildren = page.children || [];

      const isActive = pageChildren.length
        ? trimmedPathname.startsWith(page.path)
        : !!page.path.match(new RegExp(`${trimmedPathname}$`, 'g'));

      const showSubItems = !!filterTerm || (pageChildren.length && isActive);

      return (
        <Fragment key={page.key}>
          <SidebarNavItem
            to={relative(pathname, page.path)}
            // If there is an active filter term in place, expand all headings
            isActive={() => isActive}
          >
            {page.matchedIndices
              ? highlightText(page.frontmatter.title, page.matchedIndices)
              : page.frontmatter.title}
            {pageChildren.length ? <ChevronItem /> : null}
          </SidebarNavItem>

          {showSubItems ? (
            <SidebarNavSubItemWrapper>
              {pageChildren.map(childPage => (
                <SidebarNavSubItem
                  isActive={() =>
                    !!childPage.path.match(
                      new RegExp(`${trimmedPathname}$`, 'g')
                    )
                  }
                  to={relative(pathname, childPage.path)}
                  key={childPage.key}
                >
                  {childPage.matchedIndices
                    ? highlightText(
                        childPage.frontmatter.title,
                        childPage.matchedIndices
                      )
                    : childPage.frontmatter.title}
                </SidebarNavSubItem>
              ))}
            </SidebarNavSubItemWrapper>
          ) : null}
        </Fragment>
      );
    });
  }, [location, tree, filterTerm]);

  return (
    <SidebarStyling {...props}>
      <SidebarSearchInput
        onHandleInputChange={e => setFilterTerm(e.target.value)}
        value={filterTerm}
      />
      {sidebarItems}
    </SidebarStyling>
  );
};

export default Sidebar;
