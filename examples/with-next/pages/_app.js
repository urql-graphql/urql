import { withUrqlClient } from "next-urql";

const App = ({ Component, pageProps }) => <Component {...pageProps} />

export default withUrqlClient(
  () => ({
    url: "http://localhost:3000/api/graphql"
  }),
  { ssr: false }
)(App);
