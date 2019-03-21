import styled from "styled-components";
import { Link } from "react-static";
import sidebarBackground from "../static/svgs/pink-sidebar-background.svg";
import collapsedSidebarBackground from "../static/svgs/collapsed-sidebar-background.svg";

const sidebarZIndex = 900;

export const Navigation = styled.div`
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
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
  width: 26rem;
  min-width: 26rem;
  min-height: 100vh;

  @media (max-width: 768px) {
    min-width: 5rem;
    width: 5rem;
  }
`;

export const SidebarWrapper = styled.aside`
  font-family: "akkurat";
  background-image: url(${sidebarBackground});
  background-repeat: repeat-y;
  min-height: 100vh;
  padding-top: 18rem;
  min-width: 20rem;
  width: 20rem;
  z-index: ${sidebarZIndex};
  position: fixed;
  overflow-y: scroll;
  top: 0;
  bottom: 0;
  width: 20rem;

  @media (max-width: 768px) {
    background-image: ${props =>
      props.overlay
        ? `url(${sidebarBackground})`
        : `url(${collapsedSidebarBackground})`};
    min-width: ${props => (props.overlay ? "26rem" : "5rem")};
    width: ${props => (props.overlay ? "26rem" : "5rem")};
  }
`;

export const SidebarNavItem = styled(Link)`
  color: white;
  margin-left: 4rem;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  display: inline-block;
`;

export const SidebarNavSubItem = styled(Link)`
  color: white;
  margin-left: 6rem;
  margin-top: 1rem;
  font-size: 1.4rem;
`;
