import { Field } from './ast';
import { codegenParser, Parser } from './parser';
import { tokens, init } from './tokenizer';

function makeParser(field: Field): Parser {
  return new Function('tokens,init', codegenParser(field))(tokens, init);
}

describe('codegen parser', () => {
  it('parses a basic String field', () => {
    const field: Field = {
      type: 'Query',
      ref: { kind: 'OBJECT', name: 'Query' },
      selection: {
        Query: {
          ping: {
            type: 'String',
            ref: { kind: 'SCALAR', name: 'String' },
          },
        },
      },
    };

    expect(codegenParser(field)).toMatchInlineSnapshot(`
      "function fn_0() {
                tokens.delim();
            var val_0 = {ping: null,};
            tokens.prop();
                var val_1;
            if (tokens.null()) {
              val_1 = null;
            } else {
              val_1 = tokens.str();
            }
                val_0.ping = val_1;
                tokens.delim();
                return val_0;
              }
            return (function (str) {
              init(str);
              return fn_0();
            });"
    `);

    const parser = makeParser(field)!;
    expect(parser('{"ping":"pong"}')).toEqual({ ping: 'pong' });
    expect(parser('{"ping":null}')).toEqual({ ping: null });
  });

  it('parses a list of a String field', () => {
    const field: Field = {
      type: 'Query',
      ref: { kind: 'OBJECT', name: 'Query' },
      selection: {
        Query: {
          ping: {
            type: 'String',
            ref: {
              kind: 'LIST',
              ofType: { kind: 'SCALAR', name: 'String' },
            },
          },
        },
      },
    };

    expect(codegenParser(field)).toMatchInlineSnapshot(`
      "function fn_0() {
                tokens.delim();
            var val_0 = {ping: null,};
            tokens.prop();
                var val_1;
            if (tokens.null()) {
              val_1 = null;
            } else {
              val_1 = [];
              while(tokens.delim() !== 93) {
                var val_2;
            if (tokens.null()) {
              val_2 = null;
            } else {
              val_2 = tokens.str();
            }
                val_1.push(val_2);
              }
            }
                val_0.ping = val_1;
                tokens.delim();
                return val_0;
              }
            return (function (str) {
              init(str);
              return fn_0();
            });"
    `);

    const parser = makeParser(field)!;

    expect(parser('{ "ping": ["pong", null] }')).toEqual({
      ping: ['pong', null],
    });

    expect(parser('{ "ping": null} ')).toEqual({ ping: null });
  });

  it('parses "Any" scalars', () => {
    const field: Field = {
      type: 'Query',
      ref: { kind: 'OBJECT', name: 'Query' },
      selection: {
        Query: {
          ping: {
            type: 'Any',
            ref: { kind: 'SCALAR', name: 'Any' },
          },
        },
      },
    };

    expect(codegenParser(field)).toMatchInlineSnapshot(`
      "function fn_0() {
                tokens.delim();
            var val_0 = {ping: null,};
            tokens.prop();
                var val_1;
            if (tokens.null()) {
              val_1 = null;
            } else {
              val_1 = tokens.any();
            }
                val_0.ping = val_1;
                tokens.delim();
                return val_0;
              }
            return (function (str) {
              init(str);
              return fn_0();
            });"
    `);

    const parser = makeParser(field)!;

    expect(parser('{"ping": {"test":true} }')).toEqual({
      ping: { test: true },
    });

    expect(parser('{"ping": 123 }')).toEqual({ ping: 123 });
  });
});
