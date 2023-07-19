import { describe, it, expect } from 'vitest';
import { collectTypenames } from './collectTypenames';

describe('collectTypenames', () => {
  it('returns all typenames included in a response as an array', () => {
    const typeNames = collectTypenames({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
      ],
    });
    expect(typeNames).toEqual(['Todo']);
  });

  it('does not duplicate typenames', () => {
    const typeNames = collectTypenames({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
        {
          id: 3,
          __typename: 'Todo',
        },
      ],
    });
    expect(typeNames).toEqual(['Todo']);
  });

  it('returns multiple different typenames', () => {
    const typeNames = collectTypenames({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
        {
          id: 3,
          __typename: 'Avocado',
        },
      ],
    });
    expect(typeNames).toEqual(['Todo', 'Avocado']);
  });

  it('works on nested objects', () => {
    const typeNames = collectTypenames({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
        {
          id: 2,
          subTask: {
            id: 3,
            __typename: 'SubTask',
          },
        },
      ],
    });
    expect(typeNames).toEqual(['Todo', 'SubTask']);
  });

  it('traverses nested arrays of objects', () => {
    const typenames = collectTypenames({
      todos: [
        {
          id: 1,
          authors: [
            [
              {
                name: 'Phil',
                __typename: 'Author',
              },
            ],
          ],
          __typename: 'Todo',
        },
      ],
    });

    expect(typenames).toEqual(['Author', 'Todo']);
  });
});
