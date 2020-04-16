const gql = require('graphql-tag');
const { InMemoryCache } = require('@apollo/client');
const { Store, write, query } = require('../dist/urql-exchange-graphcache.min');

const countries = ['UK', 'BE', 'ES', 'US'];

const makeEntries = (amount, makeEntry) => {
  const entries = [];
  for(let i = 0;i<amount;i++) {
    entries.push(makeEntry(i));
  }
  return entries;
}

const TodosQuery = gql`
  query {
    todos {
      id
      text
      complete
      due
      __typename
    }
  }
`;

const makeTodo = i => ({
  id: `${i}`,
  due: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
  text: `Todo ${i}`,
  complete: Boolean(i % 2),
  __typename: 'Todo',
});
const hundredEntries = makeEntries(100, makeTodo);
const thousandEntries = makeEntries(1000, makeTodo);
const tenThousandEntries = makeEntries(10000, makeTodo);

suite('100 entries write', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });

  benchmark('apollo', () => {
    return apolloCache.writeQuery({
      query: TodosQuery,
      data: { todos: hundredEntries }
    })
  });

  benchmark('urql', () => {
    return write(urqlStore, { query: TodosQuery }, { todos: hundredEntries });
  });
});

suite('1,000 entries write', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    return apolloCache.writeQuery({
      query: TodosQuery,
      data: { todos: thousandEntries },
    });
  });

  benchmark('urql', () => {
    return write(urqlStore, { query: TodosQuery }, { todos: thousandEntries });
  });
});

suite('10,000 entries write', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    return apolloCache.writeQuery({
      query: TodosQuery,
      data: { todos: tenThousandEntries },
    });
  });

  benchmark('urql', () => {
    return write(
      urqlStore,
      { query: TodosQuery },
      { todos: tenThousandEntries }
    );
  });
});

suite('100 entries read', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  write(urqlStore, { query: TodosQuery }, { todos: hundredEntries });
  apolloCache.writeQuery({ query: TodosQuery, data: { todos: hundredEntries } })

  benchmark('apollo', () => {
    return apolloCache.readQuery({
      query: TodosQuery,
    });
  });

  benchmark('urql', () => {
    return query(urqlStore, { query: TodosQuery });
  });
});

suite('1,000 entries read', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  write(urqlStore, { query: TodosQuery }, { todos: thousandEntries });
  apolloCache.writeQuery({
    query: TodosQuery,
    data: { todos: thousandEntries },
  });

  benchmark('apollo', () => {
    return apolloCache.readQuery({
      query: TodosQuery,
    });
  });

  benchmark('urql', () => {
    return query(urqlStore, { query: TodosQuery });
  });
});

suite('10,000 entries read', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  write(urqlStore, { query: TodosQuery }, { todos: tenThousandEntries });
  apolloCache.writeQuery({
    query: TodosQuery,
    data: { todos: tenThousandEntries },
  });

  benchmark('apollo', () => {
    return apolloCache.readQuery({
      query: TodosQuery,
    });
  });

  benchmark('urql', () => {
    return query(
      urqlStore,
      { query: TodosQuery },
    );
  });
});

const makeWriter = i => ({
  id: `${i}`,
  name: `writer ${i}`,
  amountOfBooks: Math.random() * 100,
  recognised: Boolean(i % 2),
  number: i,
  interests: 'star wars',
  __typename: 'Writer',
});
const makeBook = i => ({
  id: `${i}`,
  title: `book ${i}`,
  published: Boolean(i % 2),
  genre: 'Fantasy',
  rating: (i / Math.random()) * 100,
  release: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
  __typename: 'Book',
});
const makeStore = i => ({
  id: `${i}`,
  name: `store ${i}`,
  started: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
  country: countries[Math.floor(Math.random()) * 4],
  __typename: 'Store',
});
const makeEmployee = i => ({
  id: `${i}`,
  name: `employee ${i}`,
  dateOfBirth: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
  origin: countries[Math.floor(Math.random()) * 4],
  __typename: 'Employee',
});

const WritersQuery = gql`
  query {
    writers {
      id
      name
      amountOfBooks
      interests
      recognised
      number
      __typename
    }
  }
`;
const hundredWriters = makeEntries(100, makeWriter);
const thousandWriters= makeEntries(1000, makeWriter);
const tenThousandWriters = makeEntries(10000, makeWriter);

const BooksQuery = gql`
  query {
    books {
      id
      title
      genre
      published
      rating
      release
      __typename
    }
  }
`;
const hundredBooks = makeEntries(100, makeBook);
const thousandBooks = makeEntries(1000, makeBook);
const tenThousandBooks = makeEntries(10000, makeBook);

const StoresQuery = gql`
  query {
    stores {
      id
      country
      started
      name
      __typename
    }
  }
`;
const hundredStores = makeEntries(100, makeStore);
const thousandStores = makeEntries(1000, makeStore);
const tenThousandStores = makeEntries(10000, makeStore);

const EmployeesQuery = gql`
  query {
    employees {
      id
      dateOfBirth
      name
      origin
      __typename
    }
  }
`;
const hundredEmployees = makeEntries(100, makeEmployee);
const thousandEmployees = makeEntries(1000, makeEmployee);
const tenThousandEmployees = makeEntries(10000, makeEmployee);

