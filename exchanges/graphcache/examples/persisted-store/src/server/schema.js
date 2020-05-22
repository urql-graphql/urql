function getMessages() {
  const now = new Date();

  return [
    { id: 0, from: 'urql-team', message: 'have a wonderful persisted holiday' },
    { id: 1, from: 'urql-team', message: 'offline-preparations' },
    { id: 2, from: 'urql-team', message: 'server time is ' + now.getHours() + ' hours, ' + now.getMinutes() + ' mins, ' + now.getSeconds() + ' secs' },
  ];
}

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
    messages: getMessages,
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
