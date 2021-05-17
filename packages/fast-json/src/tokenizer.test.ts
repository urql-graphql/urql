import * as tokenizer from './tokenizer';

describe('tokenizer', () => {
  it('parses basic scalars and values', () => {
    tokenizer.init('null');
    expect(tokenizer.takeNull()).toBe(true);

    tokenizer.init('true');
    expect(tokenizer.takeBoolean()).toBe(true);
    tokenizer.init('false');
    expect(tokenizer.takeBoolean()).toBe(false);

    tokenizer.init('142');
    expect(tokenizer.takeInteger()).toBe(142);
    tokenizer.init('-42');
    expect(tokenizer.takeInteger()).toBe(-42);

    tokenizer.init('1.24');
    expect(tokenizer.takeFloat()).toBe(1.24);
    tokenizer.init('-0.5e2');
    expect(tokenizer.takeFloat()).toBe(-50);

    tokenizer.init('{"example":[{"a":1}]}');
    expect(tokenizer.takeAny()).toEqual({ example: [{ a: 1 }] });

    tokenizer.init('true');
    expect(tokenizer.takeAny()).toBe(true);
  });

  it('parses empty whitespace', () => {
    tokenizer.init('\n\t\f\r null');
    expect(tokenizer.takeNull()).toBe(true);
  });

  it('parses strings', () => {
    tokenizer.init('"test"');
    expect(tokenizer.takeString()).toBe('test');
    expect(tokenizer.index()).toBe(6);

    tokenizer.init('"\\n\\t\\f\\r"');
    expect(tokenizer.takeString()).toBe('\n\t\f\r');
    expect(tokenizer.index()).toBe(10);

    tokenizer.init('"\\u0061"');
    expect(tokenizer.takeString()).toBe('a');
    expect(tokenizer.index()).toBe(8);
  });

  it('parses array sequences', () => {
    const res = [1, 2, 3];
    tokenizer.init(JSON.stringify(res));
    tokenizer.takeDelimiter();

    let value: number | void;
    while ((value = tokenizer.takeInteger()) !== undefined) {
      expect(value).toBe(res.shift());
      if (tokenizer.takeDelimiter() === 93 /*']'*/) break;
    }

    expect(res.length).toBe(0);
  });

  it('parses object sequences', () => {
    const res: number[] = [];
    tokenizer.init('{"1":1,"2":2}');
    tokenizer.takeDelimiter();

    for (let i = 1; !!i; i++) {
      tokenizer.takeProperty();
      const value = tokenizer.takeInteger();
      expect(value).toBe(i);
      res.push(value!);
      if (tokenizer.takeDelimiter() === 125 /*'}'*/) break;
    }

    expect(res).toEqual([1, 2]);
  });

  it('parses any-values inside object sequences', () => {
    tokenizer.init('{"a":{},"b":{}}');
    expect(tokenizer.takeDelimiter()).toBe(123 /*'{'*/);
    tokenizer.takeProperty();
    expect(tokenizer.takeAny()).toEqual({});
    expect(tokenizer.takeDelimiter()).toBe(44 /*','*/);
    tokenizer.takeProperty();
    expect(tokenizer.takeAny()).toEqual({});
    expect(tokenizer.takeDelimiter()).toBe(125 /*'}'*/);
  });
});
