const { PubSub } = require('graphql-subscriptions');
const { StarWars } = require('fakergem');

const pubsub = new PubSub();

const store = {
  messages: [],
};

const typeDefs = `
  type Query {
    messages: [Message]
  }
  type Subscription {
    newMessages: Message
  }
  type Message {
    id: ID,
    from: String,
    message: String,
  }
`;

const resolvers = {
  Query: {
    messages: store.messages,
  },
  Subscription: {
    newMessages: {
      subscribe: () => pubsub.asyncIterator('newMessages'),
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
  context: (headers, secrets) => {
    return {
      headers,
      secrets,
    };
  },
};

// Fake message dispatcher
let id = 0;

setInterval(
  () =>
    pubsub.publish('newMessages', {
      newMessages: {
        id: ++id,
        message: StarWars.quote(),
        from: StarWars.character(),
      },
    }),
  5000
);
