import { reloadRoutes } from "react-static/node";
import jdown from "jdown";
import chokidar from "chokidar";
import { getSidebarItems } from "./static-config-helpers/md-data-transforms";
const staticWebpackConfig = require("./static-config-parts/static-webpack-config");

chokidar.watch("content").on("all", () => reloadRoutes());

export default {
  getSiteData: () => ({
    title: "Spectacle"
  }),
  getRoutes: async () => {
    const { home, about } = await jdown("content");
    const sidebarItems = await getSidebarItems();

    const sidebarHeaders = sidebarItems.map(d => ({
      title: d.title,
      path: `/${d.slug}/`,
      slug: d.slug
    }));

    return [
      {
        path: "/",
        component: "src/screens/home",
        getData: () => ({
          ...home
        })
      },
      {
        path: "/about",
        component: "src/screens/about",
        getData: () => ({
          about
        })
      },
      {
        path: "/docs",
        component: "src/screens/docs",
        getData: () => {
          return {
            title: "Spectacle | Documentation",
            markdown: sidebarItems[0].markdown,
            renderedMd: sidebarItems[0].renderedMd,
            sidebarHeaders
          };
        },
        children: sidebarItems.map(
          ({ slug, path, title, markdown, renderedMd }) => ({
            path,
            component: "src/screens/docs",
            getData: () => ({
              title,
              slug,
              markdown,
              path: `/${slug}/`,
              renderedMd,
              sidebarHeaders
            })
          })
        )
      }
      // we can totes add lander or project specific 404s, if we ever have call to
      //{ path: "/404", component: "src/screens/404" }
    ];
  },
  webpack: staticWebpackConfig,
  document: require("./static-config-parts/document").default
};
