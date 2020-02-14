import styled from "styled-components";
import { Link } from "react-router-dom";
import collapsedSidebarBackground from "../static/svgs/collapsed-sidebar-background.svg";

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
  width: 24rem;
  min-width: 24rem;
  min-height: 100vh;

  @media (max-width: 768px) {
    min-width: 2.5rem;
    width: 2.5rem;
  }
`;

export const SideBarSvg = styled.div`
  width: 2.5rem;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3;
  background-image: url(${collapsedSidebarBackground});
  background-size: cover;
  background-repeat: repeat-y;
`;

export const SidebarWrapper = styled.aside`
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background-size: 100% 100%;
  background: linear-gradient(
      rgba(223, 223, 223, 0.4),
      rgba(223, 223, 223, 0.4)
    ),
    #ffffff;
  min-height: 100vh;
  padding-top: 18rem;
  min-width: 24rem;
  width: 24rem;
  z-index: 2;
  position: fixed;
  overflow-y: scroll;
  top: 0;
  bottom: 0;

  @media (max-width: 768px) {
    background: #dfdfdf;
    min-width: ${props => (props.overlay ? "24rem" : "2.5rem")};
    width: ${props => (props.overlay ? "24rem" : "2.5rem")};
    background-size: cover;
  }
`;

export const SidebarNavItem = styled(Link)`
  padding-left: 2rem;
  padding-right: 1rem;
  margin-bottom: 0.7rem;
  font-size: 1.6rem;
  display: inline-block;
  line-height: 1.64;
  letter-spacing: 0.5px;
  color: #4c5db0;
  text-transform: uppercase;
  font-weight: bold;
  width: 100%;

  &.active {
    background-color: rgba(46, 46, 46, 0.1);
  }
`;

export const SidebarNavSubItem = styled(Link)`
  color: white;
  margin-left: 4rem;
  margin-right: 1rem;
  margin-top: 0.7rem;
  font-size: 1.4rem;
  line-height: 1.64;
  letter-spacing: normal;
  color: #505050;
  font-weight: bold;
`;
