import * as InMemoryData from './data';
import { keyOfField } from './keys';

let data: InMemoryData.InMemoryData;

beforeEach(() => {
  data = InMemoryData.make();
});

describe('garbage collection', () => {
  it('erases orphaned entities', () => {
    InMemoryData.writeRecord(data, 'Todo:1', '__typename', 'Todo');
    InMemoryData.writeRecord(data, 'Todo:1', 'id', '1');
    InMemoryData.writeRecord(data, 'Query', '__typename', 'Query');
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:1');

    InMemoryData.gc(data);

    expect(InMemoryData.readLink(data, 'Query', 'todo')).toBe('Todo:1');

    InMemoryData.writeLink(data, 'Query', 'todo', undefined);
    InMemoryData.gc(data);

    expect(InMemoryData.readLink(data, 'Query', 'todo')).toBe(undefined);
    expect(InMemoryData.readRecord(data, 'Todo:1', 'id')).toBe(undefined);
  });

  it('keeps readopted entities', () => {
    InMemoryData.writeRecord(data, 'Todo:1', '__typename', 'Todo');
    InMemoryData.writeRecord(data, 'Todo:1', 'id', '1');
    InMemoryData.writeRecord(data, 'Query', '__typename', 'Query');
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:1');
    InMemoryData.writeLink(data, 'Query', 'todo', undefined);
    InMemoryData.writeLink(data, 'Query', 'newTodo', 'Todo:1');

    InMemoryData.gc(data);
    expect(InMemoryData.readLink(data, 'Query', 'newTodo')).toBe('Todo:1');
    expect(InMemoryData.readLink(data, 'Query', 'todo')).toBe(undefined);
    expect(InMemoryData.readRecord(data, 'Todo:1', 'id')).toBe('1');
  });

  it('keeps entities with multiple owners', () => {
    InMemoryData.writeRecord(data, 'Todo:1', '__typename', 'Todo');
    InMemoryData.writeRecord(data, 'Todo:1', 'id', '1');
    InMemoryData.writeRecord(data, 'Query', '__typename', 'Query');
    InMemoryData.writeLink(data, 'Query', 'todoA', 'Todo:1');
    InMemoryData.writeLink(data, 'Query', 'todoB', 'Todo:1');
    InMemoryData.writeLink(data, 'Query', 'todoA', undefined);

    InMemoryData.gc(data);
    expect(InMemoryData.readLink(data, 'Query', 'todoA')).toBe(undefined);
    expect(InMemoryData.readLink(data, 'Query', 'todoB')).toBe('Todo:1');
    expect(InMemoryData.readRecord(data, 'Todo:1', 'id')).toBe('1');
  });

  it('skips entities with optimistic updates', () => {
    InMemoryData.writeRecord(data, 'Todo:1', '__typename', 'Todo');
    InMemoryData.writeRecord(data, 'Todo:1', 'id', '1');
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:1');

    InMemoryData.setCurrentOptimisticKey(1);
    InMemoryData.writeLink(data, 'Query', 'temp', 'Todo:1');
    InMemoryData.setCurrentOptimisticKey(0);

    InMemoryData.writeLink(data, 'Query', 'todo', undefined);
    InMemoryData.gc(data);

    expect(InMemoryData.readRecord(data, 'Todo:1', 'id')).toBe('1');

    InMemoryData.clearOptimistic(data, 1);
    InMemoryData.gc(data);
    expect(InMemoryData.readRecord(data, 'Todo:1', 'id')).toBe(undefined);
  });

  it('erases child entities that are orphaned', () => {
    InMemoryData.writeRecord(data, 'Author:1', '__typename', 'Author');
    InMemoryData.writeRecord(data, 'Author:1', 'id', '1');
    InMemoryData.writeLink(data, 'Todo:1', 'author', 'Author:1');
    InMemoryData.writeRecord(data, 'Todo:1', '__typename', 'Todo');
    InMemoryData.writeRecord(data, 'Todo:1', 'id', '1');
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:1');

    InMemoryData.writeLink(data, 'Query', 'todo', undefined);
    InMemoryData.gc(data);

    expect(InMemoryData.readRecord(data, 'Todo:1', 'id')).toBe(undefined);
    expect(InMemoryData.readRecord(data, 'Author:1', 'id')).toBe(undefined);
  });
});

describe('inspectFields', () => {
  it('returns field infos for all links and records', () => {
    InMemoryData.writeRecord(data, 'Query', '__typename', 'Query');
    InMemoryData.writeLink(
      data,
      'Query',
      keyOfField('todo', { id: '1' }),
      'Todo:1'
    );
    InMemoryData.writeRecord(
      data,
      'Query',
      keyOfField('hasTodo', { id: '1' }),
      true
    );
    InMemoryData.writeLink(data, 'Query', 'randomTodo', 'Todo:1');

    expect(InMemoryData.inspectFields(data, 'Query')).toMatchInlineSnapshot(`
      Array [
        Object {
          "arguments": Object {
            "id": "1",
          },
          "fieldKey": "todo({\\"id\\":\\"1\\"})",
          "fieldName": "todo",
        },
        Object {
          "arguments": null,
          "fieldKey": "randomTodo",
          "fieldName": "randomTodo",
        },
        Object {
          "arguments": null,
          "fieldKey": "__typename",
          "fieldName": "__typename",
        },
        Object {
          "arguments": Object {
            "id": "1",
          },
          "fieldKey": "hasTodo({\\"id\\":\\"1\\"})",
          "fieldName": "hasTodo",
        },
      ]
    `);
  });

  it('returns an empty array when an entity is unknown', () => {
    expect(InMemoryData.inspectFields(data, 'Random')).toEqual([]);
  });

  it('returns field infos for all optimistic updates', () => {
    InMemoryData.setCurrentOptimisticKey(1);
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:1');
    InMemoryData.setCurrentOptimisticKey(0);

    expect(InMemoryData.inspectFields(data, 'Random')).toMatchInlineSnapshot(
      `Array []`
    );
  });

  it('avoids duplicate field infos', () => {
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:1');

    InMemoryData.setCurrentOptimisticKey(1);
    InMemoryData.writeLink(data, 'Query', 'todo', 'Todo:2');
    InMemoryData.setCurrentOptimisticKey(0);

    expect(InMemoryData.inspectFields(data, 'Query')).toMatchInlineSnapshot(`
      Array [
        Object {
          "arguments": null,
          "fieldKey": "todo",
          "fieldName": "todo",
        },
      ]
    `);
  });
});
