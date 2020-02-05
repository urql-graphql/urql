import { stringifyVariables } from './stringifyVariables';

it('stringifies objects stabily', () => {
  expect(stringifyVariables({ b: 'b', a: 'a' })).toBe('{"a":"a","b":"b"}');
  expect(stringifyVariables({ x: { b: 'b', a: 'a' } })).toBe(
    '{"x":{"a":"a","b":"b"}}'
  );
});

it('stringifies arrays', () => {
  expect(stringifyVariables([1, 2])).toBe('[1,2]');
  expect(stringifyVariables({ x: [1, 2] })).toBe('{"x":[1,2]}');
});

it('stringifies scalars', () => {
  expect(stringifyVariables(1)).toBe('1');
  expect(stringifyVariables('test')).toBe('"test"');
  expect(stringifyVariables(null)).toBe('null');
  expect(stringifyVariables(undefined)).toBe('');
  expect(stringifyVariables(Infinity)).toBe('null');
  expect(stringifyVariables(1 / 0)).toBe('null');
});

it('throws for circular structures', () => {
  expect(() => {
    const x = { x: null } as any;
    x.x = x;
    stringifyVariables(x);
  }).toThrow();
});

it('stringifies date correctly', () => {
  expect(stringifyVariables(new Date('2019-12-11T04:20:00'))).toBe(
    '2019-12-11T04:20:00.000Z'
  );
});
