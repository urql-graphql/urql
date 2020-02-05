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
    newMessage: Message
  }
  type Message {
    id: ID,
    from: String,
    message: String,
  }
`;

const resolvers = {
  Query: {
    messages: () => store.messages,
  },
  Subscription: {
    newMessage: {
      subscribe: () => pubsub.asyncIterator('newMessage'),
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
  () => {
    const newMessage = {
      id: ++id,
      message: StarWars.quote(),
      from: StarWars.character(),
    }
    store.messages.push(newMessage);
    pubsub.publish('newMessage', {
      newMessage: newMessage,
    });
  },
  10000
);
