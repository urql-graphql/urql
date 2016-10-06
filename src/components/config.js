//
// Import markdown files from /docs folder in the repo
//

import GettingStarted from "spectacle/docs/getting-started.md";
import BasicConcepts from "spectacle/docs/basic-concepts.md";
import Api from "spectacle/docs/tag-api.md";
import Props from "spectacle/docs/props.md";
import Extensions from "spectacle/docs/extensions.md";

export const config = [
  {
    name: "Getting Started",
    slug: "getting-started",
    docs: GettingStarted
  }, {
    name: "Basic Concepts",
    slug: "basic-concepts",
    docs: BasicConcepts
  }, {
    name: "API",
    slug: "tag-api",
    docs: Api
  }, {
    name: "Props",
    slug: "props",
    docs: Props
  }, {
    name: "Extensions",
    slug: "extensions",
    docs: Extensions
  }
];
