import { maskTypename } from './maskTypename';

it('strips typename from flat objects', () => {
  expect(maskTypename({ __typename: 'Todo', id: 1 })).toEqual({ id: 1 });
});

it('strips typename from flat objects containing dates', () => {
  const date = new Date();
  expect(maskTypename({ __typename: 'Todo', id: 1, date })).toEqual({
    id: 1,
    date,
  });
});

it('strips typename from nested objects', () => {
  expect(
    maskTypename({
      __typename: 'Todo',
      id: 1,
      author: {
        id: 2,
        __typename: 'Author',
      },
    })
  ).toEqual({ id: 1, author: { id: 2 } });
});

it('works with nested arrays', () => {
  expect(
    maskTypename({
      __typename: 'Todo',
      id: 1,
      nodes: [[4, 5]],
      author: {
        id: 2,
        __typename: 'Author',
      },
    })
  ).toEqual({ id: 1, nodes: [[4, 5]], author: { id: 2 } });
});

it('strips typename from nested objects with arrays', () => {
  expect(
    maskTypename({
      __typename: 'Todo',
      id: 1,
      author: {
        id: 2,
        __typename: 'Author',
        books: [
          {
            id: 3,
            __typename: 'Book',
            review: { id: 8, __typename: 'Review' },
          },
          { id: 4, __typename: 'Book' },
          { id: 5, __typename: 'Book' },
        ],
      },
    })
  ).toEqual({
    id: 1,
    author: {
      id: 2,
      books: [{ id: 3, review: { id: 8 } }, { id: 4 }, { id: 5 }],
    },
  });
});
