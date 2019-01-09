const remark = require("remark");
const toc = require("remark-toc");
const toVfile = require("to-vfile");
const fs = require("fs");

const path = process.argv[2];

remark()
  .use(toc)
  .process(toVfile.readSync(path), function(err, file) {
    if (err) throw err;
    // toVfile also has a write method but it has a different input signature and options we don't need...
    fs.writeFile(path, String(file), err => {
      if (err) throw err;
      console.log(`populated TOC for ${path}`);
    });
  });
