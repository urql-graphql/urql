import { reloadRoutes } from "react-static/node";
import chokidar from "chokidar";
import { getSidebarItems } from "./static-config-helpers/md-data-transforms";
const staticWebpackConfig = require("./static-config-parts/static-webpack-config");

chokidar.watch("content").on("all", () => reloadRoutes());

export default {
  plugins: ["react-static-plugin-styled-components"],
  getSiteData: () => ({
    title: "Spectacle"
  }),
  getRoutes: async () => {
    const sidebarItems = await getSidebarItems();
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
    ];
  },
  webpack: staticWebpackConfig,
  Document: require("./static-config-parts/document").default
};
