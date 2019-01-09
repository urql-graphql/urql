const fs = require("fs");
const klaw = require("klaw");
const path = require("path");
const matter = require("gray-matter");

// Note that this function is *extremely similiar* (but not identical) to the get-md-files found in the formidable.com
// repo, which is a concern. I have advised before and would say so again here that part of the problem
// is the way that the problem space itself is being conceptualized. 90% of our problems are about data, and these
// can be solved in a fairly generalized, portable, but fully extensible way as *data problems.*

// If we instead solve them as a series of unique specific mixed-concerns problems with only incidental similarity, or even
// worse, as something which can be generalized later at some unspecified point, we're introducing a likely possibility
// of exponentially increased costs due to code drift.

const getMdFiles = (mdPath, items, mutations = [], sort = items => items) =>
  new Promise(resolve => {
    if (fs.existsSync(mdPath)) {
      klaw(mdPath)
        .on("data", item => {
          if (path.extname(item.path) === ".md") {
            const data = fs.readFileSync(item.path, "utf8");
            const mdData = matter(data);

            mutations.forEach(m => {
              m(mdData, item.path);
            });

            items.push(mdData);
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
