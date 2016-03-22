import React from "react";
import Radium from "radium";
// Variables
import settings from "../spectacle-variables";

class Introduction extends React.Component {
  getStyles() {
    return {
      wrapper: {
        position: "relative",

        zIndex: "1",
        margin: "0",
        padding: "1em 1em 3em",
        width: "100%",

        borderTop: "0",
        borderRight: `1em solid ${settings.text}`,
        borderLeft: `1em solid ${settings.text}`,

        [settings.mediaQueries.medium]: {
          padding: "1em 0 3em"
        }
      },
      banner: {
        zIndex: "2",

        marginTop: "-100px",
        marginLeft: "auto",
        marginRight: "1em",
        padding: "1.5rem 2.5rem",
        boxShadow: `1em 1em 0 ${settings.text}`,

        backgroundColor: settings.brown,
        [settings.mediaQueries.medium]: {
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: "75vw"
        }
      },
      copy: {
        margin: 0,

        color: settings.caramel,
        fontSize: "1.5rem",
        fontFamily: settings.sansSerif,
        fontWeight: "bold"
      },
      smallCaps: {
        fontSize: "0.8em",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      },
      strong: {
        color: settings.yellow,
        textShadow: `0.1em 0.1em 0.1em ${settings.orange}, 0.15em 0.15em 0.1em ${settings.red}`
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.wrapper}>
        <div style={styles.banner}>
          <p style={styles.copy}>
            A <strong style={styles.strong}>React.js based</strong> library for creating <strong style={styles.strong}>
              sleek presentations
            </strong> using <span style={styles.smallCaps}>JSX</span> syntax
            (with the ability to <strong style={styles.strong}>live demo your&nbsp;code!</strong>)
          </p>
        </div>
      </div>
    );
  }
}

export default Radium(Introduction);
