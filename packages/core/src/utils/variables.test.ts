import { stringifyVariables, extractFiles } from './variables';
import { describe, it, expect } from 'vitest';

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

  it('stringifies files correctly', () => {
    const file = new File([0] as any, 'test.js');
    Object.defineProperty(file, 'lastModified', { value: 123 });
    const str = stringifyVariables(file);
    expect(str).toBe(stringifyVariables(file));

    const otherFile = new File([0] as any, 'otherFile.js');
    Object.defineProperty(otherFile, 'lastModified', { value: 234 });
    expect(str).not.toBe(stringifyVariables(otherFile));
  });
});

describe('extractFiles', () => {
  it('extracts files from nested objects', () => {
    const file = new Blob();
    expect(extractFiles({ files: { a: file } })).toEqual(
      new Map([['.files.a', file]])
    );
  });

  it('extracts files from nested arrays', () => {
    const file = new Blob();
    expect(extractFiles({ files: [file] })).toEqual(
      new Map([['.files.0', file]])
    );
  });
});
