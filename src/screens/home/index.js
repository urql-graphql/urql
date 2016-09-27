import React from "react";
import Radium from "radium";
import ReactGA from "react-ga";

// Child components
import Hero from "./components/hero";
import Introduction from "./components/introduction";
import TitleMeta from "../../components/title-meta";

// Variables and Stylesheet
import basename from "../../basename";
import { Link } from "react-router";
const RadiumLink = Radium(Link);

class Home extends React.Component {
  componentDidMount() {
    // Add Google Analytics tracking here since react-router
    // isn’t being used in entry.js
    ReactGA.initialize("UA-43290258-1");
    ReactGA.set({page: basename});
    ReactGA.pageview(basename);
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
    const videoStyles = this.getVideoStyles();
    return (
      <TitleMeta title="Spectacle">
        <Hero />
        <Introduction />
      {/*link to source code*/}
      {/*link to issue submission*/}
        <p style={{margin: "3em 0 0 0", textAlign: "center"}}>
          <RadiumLink className="Button" to="/docs">
            Get Started with Spectacle
          </RadiumLink>
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
            <RadiumLink className="Button" to="/docs">
              Get Started with Spectacle
            </RadiumLink>
          </p>
        {/*source code and support links again*/}
        </div>
      </TitleMeta>
    );
  }
}

export default Radium(Home);
