// NOTE: This currently fails because responses for @defer/@stream are formatted
// as `{incremental: [...PAYLOADS], hasNext: true }` rather than `{ ...PAYLOAD, hasNext: true }`

const { createYoga } = require('graphql-yoga');
const { useDeferStream } = require('@graphql-yoga/plugin-defer-stream');
const { createServer } = require('http');
const { schema } = require('./schema');

const yoga = createYoga({
  schema,
  plugins: [useDeferStream()],
});

const server = createServer(yoga);

server.listen(3004);
