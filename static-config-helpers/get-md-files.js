const fs = require("fs");
const klaw = require("klaw");
const path = require("path");
const html = require("remark-html");
const frontmatter = require("remark-frontmatter");
const yaml = require("js-yaml");
const remark = require("remark");
const _ = require("lodash");
const select = require("unist-util-select");

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

      // When you need them, you really, really need them, but when you don't need them...
      Object.defineProperty(file, "raw", {
        value: file.contents,
        enumerable: false
      });

      Object.defineProperty(file, "ast", {
        value: ast,
        enumerable: false
      });

      // yeah, yeah, should be a single pass reduce, but the runtime cost is trivial.
      // The real concern is that a flat array isn't alw for describing this relationship, but
      // it is at least *semi-defensible* to leave that as an exercise for the view layer or to handle in a regular
      // transform -- tbh, this should also be in a regular transform via leveraging the children of the ast key
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

const baseConfig = {
  renderer: remark()
    .use(frontmatter, ["yaml", "toml"])
    .use(setYamlToFile)
    .use(html),
  // converting to an originally grey-matter idiom for all our existing transforms and future interop -- it's not much of a stretch
  // for remark, but who knows what the future (and the past) hold? The problem with insisting everyone put their eggs
  // in one non-configurable basket is that when people think your basket is shitty for their use case, they'd rather
  // switch to something else entirely than argue with the previous paradigm
  outputHarmonizer: result => ({ content: result.contents, data: result.data })
};

// Note that this function is *similar* (but not identical) to the get-md-files found in the formidable.com
// repo and the victory-docs react-static branch, which is a concern. I have advised before and would say so again here that part of the problem
// is the way that the problem space itself is being conceptualized. 90% of our problems are about data, and these
// can be solved in a fairly generalized, portable, but fully extensible way as *data problems.*

// If we instead solve them as a series of unique specific mixed-concerns problems with only incidental similarity, or even
// worse, as something which can be generalized later at some unspecified point, we're introducing a likely possibility
// of exponentially increased costs due to code drift and siloed tasks.

// And despite my prior protestations, I think it's worth it to leave this config object as seemingly unsightly default fifth(!) parameter,
// the intention here long term is for this to be a util and for the user to do whatever tf they want without having
// to break backwards compat -- having to implement a process method wrapper is a small price to pay for avoiding human contact.
const getMdFiles = async (
  mdPath,
  items,
  mutations = [],
  // terrible take, linter
  // eslint-disable-next-line no-shadow
  sort = items => items,
  config = baseConfig
) =>
  new Promise(resolve => {
    if (fs.existsSync(mdPath)) {
      klaw(mdPath)
        .on("data", item => {
          if (path.extname(item.path) === ".md") {
            const data = fs.readFileSync(item.path, "utf8");

            const { renderer, outputHarmonizer } = config;

            renderer.process(data, (err, result) => {
              // const data = results.data;

              const mdData = outputHarmonizer(result);

              mutations.forEach(m => {
                m(mdData, item.path);
              });

              items.push(mdData);
            });
          }
        })
        .on("error", e => {
          console.log(e);
        })
        .on("end", () => {
          // So initially my gut was telling me that sort order/field
          // is conventionally a purely view layer concern. But that also makes our components
          // smarter and more opinionated, and a little harder to predict output from input.
          // And since our data generation is decoupled from our consumption, sorting statically
          // here also makes it easier to work with our data outside of the view layer, since the view layer
          // isn't doing (much!) futzing around with sanitizing/decorating/transforming values,
          // reordering, or implementing useful business logic in a method we can't trivially
          // reuse in other places such as say, a customized CMS, a static config, or any other Node process.

          // That said, for things like defining a unique rendering format for date values, pagination, etc.
          // those seem like truly pure view layer concerns.
          resolve(sort(items));
        });
    } else {
      resolve(items);
    }
  });

module.exports = getMdFiles;
