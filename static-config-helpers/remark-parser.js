const frontmatter = require("remark-frontmatter");
const yaml = require("js-yaml");
const remark = require("remark");
const _ = require("lodash");
const select = require("unist-util-select");

// const fs = require("fs");
// const path = require("path");
// const reader = require("folder-reader");
// const html = require("remark-html");
// const visit = require("unist-util-visit");

const subHeadingRangeDefaults = {
  start: 1,
  end: 3
};

function setYamlToFile(subHeadingRange = subHeadingRangeDefaults) {
  function transformer(ast, file) {
    const yamlObj = select(ast, "yaml");
    let obj;
    if (yamlObj.length > 0) {
      const { children } = ast;

      obj = yaml.safeLoad(yamlObj[0].value);

      file.data = obj;
      file.data.ast = ast;
      file.data.raw = file.contents;
      // yeah, yeah, should be a single pass reduce, but the runtime cost is trivial.
      file.data.subHeadings = children
        .filter(
          c =>
            c.type === "heading" &&
            c.depth >= subHeadingRange.start &&
            c.depth <= subHeadingRange.end
        )
        .map(c => ({
          type: c.type,
          value: c.children[0].value,
          depth: c.depth
        }));
    }
  }
  return transformer;
}

// We'd rather do the parsing in the data layer and the rendering in the rendering layer
// and give our views as few things to think about as possible.
async function addTocFrontmatterTransform(relDir, opts = {}) {
  const renderer = opts.renderer || remark();

  renderer.use(frontmatter, ["yaml", "toml"]).use(setYamlToFile).process()
}

module.exports = {
  addTocFrontmatterTransform
};
