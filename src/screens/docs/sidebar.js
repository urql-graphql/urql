import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { SidebarNavItem, SidebarNavSubItem } from "../../components/navigation";

const Container = styled.aside`
  background-color: #3d4247;
  min-height: 100vh;
  padding-top: 23rem;
  min-width: 6rem;
  font-family: "sharp";
  width: 6rem;
  @media (min-width: 768px) {
    min-width: 26rem;
    width: 26rem;
  }
`;

const HeroLogo = styled.img`
  max-width: 14.5rem;
  position: relative;
  @media (min-width: 768px) {
    left: -3rem;
    max-width: auto;
    min-width: 29rem;
    position: absolute;
    top: -4rem;
  }
`;

class Sidebar extends React.Component {
  render() {
    const { sidebarContent } = this.props;
    return (
      <Container>
        <HeroLogo
          src="../../static/svgs/docs_image.svg"
          alt="Formidable Logo"
        />
        {sidebarContent.map(menuItem => (
          <li key={menuItem.title}>
            <SidebarNavItem onClick={() => {}}>{menuItem.title}</SidebarNavItem>
            {menuItem.subContent.length > 0 &&
              menuItem.subContent.map(subTitle => (
                <SidebarNavSubItem key={subTitle} href="#">
                  {subTitle}
                </SidebarNavSubItem>
              ))}
          </li>
        ))}
      </Container>
    );
  }
}

Sidebar.propTypes = {
  sidebarContent: PropTypes.array
};

export default Sidebar;
