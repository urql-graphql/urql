import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { SidebarNavItem, SidebarNavSubItem } from "../../components/navigation";

const Container = styled.aside`
  background-color: #3d4247;
  min-height: 100vh;
  padding-top: 13rem;
  min-width: 6rem;
  width: 6rem;
  @media (min-width: 768px) {
    min-width: 26rem;
    width: 26rem;
  }
`;

class Sidebar extends React.Component {
  render() {
    const { sidebarContent } = this.props;
    return (
      <Container>
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

Sidebar.propTypes = { sidebarContent: PropTypes.array.isRequired };

export default Sidebar;