suite('100 entries write five entities', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    apolloCache.writeQuery({
      query: BooksQuery,
      data: { books: hundredBooks },
    });
    apolloCache.writeQuery({
      query: EmployeesQuery,
      data: { employees: hundredEmployees },
    });
    apolloCache.writeQuery({
      query: StoresQuery,
      data: { stores: hundredStores },
    });
    apolloCache.writeQuery({
      query: WritersQuery,
      data: { writers: hundredWriters },
    });
    return apolloCache.writeQuery({
      query: TodosQuery,
      data: { todos: hundredEntries },
    });
  });

  benchmark('urql', () => {
    write(urqlStore, { query: BooksQuery }, { books: hundredBooks });
    write(urqlStore, { query: EmployeesQuery }, { employees: hundredEmployees });
    write(urqlStore, { query: StoresQuery }, { stores: hundredStores });
    write(urqlStore, { query: WritersQuery }, { writers: hundredWriters });
    return write(urqlStore, { query: TodosQuery }, { todos: hundredEntries });
  });
});

suite('1,000 entries write five entities', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    apolloCache.writeQuery({
      query: BooksQuery,
      data: { books: thousandBooks },
    });
    apolloCache.writeQuery({
      query: EmployeesQuery,
      data: { employees: thousandEmployees },
    });
    apolloCache.writeQuery({
      query: StoresQuery,
      data: { stores: thousandStores },
    });
    apolloCache.writeQuery({
      query: WritersQuery,
      data: { writers: thousandWriters },
    });
    return apolloCache.writeQuery({
      query: TodosQuery,
      data: { todos: thousandEntries },
    });
  });

  benchmark('urql', () => {
    write(urqlStore, { query: BooksQuery }, { books: thousandBooks });
    write(
      urqlStore,
      { query: EmployeesQuery },
      { employees: thousandEmployees }
    );
    write(urqlStore, { query: StoresQuery }, { stores: thousandStores });
    write(urqlStore, { query: WritersQuery }, { writers: thousandWriters });
    return write(urqlStore, { query: TodosQuery }, { todos: thousandEntries });
  });
});

suite('10,000 entries write five entities', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    apolloCache.writeQuery({
      query: BooksQuery,
      data: { books: tenThousandBooks },
    });
    apolloCache.writeQuery({
      query: EmployeesQuery,
      data: { employees: tenThousandEmployees },
    });
    apolloCache.writeQuery({
      query: StoresQuery,
      data: { stores: tenThousandStores },
    });
    apolloCache.writeQuery({
      query: WritersQuery,
      data: { writers: tenThousandWriters },
    });
    return apolloCache.writeQuery({
      query: TodosQuery,
      data: { todos: tenThousandEntries },
    });
  });

  benchmark('urql', () => {
    write(urqlStore, { query: BooksQuery }, { books: tenThousandBooks });
    write(
      urqlStore,
      { query: EmployeesQuery },
      { employees: tenThousandEmployees }
    );
    write(urqlStore, { query: StoresQuery }, { stores: tenThousandStores });
    write(urqlStore, { query: WritersQuery }, { writers: tenThousandWriters });
    return write(urqlStore, { query: TodosQuery }, { todos: tenThousandEntries });
  });
});

const makeAuthor = i => ({
  id: `${i}`,
  name: `author ${i}`,
  recognised: Boolean(i % 2),
  __typename: 'Author',
  book: {
    id: `${i}`,
    name: `book ${i}`,
    published: Boolean(i % 2),
    __typename: 'Book',
    review: {
      id: `${i}`,
      score: i,
      name: `review ${i}`,
      __typename: 'Review',
      reviewer: {
        id: `${i}`,
        name: `person ${i}`,
        verified: Boolean(i % 2),
        __typename: 'Person',
      },
    },
  },
});

const AuthorQuery = gql`
  query {
    authors {
      id
      name
      recognised
      __typename
      book {
        id
        published
        name
        __typename
        review {
          id
          score
          name
          __typename
          reviewer {
            id
            name
            verified
            __typename
          }
        }
      }
    }
  }
`;

const hundredEntriesComplex = makeEntries(100, makeAuthor);
const thousandEntriesComplex = makeEntries(1000, makeAuthor);
const tenThousandEntriesComplex = makeEntries(10000, makeAuthor);

suite('100 entries complex write', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    return apolloCache.writeQuery({
      query: AuthorQuery,
      data: { authors: hundredEntriesComplex },
    });
  });

  benchmark('urql', () => {
    return write(urqlStore, { query: AuthorQuery }, { authors: hundredEntriesComplex });
  });
});

suite('1,000 entries complex write', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    return apolloCache.writeQuery({
      query: AuthorQuery,
      data: { authors: thousandEntriesComplex },
    });
  });

  benchmark('urql', () => {
    return write(urqlStore, { query: AuthorQuery }, { authors: thousandEntriesComplex });
  });
});

suite('10,000 entries complex write', () => {
  const urqlStore = new Store();
  const apolloCache = new InMemoryCache({ resultCaching: false });;

  benchmark('apollo', () => {
    return apolloCache.writeQuery({
      query: AuthorQuery,
      data: { authors: tenThousandEntriesComplex },
    });
  });

  benchmark('urql', () => {
    return write(
      urqlStore,
      { query: AuthorQuery },
      { authors: tenThousandEntriesComplex }
    );
  });
});
