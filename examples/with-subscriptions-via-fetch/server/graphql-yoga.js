const { createYoga } = require('graphql-yoga');
const { createServer } = require('http');
const { schema } = require('./schema');

const yoga = createYoga({ schema });
const server = createServer(yoga);
server.listen(3004);
