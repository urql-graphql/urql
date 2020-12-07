// functions to produce objects representing entities => todos, writers, books, stores, employees
export const makeTodo = i => ({
  id: `${i}`,
  text: `Todo ${i}`,
  complete: false,
});
export const makeWriter = i => ({
  id: `${i}`,
  name: `Writer ${i}`,
  amountOfBooks: Math.random() * 100,
  recognized: Boolean(i % 2),
  number: i,
  interests: 'Dragonball-Z',
});
export const makeBook = i => ({
  id: `${i}`,
  title: `Book ${i}`,
  published: Boolean(i % 2),
  genre: 'Fantasy',
  rating: (i / Math.random()) * 100,
});
export const makeStore = i => ({
  id: `${i}`,
  name: `Store ${i}`,
  country: 'USA',
});
export const makeEmployee = i => ({
  id: `${i}`,
  name: `Employee ${i}`,
  origin: 'USA',
});
export const makeAuthor = i => ({
  id: `${i}`,
  name: `Author ${i}`,
  recognized: Boolean(i % 2),
  book: {
    id: `${i}`,
    title: `Book ${i}`,
    published: Boolean(i % 2),
    genre: `Non-Fiction`,
    rating: (i / Math.random()) * 100,
    review: {
      id: `${i}`,
      score: i,
      name: `Review ${i}`,
      reviewer: {
        id: `${i}`,
        name: `Person ${i}`,
        verified: Boolean(i % 2),
      },
    },
  },
});
