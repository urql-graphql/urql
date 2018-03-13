const graphqlHttp = require('express-graphql');
const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());

const { schema, context } = require('./schema');

const PORT = 3001;

const initializedGraphQLMiddleware = graphqlHttp({
  // GraphQL’s data schema
  schema: schema,
  // Pretty Print the JSON response
  pretty: true,
  // Enable GraphiQL dev tool
  graphiql: true,
  // A function that returns extra data available to every resolver
  context: context,
});

app.use(initializedGraphQLMiddleware);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
