// -------------------------------
// BUILDER THEME
// -------------------------------
// Settings
import settings from "./spectacle-variables";

// Stylesheet
export default {
  /*
   * Normalize & Element Selectors
   */
  "*, *:before, *:after": {
    boxSizing: "inherit"
  },
  html: {
    textSizeAdjust: "100%",
    fontSize: "17px"
  },
  body: {
    backgroundColor: settings.white,
    background: settings.jet,
    fontFamily: settings.sansSerif,
    fontWeight: "300",
    lineHeight: 1.625,
    margin: 0,
    color: settings.darkerJet,
    boxSizing: "border-box"
  },
  "html, body": {
    overflowX: "hidden"
  },
  "article, aside, details, figcaption, figure, footer": {
    display: "block"
  },
  "header, hgroup, main, menu, nav, section, summary": {
    display: "block"
  },
  table: {
    borderCollapse: "collapse",
    display: "block",
    overflow: "auto",
    width: "100%"
  },
  "thead, tbody": {
    border: 0,
    margin: 0,
    padding: 0,
    fontSize: "100%"
  },
  thead: {
    font: "inherit",
    verticalAlign: "baseline"
  },
  tbody: {
    verticalAlign: "middle"
  },
  "th, td": {
    border: `1px solid ${settings.darkGray}`,
    padding: "0.425em 0.75em",
    verticalAlign: "top"
  },
  "th code, td code": {
    background: "none",
    color: "#111"
  },
  th: {
    fontWeight: "bold",
    textAlign: "left"
  },
  "h1,h2,h3,h4,h5,h6,hgroup, ul,ol,dd, p,figure, pre,table,fieldset,hr, .highlight": {
    marginTop: "1.5em",
    marginBottom: "0"
  },
  img: {
    maxWidth: "100%"
  },
  "svg, img": {
    fill: "currentColor"
  },
  h1: {
    fontSize: "2.125em",
    fontWeight: 200
  },
  h2: {
    fontSize: "2em",
    fontWeight: 200
  },
  h3: {
    fontSize: "1.875em",
    fontWeight: 300
  },
  "h4, h5, h6": {
    fontSize: "1em",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  "h1,h2,h3,h4": {
    fontFamily: settings.sansSerif,
    lineHeight: 1.3
  },
  "strong": {
    fontWeight: 500
  },
  "em": {
    fontStyle: "italic"
  },
  "ul": {
    padding: "0"
  },
  "ol": {
    padding: "0 0 0 1.5em"
  },
  "li": {
    margin: "0",
    padding: "0"
  },
  "ul > li": {
    listStyle: "none"
  },
  /*
   * Headlines/Headings
   */
  ".Headline": {
    color: settings.lighterJet,
    fontFamily: settings.sansSerif,
    fontSize: "2.125em",
    fontWeight: 200, // Light
    lineHeight: 1.3
  },
  ".Headline--minor": {
    fontSize: "2em",
    fontWeight: 300
  },
  ".Headline--major": {
    fontSize: "2.5em",
    fontWeight: 200, // Light
    lineHeight: 1.3,
    fontStyle: "italic"
  },
  ".Smallcaps": {
    textTransform: "uppercase",
    fontSize: "0.85em",
    fontWeight: "bold",
    color: settings.lightJet
  },
  /*
   * Links
   */
  "a": {
    paddingTop: "0.15em",
    color: settings.jet,
    fontWeight: "500",
    textDecoration: "none",
    backgroundColor: "transparent",
    borderBottom: `3px solid ${settings.gold}`,
    transition: "all 0.5s ease"
  },
  "a:hover, a:focus": {
    backgroundColor: settings.gold,
    borderBottom: `3px solid ${settings.gold}`,
    transition: "all 0.5s ease"
  },
  ".Link--unstyled": {
    borderBottom: "none"
  },
  ".Link--unstyled:hover, .Link--unstyled:focus": {
    borderBottom: "none"
  },
  /*
   * Buttons!
   */
  ".Button": {
    backgroundColor: "transparent",
    border: `3px solid ${settings.gray}`,
    boxShadow: "none",
    color: settings.jet,
    fontFamily: settings.sansSerif,
    fontWeight: "normal",
    padding: "0.75em 1.25em",
    textAlign: "center",
    transition: "color 0.2s ease, border-color 0.7s ease"
  },
  ".Button:hover, .Button:focus": {
    borderColor: settings.palestRed,
    boxShadow: "none",
    color: settings.red,
    outline: "none",
    transition: "color 0.2s ease, border-color 0.7s ease"
  },
  ".Button--spotlight": {
    backgroundColor: settings.jet,
    borderColor: settings.jet,
    color: settings.gray,
    fontSize: "1.25rem",
    transition: "color 0.2s ease, background-color 0.7s ease, border-color 0.7s ease"
  },
  ".Button--spotlight:hover, .Button--spotlight:focus": {
    backgroundColor: settings.red,
    borderColor: settings.red,
    color: "#ffffff",
    transition: "color 0.2s ease, background-color 0.7s ease, border-color 0.7s ease"
  },
  /*
   * Layout/Grid
   */
  ".Container": {
    margin: "0 auto",
    maxWidth: "960px",
    padding: "0 16px"
  },
  ".Row": {
    padding: "2rem 0"
  },
  ".Row .Interactive": {
    marginTop: "-1.3334rem"
  },
  /*
   * Copy
   */
  ".Copy": {
    margin: "0 auto",
    maxWidth: "720px",
    padding: "0",
    fontSmoothing: "antialiased",
    fontSize: "1rem"
  },
  ".Copy p, .Copy ul, .Ecology ul": {
    paddingRight: "0"
  },
  ".Tagline": {
    textAlign: "left"
  },
  ".Copy .highlight": {
    marginLeft: "-16px",
    marginRight: "-16px"
  },
  ".Copy .highlight pre": {
    marginTop: 0,
    background: settings.jet,
    color: "#fff",
    fontFamily: settings.monospace,
    fontSize: "1em",
    lineHeight: 1.2,
    overflow: "auto",
    padding: "1em"
  },
  ".Copy ul, .Ecology ul": {
    paddingLeft: "1.5em",
    listStyle: "none"
  },
  ".Copy ul > li, .Ecology ul > li": {
    position: "relative"
  },
  ".Copy ul > li + li, .Ecology ul > li + li": {
    marginTop: "0.25em"
  },
  ".Copy ul > li:before, .Ecology ul > li:before": {
    content: "''",
    width: "1em",
    height: "1em",
    display: "block",
    position: "absolute",
    fontSize: "8px",
    borderRadius: "50%",
    border: "1px solid rgba(48, 48, 48, 0.5)",
    left: "-24px",
    top: "11px"
  },
  ".Copy li > ul, .Ecology li > ul": {
    marginTop: 0,
    marginBottom: "0.25em"
  },
  ".Copy code, .Ecology code, .Focus code": {
    background: "rgba(135, 135, 135, 0.1)",
    color: settings.jet,
    fontFamily: settings.monospace,
    fontSize: "0.925em",
    borderRadius: "3px",
    padding: "0 5px",
    display: "inline-block"
  },
  ".highlight code": {
    background: "transparent",
    padding: 0
  },
  /*
   * Big Copy
   */
  ".Copy--Big": {
    fontSize: "1.3334em"
  },
  /*
   * Ecology text wrangling
   */
  ".Overview pre": {
    background: "rgba(135, 135, 135, 0.1)",
    padding: "0.25em 0.5em",
    overflowX: "scroll" // bring back scrollbars for readme.md
  },
  ".Overview pre code": {
    background: "none"
  },
  /*
   * Interactive/Component Playground
   */
  ".Interactive": {
    minHeight: "333px"
  },
  ".Interactive .playground": {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "1.3334em"
  },
  ".Interactive:before, .Interactive .playgroundPreview:before": {
    fontFamily: settings.sansSerif,
    fontWeight: "bold",
    fontSize: "1rem",
    lineHeight: 1,
    letterSpacing: "0.05em",
    textTransform: "uppercase"
  },
  ".Interactive:before": {
    content: "'Interactive Code'"
  },
  ".Interactive .playgroundCode": {
    flex: "0 0 100%",
    verticalAlign: "top",
    background: "#fff",
    fontFamily: settings.monospace,
    fontSize: "1rem",
    lineHeight: 1.2,
    marginTop: "1.66666em",
    padding: "0.88888em 0.88888em 0 0.88888em",
    border: "1px solid #ebe3db"
  },
  ".Interactive .playgroundPreview": {
    flex: "0 0 100%",
    verticalAlign: "top",
    background: "#fff",
    position: "relative",
    border: "1px solid #ebe3db"
  },
  ".Interactive .playgroundPreview:before": {
    content: "'Live Preview'",
    position: "absolute",
    top: "-18px"
  },
  ".Interactive pre, .CodeMirror-code": {
    fontFamily: settings.monospace,
    fontSize: "1rem",
    lineHeight: 1.2
  },
  ".CodeMirror": {
    height: "auto"
  },
  /*
   * Documentation/Props
   */
  ".Documentation h1, .Documentation h2, .Documentation h3": {
    fontFamily: settings.sansSerif,
    fontWeight: "normal"
  },
  ".Prop td:first-child": {
    maxWidth: "30em"
  },
  ".Prop-name": {
    fontFamily: settings.monospace
  },
  ".Prop-type": {
    color: settings.lightJet,
    display: "block",
    fontStyle: "italic",
    lineHeight: "1em"
  },
  ".Prop-description": {
    display: "block",
    lineHeight: "1.3em",
    marginTop: "0.5em"
  },
  ".Prop-examples, .Prop-default": {
    display: "block",
    lineHeight: "1.3em"
  },
  ".Prop-examples-title, .Prop-default-title": {
    textTransform: "uppercase",
    fontSize: "0.85em",
    fontWeight: "bold",
    color: settings.lightJet,
    letterSpacing: "0.04em"
  },
  ".Prop-examples-value": {
    fontFamily: settings.monospace
  },
  ".Prop-default-value": {
    fontFamily: settings.monospace,
    color: "#4d4945"
  },
  /* Utilities */
  ".u-textCenter": {
    textAlign: "center"
  },
  ".u-textLeft": {
    textAlign: "left"
  },
  ".u-textRight": {
    textAlign: "right"
  },
  ".u-marginModule > *:last-child": {
    marginTop: 0
  },
  mediaQueries: {
    "only screen and (min-width: 32em)": { //medium
      h1: {
        fontSize: "2.5em"
      },
      h2: {
        fontSize: "2.125em"
      },
      h3: {
        fontSize: "2em"
      },
      "h4, h5, h6": {
        fontSize: "1.1em"
      },
      ".Headline": {
        fontSize: "2.5em"
      },
      ".Headline--minor": {
        fontSize: "2.125em"
      },
      ".Headline--major": {
        fontSize: "2.75em"
      },
      ".Copy, .Tagline": {
        paddingLeft: "48px"
      },
      ".Copy p, .Copy ul, .Ecology ul": {
        paddingRight: "48px"
      }
    },
    "only screen and (min-width: 60em)": { //xlarge
      html: {
        fontSize: "18px"
      },
      h1: {
        fontSize: "3rem"
      },
      h2: {
        fontSize: "2.75rem"
      },
      h3: {
        fontSize: "2.125rem"
      },
      ".Headline": {
        fontSize: "2.75em"
      },
      ".Headline--major": {
        fontSize: "3.5rem",
        lineHeight: 1.2,
        fontStyle: "italic"
      },
      ".Header": {
        paddingTop: "65px",
        paddingBottom: "0"
      },
      ".Container": {
        maxWidth: "1260px",
        padding: "0 36px"
      },
      ".Copy, .Tagline": {
        padding: "0 0 0 60px"
      },
      ".Copy p, .Copy ul, .Ecology ul": {
        paddingRight: "60px"
      },
      ".Copy, .Ecology p": {
        fontSize: "1.125rem"
      },
      ".Copy--Big": {
        fontSize: "1.3334em"
      },
      ".Copy .highlight": {
        margin: "2em -1.3334em"
      },
      ".Copy .highlight pre": {
        padding: "1.3334em"
      },
      ".Tagline": {
        textAlign: "center"
      },
      ".Installer": {
        padding: "1.3334em 2.6667em", //24px 48px
        marginTop: "1.3334em",
        marginBottom: "1.3334em"
      },
      ".Interactive .playground": {
        display: "flex",
        flexWrap: "wrap"
      },
      ".Interactive .playgroundCode": {
        display: "flex",
        flex: "1",
        marginRight: "0.6667em",
        marginTop: 0
      },
      ".Interactive .playgroundPreview": {
        display: "flex",
        flex: "1",
        marginLeft: "0.6667em"
      }
    }
  }
};
