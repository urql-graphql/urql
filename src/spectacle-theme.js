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
    backgroundColor: settings.brown,
    textSizeAdjust: "100%",
    fontSize: "14px"
  },
  body: {
    margin: "0px",
    boxSizing: "border-box",
    position: "relative",
    backgroundColor: settings.yellow,
    background: `linear-gradient(180deg, ${settings.yellow}, ${settings.white} 120vh)`,
    fontFamily: settings.serif,
    fontWeight: "300",
    lineHeight: 1.625,
    color: settings.text
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
    border: "0px",
    margin: "0px",
    padding: "0px",
    fontSize: "100%"
  },
  thead: {
    font: "inherit",
    verticalAlign: "baseline"
  },
  tbody: {
    verticalAlign: "middle"
  },
  tr: {
    border: `1px solid ${settings.brownTint}`
  },
  "th, td": {
    color: settings.text,
    fontFamily: settings.sansSerif,
    padding: "0.425em 0.75em",
    verticalAlign: "top"
  },
  "th code, td code": {
    background: "none",
    color: "#111"
  },
  th: {
    color: settings.text,
    borderBottom: `3px solid ${settings.brownTint}`,
    fontWeight: 700,
    textAlign: "left"
  },
  "tr:nth-child(odd) td": {
    backgroundColor: settings.lightCodeBg
  },
  "h1,h2,h3,h4,h5,h6,hgroup, ul,ol,dd, p,figure, pre,table,fieldset,hr, .highlight": {
    marginTop: "1.25em",
    marginBottom: "0"
  },
  img: {
    maxWidth: "100%"
  },
  "svg, img": {
    fill: "currentColor"
  },
  h1: {
    fontSize: "2.125rem",
    fontWeight: 800
  },
  h2: {
    fontSize: "2rem",
    fontWeight: 800
  },
  h3: {
    fontFamily: settings.sansSerif,
    fontSize: "1.5rem",
    fontWeight: 700
  },
  "h1, h2": {
    color: settings.text,
    fontFamily: settings.sansSerif,
    lineHeight: 1.75,
    textShadow: `0.03em 0.03em 0 ${settings.yellow}`,
    borderBottom: `1px solid ${settings.codeBg}`
  },
  "h4, h5, h6": {
    color: settings.text,
    fontFamily: settings.sansSerif,
    fontSize: "1.25rem",
    lineHeight: 1.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  "strong": {
    fontWeight: 700
  },
  "em": {
    fontStyle: "italic"
  },
  "ol": {
    padding: "0 0 0 1.5em"
  },
  "li": {
    margin: "0",
    padding: "0"
  },
  "ul": {
    padding: "0 0 0 1.5em",
    listStyle: "none"
  },
  "ul > li": {
    position: "relative",
    listStyle: "none"
  },
  "ul > li + li": {
    marginTop: "0.25em"
  },
  "ul > li:before": {
    content: "''",
    width: "1em",
    height: "1em",
    display: "block",
    position: "absolute",
    fontSize: "8px",
    borderRadius: "50%",
    border: "1px solid rgba(41, 28, 13, 0.5)",
    left: "-24px",
    top: "11px"
  },
  "li > ul": {
    marginTop: "0px",
    marginBottom: "0.25em"
  },
  /*
   * Headlines/Headings
   */
  ".Headline": {
    color: settings.text,
    textShadow: `0.1em 0.25em 0 ${settings.yellow}`,
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
    color: settings.text
  },
  /*
   * Links
   */
  "a": {
    color: settings.orange,
    fontWeight: "500",
    textDecoration: "none",
    backgroundColor: "transparent",
    borderBottom: `1px solid ${settings.gold}`,
    transition: "border 0.5s, box-shadow 0.5s, color 2s"
  },
  "a:visited": {
    color: settings.red,
    borderBottomColor: settings.orange,
    transition: "border 0.5s, box-shadow 0.5s, color 2s"
  },
  "a:hover, a:focus": {
    color: settings.red,
    boxShadow: `inset 0 -0.2em ${settings.yellow}`,
    borderBottom: `1px solid ${settings.yellow}`,
    transition: "border 0.5s, box-shadow 0.5s, color 2s"
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
    backgroundColor: settings.brandRed,
    border: "none",
    boxShadow: "none",
    color: settings.white,
    display: "inline-block",
    fontFamily: settings.sansSerif,
    fontWeight: "bold",
    padding: "1em 1.5em",
    textAlign: "center",
    transition: "all 2s ease"
  },
  ".Button:visited": {
    backgroundColor: settings.brown,
    border: "none",
    boxShadow: "none",
    color: settings.white,
    outline: "none",
    transition: "all 0.7s ease"
  },
  ".Button:hover, .Button:focus": {
    backgroundColor: settings.orange,
    border: "none",
    boxShadow: "none",
    color: settings.white,
    outline: "none",
    transition: "all 0.7s ease"
  },
  /*
   * Layout
   */
  ".Container": {
    paddingLeft: "0",
    paddingRight: "0"
  },
  /*
   * Ecology
   */
  "#spectacle": {
    display: "none" // hide second title
  },
  ".Docs p, .Docs h1, .Docs h2, .Docs h3, .Docs h4, .Docs h5, .Docs h6, .Docs pre, .Docs table": {
    paddingLeft: "0%",
    paddingRight: "0%"
  },
  ".Docs p": {
    fontSize: "1rem"
  },
  ".Docs .highlight": {
    marginLeft: "-16px",
    marginRight: "-16px"
  },
  ".Docs .highlight pre": {
    marginTop: "0px",
    background: settings.yellow,
    color: "#fff",
    fontFamily: settings.monospace,
    fontSize: "1em",
    lineHeight: 1.2,
    overflow: "auto",
    padding: "1em"
  },
  ".Docs code, .Focus code, td code, th code": {
    background: settings.codeBg,
    border: `1px solid ${settings.codeBg}`,
    color: settings.text,
    fontFamily: settings.monospace,
    fontSize: "0.925em",
    borderRadius: "3px",
    padding: "0 5px",
    display: "inline-block"
  },
  ".highlight code": {
    background: "transparent",
    padding: "0px"
  },
  /*
   * Ecology text wrangling
   */
  ".Docs pre": {
    background: settings.whiteCodeBg,
    padding: "1em 0.5em",
    overflowX: "scroll" // bring back scrollbars for readme.md
  },
  ".Docs pre code": {
    border: "none",
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
    border: `1px solid ${settings.codeBg}`
  },
  ".Interactive .playgroundPreview": {
    flex: "0 0 100%",
    verticalAlign: "top",
    background: "#fff",
    position: "relative",
    border: `1px solid ${settings.codeBg}`
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
    color: settings.red,
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
    color: settings.red,
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
    marginTop: "0px"
  },
  mediaQueries: {
    [settings.mediaSizes.medium]: { //medium
      html: {
        fontSize: "16px"
      },
      h1: {
        fontSize: "2.5rem"
      },
      h2: {
        fontSize: "2.125rem"
      },
      h3: {
        fontSize: "1.75rem"
      },
      "h4, h5, h6": {
        fontSize: "1.25rem"
      },
      ".Docs p, .Docs h1, .Docs h2, .Docs h3, .Docs h4, .Docs h5, .Docs h6, .Docs pre, .Docs ul, .Container": {
        paddingLeft: "5%",
        paddingRight: "5%"
      },
      ".Docs li > ul": {
        paddingLeft: "1.5em"
      },
      ".Docs table": {
        paddingLeft: "5%"
      }
    },
    [settings.mediaSizes.large]: {
      html: {
        fontSize: "18px"
      },
      ".Docs p, .Docs h1, .Docs h2, .Docs h3, .Docs h4, .Docs h5, .Docs h6, .Docs pre, .Docs ul, .Container": {
        paddingLeft: "20%",
        paddingRight: "20%"
      },
      ".Docs li > ul": {
        paddingLeft: "1.5em"
      },
      ".Docs table": {
        paddingLeft: "20%",
        paddingRight: "10%"
      }
    },
    [settings.mediaSizes.xlarge]: { //xlarge
      h1: {
        fontSize: "3rem"
      },
      h2: {
        fontSize: "2.25rem"
      },
      ".Header": {
        paddingTop: "65px",
        paddingBottom: "0"
      },
      ".Docs p, .Docs ul": {
        fontSize: "1.125rem"
      },
      ".Docs p, .Docs h1, .Docs h2, .Docs h3, .Docs h4, .Docs h5, .Docs h6, .Docs pre, .Docs ul, .Container": {
        paddingLeft: "25%",
        paddingRight: "25%"
      },
      ".Docs table": {
        paddingLeft: "25%",
        paddingRight: "10%"
      },
      ".Docs li > ul": {
        paddingLeft: "1.5em"
      },
      ".Docs .highlight": {
        margin: "2em -1.3334em"
      },
      ".Docs .highlight pre": {
        padding: "1.3334em"
      },
      ".Interactive .playground": {
        display: "flex",
        flexWrap: "wrap"
      },
      ".Interactive .playgroundCode": {
        display: "flex",
        flex: "1",
        marginRight: "0.6667em",
        marginTop: "0px"
      },
      ".Interactive .playgroundPreview": {
        display: "flex",
        flex: "1",
        marginLeft: "0.6667em"
      }
    }
  }
};
