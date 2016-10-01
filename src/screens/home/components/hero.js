import React from "react";
import Radium from "radium";

class Hero extends React.Component {
  render() {
    return (
      <div className="Hero">
        <h2 className="Hero-Heading u-noMargin">
          A <strong>React.js based</strong> library for creating <strong>
            sleek presentations
          </strong> using <span>JSX</span> syntax
          (with the ability to <strong>live demo your&nbsp;code!</strong>)
        </h2>
      </div>
    );
  }
}

export default Radium(Hero);
