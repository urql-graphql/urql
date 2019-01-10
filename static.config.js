import { reloadRoutes } from "react-static/node";
import chokidar from "chokidar";
import { getSidebarItems } from "./static-config-helpers/md-data-transforms";
const staticWebpackConfig = require("./static-config-parts/static-webpack-config");

chokidar.watch("content").on("all", () => reloadRoutes());

export default {
  getSiteData: () => ({
    title: "Spectacle"
  }),
  getRoutes: async () => {
    const sidebarItems = await getSidebarItems();
    console.log(sidebarItems);
    console.log(sidebarItems.length, 'LENGTH');

    const sidebarHeaders = sidebarItems.map(d => ({
      title: d.title,
      path: `/${d.slug}/`,
      slug: d.slug
    }));

    return [
      {
        path: "/",
        component: "src/screens/home"
      },
      {
        path: "/about",
        component: "src/screens/about"
      },
      {
        path: "/docs",
        component: "src/screens/docs",
        getData: () => ({
          title: "Spectacle | Documentation",
          markdown: sidebarItems[0].markdown,
          renderedMd: sidebarItems[0].renderedMd,
          sidebarHeaders,
          tocArray: sidebarItems[0].data.subHeadings.map(sh => ({
            content: sh.value,
            level: sh.depth
          }))
        }),
        // move slug + path to data in transform, renderedMd to data, and nuke markdown prop
        children: sidebarItems.map(
          ({ slug, path, markdown, renderedMd, data }) => ({
            path,
            component: "src/screens/docs",
            getData: () => ({
              title: data.title,
              markdown,
              path: `/${slug}/`,
              renderedMd,
              sidebarHeaders,
              tocArray: data.subHeadings.map(sh => ({
                content: sh.value,
                level: sh.depth
              }))
            })
          })
        )
      }
      // we can totes add lander or project specific 404s, if we ever have call to
      // { path: "/404", component: "src/screens/404" }
    ];
  },
  webpack: staticWebpackConfig,
  document: require("./static-config-parts/document").default
};
