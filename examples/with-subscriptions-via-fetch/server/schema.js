const {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} = require('graphql');

const Alphabet = new GraphQLObjectType({
  name: 'Alphabet',
  fields: {
    char: {
      type: GraphQLString,
    },
  },
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      list: {
        type: new GraphQLList(Alphabet),
        resolve() {
          return [{ char: 'Where are my letters?' }];
        },
      },
    }),
  }),
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
      alphabet: {
        type: Alphabet,
        resolve(root) {
          return root;
        },
        subscribe: async function* () {
          for (let letter = 65; letter <= 90; letter++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            yield { char: String.fromCharCode(letter) };
          }
        },
      },
    }),
  }),
});

module.exports = { schema };
