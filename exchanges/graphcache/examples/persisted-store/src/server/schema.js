const store = {
  messages: [
    { id: 0, from: 'urql-team', message: 'have a wonderful persisted holiday' },
    { id: 1, from: 'urql-team', message: 'offline-preparations' },
  ],
};

const typeDefs = `
  type Query {
    messages: [Message]
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
