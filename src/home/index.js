import React from "react";
import Radium, { Style, StyleRoot } from "radium";
import { Header, Footer } from "formidable-landers";
import ReactGA from "react-ga";

// Child components
import Hero from "./components/hero";
import Introduction from "./components/introduction";

// Variables and Stylesheet
import settings from "../spectacle-variables";
import theme from "../spectacle-theme";
import basename from "../basename";

class App extends React.Component {
  componentDidMount() {
    // Add Google Analytics tracking here since react-router
    // isn’t being used in entry.js
    ReactGA.initialize("UA-43290258-1");
    ReactGA.set({page: basename});
    ReactGA.pageview(basename);
  }

  getHeaderStyles() {
    return {
      overrides: {
        background: "transparent",
        borderTop: `1em solid ${settings.text}`,
        borderRight: `1em solid ${settings.text}`,
        borderBottom: "0",
        borderLeft: `1em solid ${settings.text}`
      },
      linkStyles: {
        color: settings.orange,
        borderColor: settings.orange,
        ":hover": {
          color: settings.text,
          boxShadow: `inset 0 -0.2em ${settings.orange}`
        }
      }
    };
  }
  getCircleStyles() {
    return {
      base: {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",

        zIndex: "0"
      },
      small: {
        clipPath: "circle(75vmax at 0% 100%)",
        background: `linear-gradient(0deg, ${settings.orange}, transparent 2%)`
      },
      large: {
        clipPath: "circle(105vmax at 100% 100%)",
        background: `linear-gradient(0deg, ${settings.yellow}, ${settings.white} 5%)`
      }
    };
  }
  getFooterStyles() {
    return {
      overrides: {
        zIndex: "1",
        position: "relative",

        margin: "0",

        borderTop: "0",
        borderRight: `1em solid ${settings.text}`,
        borderBottom: `1em solid ${settings.text}`,
        borderLeft: `1em solid ${settings.text}`
      },
      linkStyles: {
        color: settings.text,
        borderColor: settings.red,
        ":hover": {
          color: settings.red,
          boxShadow: `inset 0 -0.2em ${settings.red}`
        }
      }
    };
  }

  getVideoStyles() {
    return {
      wrapper: {
        position: "relative",
        marginTop: "1em",
        paddingBottom: "56.25%", // 16:9 ratio
        paddingTop: "25px",
        height: "0px"
      },
      iframe: {
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%"
      }
    };
  }

  render() {
    // const circle = this.getCircleStyles();
  {/* this needs to be separated out into app and home index */}
    const headerStyles = this.getHeaderStyles();
    const footerStyles = this.getFooterStyles();
    const videoStyles = this.getVideoStyles();
    return (
      <StyleRoot>
        <Header
          styleOverrides={headerStyles.overrides}
          linkStyles={headerStyles.linkStyles}
        />
        <Hero />
        <Introduction />
      {/*link to source code*/}
      {/*link to issue submission*/}
        <p style={{margin: "3em 0 0 0", textAlign: "center"}}>
            <a className="Button" href="https://github.com/FormidableLabs/spectacle-boilerplate/">
              Get Started With Spectacle
            </a>
          </p>
        <div className="Docs">
          <h2 style={{margin: "0px"}}>Take a tour</h2>
        </div>
        <div className="Container">
          <div style={videoStyles.wrapper}>
            <iframe
              style={videoStyles.iframe}
              width="640"
              height="360"
              src="https://www.youtube-nocookie.com/embed/vvgtgnIhJ1g?rel=0&amp;showinfo=0"
              frameBorder="0"
              allowFullScreen
            >
            </iframe>
          </div>
          {/* add a features list here*/}
          {/* this example should get moved to docs
          <p style={{margin: "2em 0 0 0", textAlign: "center"}}>
                      <a className="Button" href="http://stack.formidable.com/spectacle/">
                        View a Live Example
                      </a>
                    </p>*/}
          <p style={{margin: "3em 0 0 0", textAlign: "center"}}>
            <a className="Button" href="https://github.com/FormidableLabs/spectacle-boilerplate/">
              Get Started With Spectacle
            </a>
          </p>
        {/*source code and support links again*/}
        </div>
        <Footer
          logoColor="black"
          background="transparent"
          styleOverrides={footerStyles.overrides}
          linkStyles={footerStyles.linkStyles}
        />
        {/*<div style={[circle.base, circle.large]}></div>
        <div style={[circle.base, circle.small]}></div>*/}
        <Style rules={theme} />
      </StyleRoot>
    );
  }
}

export default Radium(App);
