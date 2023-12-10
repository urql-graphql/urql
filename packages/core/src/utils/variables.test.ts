// @vitest-environment jsdom

import { stringifyVariables, extractFiles } from './variables';
import { describe, it, expect } from 'vitest';
import { Script } from 'vm';

describe('stringifyVariables', () => {
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

  it('returns null for circular structures', () => {
    const x = { x: null } as any;
    x.x = x;
    expect(stringifyVariables(x)).toBe('{"x":null}');
  });

  it('stringifies dates correctly', () => {
    const date = new Date('2019-12-11T04:20:00');
    expect(stringifyVariables(date)).toBe(`"${date.toJSON()}"`);
  });

  it('stringifies dictionaries (Object.create(null)) correctly', () => {
    expect(stringifyVariables(Object.create(null))).toBe('{}');
  });

  it('recovers if the root object is a dictionary (Object.create(null)) and nests a plain object', () => {
    const root = Object.create(null);
    root.data = { test: true };
    expect(stringifyVariables(root)).toBe('{"data":{"test":true}}');
  });

  it('recovers if the root object contains a dictionary (Object.create(null))', () => {
    const data = Object.create(null);
    data.test = true;
    const root = { data };
    expect(stringifyVariables(root)).toBe('{"data":{"test":true}}');
  });

  it('replaces non-plain objects at the root with keyed replacements', () => {
    expect(stringifyVariables(new (class Test {})())).toMatch(
      /^{"__key":"\w+"}$/
    );
    expect(stringifyVariables(new Map())).toMatch(/^{"__key":"\w+"}$/);
  });

  it('stringifies files correctly', () => {
    const file = new File([0] as any, 'test.js');
    const str = stringifyVariables(file);
    expect(str).toBe('null');
  });

  it('stringifies plain objects from foreign JS contexts correctly', () => {
    const global: typeof globalThis = new Script(
      'exports = globalThis'
    ).runInNewContext({}).exports;

    const plain = new global.Function('return { test: true }')();
    expect(stringifyVariables(plain)).toBe('{"test":true}');

    const data = new global.Function('return new (class Test {})')();
    expect(stringifyVariables(data)).toMatch(/^{"__key":"\w+"}$/);
  });
});

describe('extractFiles', () => {
  it('extracts files from nested objects', () => {
    const file = new Blob();
    expect(extractFiles({ files: { a: file } })).toEqual(
      new Map([['variables.files.a', file]])
    );
  });

  it('extracts files from nested arrays', () => {
    const file = new Blob();
    expect(extractFiles({ files: [file] })).toEqual(
      new Map([['variables.files.0', file]])
    );
  });
});
