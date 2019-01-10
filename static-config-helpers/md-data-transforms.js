/* eslint-disable func-style */
// we can switch to single-function lodash deps like the cool kids once we've got feature parity,
// keeping in mind this is naught but the build step.
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const getMdFiles = require("./get-md-files");
const generateRenderReadyMd = require("./md-toc-parser").default;

const sidebarTitleSlugMutation = (mdData, mdPath) => {
  const { name } = path.parse(mdPath);

  mdData.slug = name.toLowerCase();
  mdData.path = `/${name.toLowerCase()}/`;
  const spacedCappedName = name
    .split("-")
    .map(n => _.upperFirst(n))
    .join(" ");

  mdData.title = spacedCappedName;

  if (spacedCappedName.includes("api")) {
    mdData.title = spacedCappedName.replace(/(api)/, v => v.toUpperCase());
  }
};

const renderedMarkdownMutation = (mdData, mdPath) => {
  const { name } = path.parse(mdPath);
  mdData.renderedMd = generateRenderReadyMd({
    markdown: mdData.content,
    path: `/${name}/`
  }).toString();
};


const sidebarSort = items => _.orderBy(items, ["data.order"], "asc");

function getSidebarItems(
  mdPath = "content/docs/",
  items = [],
  mutations = [sidebarTitleSlugMutation, renderedMarkdownMutation],
  sort = sidebarSort
) {
  return getMdFiles(mdPath, items, mutations, sort);
}

module.exports = {
  getSidebarItems
};
