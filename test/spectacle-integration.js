const puppeteer = require("puppeteer");

try {
  (async () => { // eslint-disable-line
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/open-source/spectacle/");
    await page.screenshot({
      path: `test/screenshots/index.png`,
      type: "png"
    });
    await page.click(`[href="/open-source/spectacle/docs"]`);
    await page.waitFor(3000);
    await page.screenshot({
      path: `test/screenshots/docs.png`,
      type: "png"
    });
    const article = await page.waitForSelector("article");
    if (!article) {
      throw new Error(`Docs route did not render as expected!`);
    }

    // we can do these too, but really validating that they exist is probably sufficient, lemme know!
    // const externalLinks = ["https://gitter.im/FormidableLabs/victory", "https://github.com/FormidableLabs/victory"];
    // for (let i = 0; i < externalLinks.length; i++) {
    //   const l = links[i];
    //   await page.click(`[href='${l}']`);
    //   await page.waitFor(2000);
    //   await page.goBack();
    // }
    await browser.close();
  })();
} catch (err) {
  throw err;
}
