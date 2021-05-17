import { DocumentNode } from 'graphql';
import { TypedDocumentNode } from '@urql/core';

import { buildClientSchema, IntrospectionData } from './schema';
import { collectDocumentFields, Field, Ref } from './ast';
import { _tokens, tokens, init } from './tokenizer';

const js = (
  str: TemplateStringsArray,
  ...interpolations: ReadonlyArray<string | number>
) => {
  let body = str[0];
  for (let i = 0; i < interpolations.length; i++)
    body = body + interpolations[i] + str[i + 1];
  return body.trim();
};

type CodegenResult =
  | { kind: 'FUN'; name: string }
  | { kind: 'RAW'; code: string };

const _fns: string[] = [];

const codegen = (depth: number, field: Field, ref: Ref): CodegenResult => {
  let functionify = false;
  let nullable = true;
  if (ref.kind === 'NON_NULL') {
    nullable = false;
    ref = ref.ofType;
  }

  let inner = '';
  if (ref.kind === 'LIST') {
    const childCode = codegen(depth + 1, field, ref.ofType);
    if (childCode.kind === 'FUN') {
      inner = js`
        val_${depth} = [];
        while(${_tokens.delim}() !== 93)
          val_${depth}.push(${childCode.name}());
      `;
    } else {
      inner = js`
        val_${depth} = [];
        while(${_tokens.delim}() !== 93) {
          ${childCode.code}
          val_${depth}.push(val_${depth + 1});
        }
      `;
    }
  } else if (ref.kind === 'SCALAR') {
    let token: string;
    switch (ref.name) {
      case 'ID':
      case 'String':
        token = _tokens.str;
        break;
      case 'Int':
        token = _tokens.int;
        break;
      case 'Float':
        token = _tokens.float;
        break;
      case 'Boolean':
        token = _tokens.bool;
        break;
      default:
        token = _tokens.any;
    }

    inner = js`
      val_${depth} = ${token}();
    `;
  } else if (ref.kind === 'ENUM') {
    inner = js`
      val_${depth} = ${_tokens.str}();
    `;
  } else if (field.selection) {
    functionify = true;
    let fields = '';
    let init = '';

    // TODO: Interface & Union handling
    const map = field.selection[field.type]!;
    for (const alias in map) {
      const childField = map[alias];
      const childCode = codegen(depth + 1, childField, childField.ref);
      init += js`${alias}: null,`;
      if (childCode.kind === 'FUN') {
        fields += js`
          ${_tokens.prop}();
          val_${depth}.${alias} = ${childCode.name}();
          ${_tokens.delim}();
        `;
      } else {
        fields += js`
          ${_tokens.prop}();
          ${childCode.code}
          val_${depth}.${alias} = val_${depth + 1};
          ${_tokens.delim}();
        `;
      }
    }

    inner = js`
      ${_tokens.delim}();
      var val_${depth} = {${init}};
      ${fields}
    `;
  } else {
    return { kind: 'RAW', code: '' };
  }

  let code: string;
  if (nullable) {
    code = js`
      var val_${depth};
      if (${_tokens.null}()) {
        val_${depth} = null;
      } else {
        ${inner}
      }
    `;
  } else {
    code = js`
      var val_${depth};
      ${inner}
    `;
  }

  if (functionify) {
    const name = `fn_${_fns.length}`;
    _fns.push(
      js`
        function fn_${_fns.length}() {
          ${inner}
          return val_${depth};
        }
      `
    );

    return { kind: 'FUN', name };
  }

  return { kind: 'RAW', code };
};

export type Parser<T = unknown> = null | ((json: string) => T | null);

export const codegenParser = (field: Field): string => {
  _fns.length = 0;
  const code = codegen(0, field, field.ref);
  if (code.kind === 'FUN') {
    return js`
      ${_fns.join('\n')}
      return (function (str) {
        init(str);
        return ${code.name}();
      });
    `;
  } else {
    return js`
      ${_fns.join('\n')}
      return (function (str) {
        init(str);
        ${code.code}
        return val_0;
      });
    `;
  }
};

export interface JSONParser {
  <T>(json: string, query: DocumentNode | TypedDocumentNode<T>): T | null;
  forQuery<T>(query: DocumentNode | TypedDocumentNode<T>): Parser<T>;
}

export function makeParser(schema: IntrospectionData): JSONParser {
  const cache = new WeakMap<DocumentNode, Parser>();
  const types = buildClientSchema(schema);

  function forQuery<T>(query: DocumentNode | TypedDocumentNode<T>): Parser<T> {
    let parser = cache.get(query);
    if (!parser) {
      const field = collectDocumentFields(types, query);
      if (!field) return null;
      parser = new Function('tokens,init', codegenParser(field))(
        tokens,
        init
      ) as Parser;
      cache.set(query, parser);
    }

    return parser as Parser<T>;
  }

  function parse<T>(
    json: string,
    query: DocumentNode | TypedDocumentNode<T>
  ): T | null {
    return forQuery(query)!(json);
  }

  parse.forQuery = forQuery;
  return parse as JSONParser;
}
