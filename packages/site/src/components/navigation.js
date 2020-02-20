import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Navigation = styled.div`
  align-items: center;
  background: #8196ff;
  display: flex;
  flex-direction: row;
  height: 6rem;
  width: 100%;

  & img {
    margin-left: auto;
    @media (min-width: 768px) {
      margin-left: 0;
    }
  }
`;

export const SidebarContainer = styled.div`
  width: ${p => p.theme.layout.sidebar};
`;

export const SideBarSvg = styled.div`
  border-left: ${p => p.theme.layout.stripes} solid #8196ff;
  border-right: ${p => p.theme.layout.stripes} solid #bcc6fa;
  height: 100%;
  width: 0;
  position: fixed;
  left: 0;
  top: 0;
`;

export const SidebarWrapper = styled.aside`
  position: fixed;
  display: flex;
  flex-direction: column;
  z-index: 1;

  overflow-y: scroll;
  min-height: 100%;
  width: ${p => p.theme.layout.sidebar};

  padding: ${p => p.theme.spacing.md};
  padding-right: ${p => p.theme.spacing.sm};

  background: ${p => p.theme.colors.bg};
  border-right: 1px solid ${p => p.theme.colors.border};

  line-height: ${p => p.theme.lineHeights.body};
  font-size: ${p => p.theme.fontSizes.small};
`;

export const SidebarNavItem = styled(Link)`
  display: block;
  margin-bottom: ${p => p.theme.spacing.xs};
  color: ${p => p.theme.colors.accent};
  text-decoration: none;
  font-weight: bold;
  width: 100%;
`;

export const SidebarNavSubItemWrapper = styled.div`
  padding-left: ${p => p.theme.spacing.sm};
  margin-bottom: ${p => p.theme.spacing.sm};
  border-left: 1px solid ${p => p.theme.colors.border};
`;

export const SidebarNavSubItem = styled(Link)`
  display: block;
  margin-top: ${p => p.theme.spacing.xs};
  color: ${p => p.theme.colors.heading};
  text-decoration: none;
  opacity: 0.7;
`;
