/* eslint-disable react-hooks/rules-of-hooks */

import React, { Fragment, useMemo, useState } from 'react';
import styled from 'styled-components';
import Fuse from 'fuse.js';
import { Link, useLocation } from 'react-router-dom';

import { useMarkdownTree } from 'react-static-plugin-md-pages';

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
  display: none;
  flex-direction: row;
  justify-content: center;
  margin-bottom: ${p => p.theme.spacing.sm};
  align-self: center;

  @media ${p => p.theme.media.sm} {
    display: flex;
  }
`;

const HeroLogo = styled.img.attrs(() => ({
  src: logoSidebar,
  alt: 'urql',
}))`
  width: ${p => p.theme.layout.logo};
  height: ${p => p.theme.layout.logo};
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: ${p => p.theme.spacing.lg};
`;

export const SidebarStyling = ({ children, sidebarOpen }) => (
  <>
    <SideBarStripes />
    <SidebarContainer hidden={!sidebarOpen}>
      <SidebarWrapper>
        <HeroLogoLink to="/">
          <HeroLogo />
        </HeroLogoLink>
        <ContentWrapper>{children}</ContentWrapper>
      </SidebarWrapper>
    </SidebarContainer>
  </>
);

const getMatchTree = (() => {
  const sortByRefIndex = (a, b) => a.refIndex - b.refIndex;

  const options = {
    distance: 100,
    findAllMatches: true,
    includeMatches: true,
    keys: [
      'frontmatter.title',
      `children.frontmatter.title`,
      'children.headings.value',
    ],
    threshold: 0.2,
  };

  return (children, pattern) => {
    // Filter any nested heading with a depth greater than 2
    const childrenMaxH3 = children.map(child => ({
      ...child,
      children:
        child.children &&
        child.children.map(child => ({
          ...child,
          headings: child.headings.filter(heading => heading.depth == 2),
        })),
    }));

    const fuse = new Fuse(childrenMaxH3, options);
    let matches = fuse.search(pattern);

    // For every matching section, include only matching headers
    return matches
      .reduce((matches, match) => {
        const matchesMap = new Map();
        match.matches.forEach(individualMatch => {
          matchesMap.set(individualMatch.value, {
            indices: individualMatch.indices,
          });
        });

        // Add the top level heading but don't add subheadings unless they match
        const currentItem = {
          ...match.item,
          matchedIndices: match.indices,
          refIndex: match.refIndex,
        };

        // For every child of the currently matched section, add all appplicable
        // H2 and H3 headers plus their indices
        if (currentItem.children) {
          currentItem.children = currentItem.children.reduce(
            (children, child) => {
              const newChild = { ...child };
              newChild.headings = newChild.headings.reduce(
                (headings, header) => {
                  const match = matchesMap.get(header.value);
                  if (match) {
                    headings.push({
                      ...header,
                      matchedIndices: match.indices,
                    });
                  }
                  return headings;
                },
                []
              );

              const match = matchesMap.get(newChild.frontmatter.title);
              if (match) {
                newChild.matchedIndices = match.indices;
              }

              if (match || newChild.headings.length > 0) {
                children.push(newChild);
              }
              return children;
            },
            []
          );
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

const Sidebar = ({ closeSidebar, ...props }) => {
  const [filterTerm, setFilterTerm] = useState('');
  const location = useLocation();
  const tree = useMarkdownTree();

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
            to={`/${page.path}/`}
            // If there is an active filter term in place, expand all headings
            isActive={() => isActive}
            onClick={closeSidebar}
          >
            {page.matchedIndices
              ? highlightText(page.frontmatter.title, page.matchedIndices)
              : page.frontmatter.title}
            {pageChildren.length ? <ChevronItem /> : null}
          </SidebarNavItem>

          {showSubItems ? (
            <SidebarNavSubItemWrapper>
              {pageChildren.map(childPage => (
                <Fragment key={childPage.key}>
                  <SidebarNavSubItem
                    isActive={() =>
                      !!childPage.path.match(
                        new RegExp(`${trimmedPathname}$`, 'g')
                      )
                    }
                    to={`/${childPage.path}/`}
                  >
                    {childPage.matchedIndices
                      ? highlightText(
                          childPage.frontmatter.title,
                          childPage.matchedIndices
                        )
                      : childPage.frontmatter.title}
                  </SidebarNavSubItem>
                  {/* Only Show H3 items if there is a search applied */}
                  {filterTerm
                    ? childPage.headings.map(heading => (
                        <SidebarNavSubItem
                          to={`/${childPage.path}/#${heading.slug}`}
                          key={heading.value}
                          nested={true}
                        >
                          {highlightText(heading.value, heading.matchedIndices)}
                        </SidebarNavSubItem>
                      ))
                    : null}
                </Fragment>
              ))}
            </SidebarNavSubItemWrapper>
          ) : null}
        </Fragment>
      );
    });
  }, [location, tree, filterTerm, closeSidebar]);

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
