import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http, { Server as Server$1 } from 'node:http';
import https, { Server } from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import invariant from 'vinxi/lib/invariant';
import { virtualId, handlerModule, join as join$1 } from 'vinxi/lib/path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { fromJSON, crossSerializeStream, getCrossReferenceHeader } from 'seroval';
import { CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin } from 'seroval-plugins/web';
import { sharedConfig, lazy, createComponent, useContext, createContext as createContext$1, getOwner, getListener, onCleanup, createSignal, startTransition, batch, catchError, ErrorBoundary, Suspense, children, createMemo, createRenderEffect, on as on$1, runWithOwner, untrack, Show, createRoot, resetErrorBoundaries } from 'solid-js';
import { renderToString, getRequestEvent, isServer, ssrElement, escape, mergeProps, ssr, renderToStream, createComponent as createComponent$1, ssrHydrationKey, NoHydration, useAssets, Hydration, ssrAttribute, HydrationScript, delegateEvents } from 'solid-js/web';
import { provideRequestEvent } from 'solid-js/web/storage';
import { parse as parse$1, print, Kind, GraphQLError } from '@0no-co/graphql.web';
import { createStore, reconcile } from 'solid-js/store';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode$1(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode$1(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = {};
  const opt = {};
  const dec = opt.decode || decode;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const fieldContentRegExp = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
function serialize$1(name, value, options) {
  const opt = options || {};
  const enc = opt.encode || encodeURIComponent;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  const encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (void 0 !== opt.maxAge && opt.maxAge !== null) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge) || !Number.isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (!isDate(opt.expires) || Number.isNaN(opt.expires.valueOf())) {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.priority) {
    const priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
    switch (priority) {
      case "low": {
        str += "; Priority=Low";
        break;
      }
      case "medium": {
        str += "; Priority=Medium";
        break;
      }
      case "high": {
        str += "; Priority=High";
        break;
      }
      default: {
        throw new TypeError("option priority is invalid");
      }
    }
  }
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true: {
        str += "; SameSite=Strict";
        break;
      }
      case "lax": {
        str += "; SameSite=Lax";
        break;
      }
      case "strict": {
        str += "; SameSite=Strict";
        break;
      }
      case "none": {
        str += "; SameSite=None";
        break;
      }
      default: {
        throw new TypeError("option sameSite is invalid");
      }
    }
  }
  if (opt.partitioned) {
    str += "; Partitioned";
  }
  return str;
}
function isDate(val) {
  return Object.prototype.toString.call(val) === "[object Date]" || val instanceof Date;
}

function parseSetCookie(setCookieValue, options) {
  const parts = (setCookieValue || "").split(";").filter((str) => typeof str === "string" && !!str.trim());
  const nameValuePairStr = parts.shift() || "";
  const parsed = _parseNameValuePair(nameValuePairStr);
  const name = parsed.name;
  let value = parsed.value;
  try {
    value = options?.decode === false ? value : (options?.decode || decodeURIComponent)(value);
  } catch {
  }
  const cookie = {
    name,
    value
  };
  for (const part of parts) {
    const sides = part.split("=");
    const partKey = (sides.shift() || "").trimStart().toLowerCase();
    const partValue = sides.join("=");
    switch (partKey) {
      case "expires": {
        cookie.expires = new Date(partValue);
        break;
      }
      case "max-age": {
        cookie.maxAge = Number.parseInt(partValue, 10);
        break;
      }
      case "secure": {
        cookie.secure = true;
        break;
      }
      case "httponly": {
        cookie.httpOnly = true;
        break;
      }
      case "samesite": {
        cookie.sameSite = partValue;
        break;
      }
      default: {
        cookie[partKey] = partValue;
      }
    }
  }
  return cookie;
}
function _parseNameValuePair(nameValuePairStr) {
  let name = "";
  let value = "";
  const nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("=");
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m$1(e._destroy,t._destroy);}};function _$2(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function m$1(...n){return function(...e){for(const t of n)t(...e);}}const g=_$2();let A$1 = class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}};class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A$1;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}let w$1 = class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}};const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R$1(n={}){const e=new E,t=Array.isArray(n)||H$1(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H$1(n){return typeof n?.entries=="function"}function v$1(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S$2=new Set([101,204,205,304]);async function b$2(n,e){const t=new y,r=new w$1(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R$1(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S$2.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C$2(n,e,t={}){try{const r=await b$2(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v$1(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}
function getRequestIP(event, opts = {}) {
  if (event.context.clientAddress) {
    return event.context.clientAddress;
  }
  if (opts.xForwardedFor) {
    const xForwardedFor = getRequestHeader(event, "x-forwarded-for")?.split(",").shift()?.trim();
    if (xForwardedFor) {
      return xForwardedFor;
    }
  }
  if (event.node.req.socket.remoteAddress) {
    return event.node.req.socket.remoteAddress;
  }
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

function getDistinctCookieKey(name, opts) {
  return [name, opts.domain || "", opts.path || "/"].join(";");
}

function parseCookies(event) {
  return parse(event.node.req.headers.cookie || "");
}
function getCookie(event, name) {
  return parseCookies(event)[name];
}
function setCookie(event, name, value, serializeOptions = {}) {
  if (!serializeOptions.path) {
    serializeOptions = { path: "/", ...serializeOptions };
  }
  const newCookie = serialize$1(name, value, serializeOptions);
  const currentCookies = splitCookiesString(
    event.node.res.getHeader("set-cookie")
  );
  if (currentCookies.length === 0) {
    event.node.res.setHeader("set-cookie", newCookie);
    return;
  }
  const newCookieKey = getDistinctCookieKey(name, serializeOptions);
  event.node.res.removeHeader("set-cookie");
  for (const cookie of currentCookies) {
    const parsed = parseSetCookie(cookie);
    const key = getDistinctCookieKey(parsed.name, parsed);
    if (key === newCookieKey) {
      continue;
    }
    event.node.res.appendHeader("set-cookie", cookie);
  }
  event.node.res.appendHeader("set-cookie", newCookie);
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeaders(event) {
  return event.node.res.getHeaders();
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
const setHeader = setResponseHeader;
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s$1=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch$1 = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController$1 = globalThis.AbortController || i;
createFetch({ fetch: fetch$1, Headers: Headers$1, AbortController: AbortController$1 });

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r="sha256",s="base64url";function digest(t){if(e)return e(r,t,s);const o=createHash(r).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {};



const appConfig$1 = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/"
  },
  "nitro": {
    "routeRules": {
      "/_build/assets/**": {
        "headers": {
          "cache-control": "public, immutable, max-age=31536000"
        }
      }
    }
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  {
    return _sharedRuntimeConfig;
  }
}
_deepFreeze(klona(appConfig$1));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());

const nitroAsyncContext = getContext("nitro-app", {
  asyncContext: true,
  AsyncLocalStorage: AsyncLocalStorage 
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$0 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const appConfig = {"name":"vinxi","routers":[{"name":"public","type":"static","base":"/","dir":"./public","root":"/Users/ddibiase/Projects/urql/examples/with-solid-start","order":0,"outDir":"/Users/ddibiase/Projects/urql/examples/with-solid-start/.vinxi/build/public"},{"name":"ssr","type":"http","link":{"client":"client"},"handler":"src/entry-server.tsx","extensions":["js","jsx","ts","tsx"],"target":"server","root":"/Users/ddibiase/Projects/urql/examples/with-solid-start","base":"/","outDir":"/Users/ddibiase/Projects/urql/examples/with-solid-start/.vinxi/build/ssr","order":1},{"name":"client","type":"client","base":"/_build","handler":"src/entry-client.tsx","extensions":["js","jsx","ts","tsx"],"target":"browser","root":"/Users/ddibiase/Projects/urql/examples/with-solid-start","outDir":"/Users/ddibiase/Projects/urql/examples/with-solid-start/.vinxi/build/client","order":2},{"name":"server-fns","type":"http","base":"/_server","handler":"../node_modules/.pnpm/@solidjs+start@1.2.1_solid-js@1.9.10_vinxi@0.5.10_@types+node@25.0.6_db0@0.3.4_ioredis@_362d1fc25227e0d4b8449a946b3dac13/node_modules/@solidjs/start/dist/runtime/server-handler.js","target":"server","root":"/Users/ddibiase/Projects/urql/examples/with-solid-start","outDir":"/Users/ddibiase/Projects/urql/examples/with-solid-start/.vinxi/build/server-fns","order":3}],"server":{"compressPublicAssets":{"brotli":true},"routeRules":{"/_build/assets/**":{"headers":{"cache-control":"public, immutable, max-age=31536000"}}},"experimental":{"asyncContext":true}},"root":"/Users/ddibiase/Projects/urql/examples/with-solid-start"};
					const buildManifest = {"ssr":{"_urql-solid-start-Cf37Ras6.js":{"file":"assets/urql-solid-start-Cf37Ras6.js","name":"urql-solid-start"},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_urql-solid-start-Cf37Ras6.js"]},"virtual:$vinxi/handler/ssr":{"file":"ssr.js","name":"ssr","src":"virtual:$vinxi/handler/ssr","isEntry":true,"imports":["_urql-solid-start-Cf37Ras6.js"],"dynamicImports":["src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css"]}},"client":{"_urql-solid-start-DXMNIqM_.js":{"file":"assets/urql-solid-start-DXMNIqM_.js","name":"urql-solid-start"},"src/routes/index.tsx?pick=default&pick=$css":{"file":"assets/index-DeFrZL7w.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_urql-solid-start-DXMNIqM_.js"]},"virtual:$vinxi/handler/client":{"file":"assets/client-BBwkmGWL.js","name":"client","src":"virtual:$vinxi/handler/client","isEntry":true,"imports":["_urql-solid-start-DXMNIqM_.js"],"dynamicImports":["src/routes/index.tsx?pick=default&pick=$css"]}},"server-fns":{"_server-fns-1Sq4rmw0.js":{"file":"assets/server-fns-1Sq4rmw0.js","name":"server-fns","dynamicImports":["src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/app.tsx"]},"_urql-solid-start-Ddn6eyMV.js":{"file":"assets/urql-solid-start-Ddn6eyMV.js","name":"urql-solid-start"},"src/app.tsx":{"file":"assets/app-Di3qf0r5.js","name":"app","src":"src/app.tsx","isDynamicEntry":true,"imports":["_server-fns-1Sq4rmw0.js","_urql-solid-start-Ddn6eyMV.js"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_urql-solid-start-Ddn6eyMV.js"]},"virtual:$vinxi/handler/server-fns":{"file":"server-fns.js","name":"server-fns","src":"virtual:$vinxi/handler/server-fns","isEntry":true,"imports":["_server-fns-1Sq4rmw0.js"]}}};

					const routeManifest = {"ssr":{},"client":{},"server-fns":{}};

        function createProdApp(appConfig) {
          return {
            config: { ...appConfig, buildManifest, routeManifest },
            getRouter(name) {
              return appConfig.routers.find(router => router.name === name)
            }
          }
        }

        function plugin$2(app) {
          const prodApp = createProdApp(appConfig);
          globalThis.app = prodApp;
        }

function plugin$1(app) {
	globalThis.$handle = (event) => app.h3App.handler(event);
}

/**
 * Traverses the module graph and collects assets for a given chunk
 *
 * @param {any} manifest Client manifest
 * @param {string} id Chunk id
 * @param {Map<string, string[]>} assetMap Cache of assets
 * @param {string[]} stack Stack of chunk ids to prevent circular dependencies
 * @returns Array of asset URLs
 */
function findAssetsInViteManifest(manifest, id, assetMap = new Map(), stack = []) {
	if (stack.includes(id)) {
		return [];
	}

	const cached = assetMap.get(id);
	if (cached) {
		return cached;
	}
	const chunk = manifest[id];
	if (!chunk) {
		return [];
	}

	const assets = [
		...(chunk.assets?.filter(Boolean) || []),
		...(chunk.css?.filter(Boolean) || [])
	];
	if (chunk.imports) {
		stack.push(id);
		for (let i = 0, l = chunk.imports.length; i < l; i++) {
			assets.push(...findAssetsInViteManifest(manifest, chunk.imports[i], assetMap, stack));
		}
		stack.pop();
	}
	assets.push(chunk.file);
	const all = Array.from(new Set(assets));
	assetMap.set(id, all);

	return all;
}

/** @typedef {import("../app.js").App & { config: { buildManifest: { [key:string]: any } }}} ProdApp */

function createHtmlTagsForAssets(router, app, assets) {
	return assets
		.filter(
			(asset) =>
				asset.endsWith(".css") ||
				asset.endsWith(".js") ||
				asset.endsWith(".mjs"),
		)
		.map((asset) => ({
			tag: "link",
			attrs: {
				href: joinURL(app.config.server.baseURL ?? "/", router.base, asset),
				key: join$1(app.config.server.baseURL ?? "", router.base, asset),
				...(asset.endsWith(".css")
					? { rel: "stylesheet", fetchPriority: "high" }
					: { rel: "modulepreload" }),
			},
		}));
}

/**
 *
 * @param {ProdApp} app
 * @returns
 */
function createProdManifest(app) {
	const manifest = new Proxy(
		{},
		{
			get(target, routerName) {
				invariant(typeof routerName === "string", "Bundler name expected");
				const router = app.getRouter(routerName);
				const bundlerManifest = app.config.buildManifest[routerName];

				invariant(
					router.type !== "static",
					"manifest not available for static router",
				);
				return {
					handler: router.handler,
					async assets() {
						/** @type {{ [key: string]: string[] }} */
						let assets = {};
						assets[router.handler] = await this.inputs[router.handler].assets();
						for (const route of (await router.internals.routes?.getRoutes()) ??
							[]) {
							assets[route.filePath] = await this.inputs[
								route.filePath
							].assets();
						}
						return assets;
					},
					async routes() {
						return (await router.internals.routes?.getRoutes()) ?? [];
					},
					async json() {
						/** @type {{ [key: string]: { output: string; assets: string[]} }} */
						let json = {};
						for (const input of Object.keys(this.inputs)) {
							json[input] = {
								output: this.inputs[input].output.path,
								assets: await this.inputs[input].assets(),
							};
						}
						return json;
					},
					chunks: new Proxy(
						{},
						{
							get(target, chunk) {
								invariant(typeof chunk === "string", "Chunk expected");
								const chunkPath = join$1(
									router.outDir,
									router.base,
									chunk + ".mjs",
								);
								return {
									import() {
										if (globalThis.$$chunks[chunk + ".mjs"]) {
											return globalThis.$$chunks[chunk + ".mjs"];
										}
										return import(
											/* @vite-ignore */ pathToFileURL(chunkPath).href
										);
									},
									output: {
										path: chunkPath,
									},
								};
							},
						},
					),
					inputs: new Proxy(
						{},
						{
							ownKeys(target) {
								const keys = Object.keys(bundlerManifest)
									.filter((id) => bundlerManifest[id].isEntry)
									.map((id) => id);
								return keys;
							},
							getOwnPropertyDescriptor(k) {
								return {
									enumerable: true,
									configurable: true,
								};
							},
							get(target, input) {
								invariant(typeof input === "string", "Input expected");
								if (router.target === "server") {
									const id =
										input === router.handler
											? virtualId(handlerModule(router))
											: input;
									return {
										assets() {
											return createHtmlTagsForAssets(
												router,
												app,
												findAssetsInViteManifest(bundlerManifest, id),
											);
										},
										output: {
											path: join$1(
												router.outDir,
												router.base,
												bundlerManifest[id].file,
											),
										},
									};
								} else if (router.target === "browser") {
									const id =
										input === router.handler && !input.endsWith(".html")
											? virtualId(handlerModule(router))
											: input;
									return {
										import() {
											return import(
												/* @vite-ignore */ joinURL(
													app.config.server.baseURL ?? "",
													router.base,
													bundlerManifest[id].file,
												)
											);
										},
										assets() {
											return createHtmlTagsForAssets(
												router,
												app,
												findAssetsInViteManifest(bundlerManifest, id),
											);
										},
										output: {
											path: joinURL(
												app.config.server.baseURL ?? "",
												router.base,
												bundlerManifest[id].file,
											),
										},
									};
								}
							},
						},
					),
				};
			},
		},
	);

	return manifest;
}

function plugin() {
	globalThis.MANIFEST =
		createProdManifest(globalThis.app)
			;
}

const chunks = {};
			 



			 function app() {
				 globalThis.$$chunks = chunks;
			 }

const plugins = [
  plugin$2,
plugin$1,
plugin,
app
];

const assets = {
  "/_build/.vite/manifest.json": {
    "type": "application/json",
    "etag": "\"2d5-ACIN2/EiU5imCP+TlplFaMa/z/I\"",
    "mtime": "2026-01-11T14:46:44.459Z",
    "size": 725,
    "path": "../public/_build/.vite/manifest.json"
  },
  "/_build/assets/client-BBwkmGWL.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"5301-UhBsPljYOSUA8f/9Aen+H+afi/s\"",
    "mtime": "2026-01-11T14:46:44.459Z",
    "size": 21249,
    "path": "../public/_build/assets/client-BBwkmGWL.js"
  },
  "/_build/assets/client-BBwkmGWL.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"1f11-+biGgjsTWTaEMAWmVGl9gVNxNak\"",
    "mtime": "2026-01-11T14:46:44.497Z",
    "size": 7953,
    "path": "../public/_build/assets/client-BBwkmGWL.js.br"
  },
  "/_build/assets/client-BBwkmGWL.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"2268-igqDhibyeLIY5pKQnmIQ9VhLupU\"",
    "mtime": "2026-01-11T14:46:44.496Z",
    "size": 8808,
    "path": "../public/_build/assets/client-BBwkmGWL.js.gz"
  },
  "/_build/assets/index-DeFrZL7w.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"4a7-dbv/M3XQmb5B3NlHLz0sF17pGSg\"",
    "mtime": "2026-01-11T14:46:44.496Z",
    "size": 1191,
    "path": "../public/_build/assets/index-DeFrZL7w.js.br"
  },
  "/_build/assets/index-DeFrZL7w.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"b9c-7rOgmzX4sl6/rOAhFtZVEdtEI+o\"",
    "mtime": "2026-01-11T14:46:44.459Z",
    "size": 2972,
    "path": "../public/_build/assets/index-DeFrZL7w.js"
  },
  "/_build/assets/index-DeFrZL7w.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"575-QZr+T10dbeB7xi0yb43HT47Ej1w\"",
    "mtime": "2026-01-11T14:46:44.496Z",
    "size": 1397,
    "path": "../public/_build/assets/index-DeFrZL7w.js.gz"
  },
  "/_build/assets/urql-solid-start-DXMNIqM_.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"50a7-fIYFZkUvmYFUzTndpFjgEfE9CXo\"",
    "mtime": "2026-01-11T14:46:44.542Z",
    "size": 20647,
    "path": "../public/_build/assets/urql-solid-start-DXMNIqM_.js.br"
  },
  "/_build/assets/urql-solid-start-DXMNIqM_.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"fba1-TxJnbTLoUxglDYfY/0eIlxcN910\"",
    "mtime": "2026-01-11T14:46:44.459Z",
    "size": 64417,
    "path": "../public/_build/assets/urql-solid-start-DXMNIqM_.js"
  },
  "/_build/assets/urql-solid-start-DXMNIqM_.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"5be7-7qENSvSPvV/9on3cq5iJkeJKbCg\"",
    "mtime": "2026-01-11T14:46:44.504Z",
    "size": 23527,
    "path": "../public/_build/assets/urql-solid-start-DXMNIqM_.js.gz"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _tzRcST = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
function _e$2(e, t) {
  const n = (e || "").split(";").filter((u) => typeof u == "string" && !!u.trim()), r = n.shift() || "", s = Oe$2(r), i = s.name;
  let a = s.value;
  try {
    a = (t == null ? void 0 : t.decode) === false ? a : ((t == null ? void 0 : t.decode) || decodeURIComponent)(a);
  } catch {
  }
  const o = { name: i, value: a };
  for (const u of n) {
    const l = u.split("="), d = (l.shift() || "").trimStart().toLowerCase(), h = l.join("=");
    switch (d) {
      case "expires": {
        o.expires = new Date(h);
        break;
      }
      case "max-age": {
        o.maxAge = Number.parseInt(h, 10);
        break;
      }
      case "secure": {
        o.secure = true;
        break;
      }
      case "httponly": {
        o.httpOnly = true;
        break;
      }
      case "samesite": {
        o.sameSite = h;
        break;
      }
      default:
        o[d] = h;
    }
  }
  return o;
}
function Oe$2(e) {
  let t = "", n = "";
  const r = e.split("=");
  return r.length > 1 ? (t = r.shift(), n = r.join("=")) : n = e, { name: t, value: n };
}
function Ie$1(e = {}) {
  let t, n = false;
  const r = (a) => {
    if (t && t !== a) throw new Error("Context conflict");
  };
  let s;
  if (e.asyncContext) {
    const a = e.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    a ? s = new a() : console.warn("[unctx] `AsyncLocalStorage` is not provided.");
  }
  const i = () => {
    if (s) {
      const a = s.getStore();
      if (a !== void 0) return a;
    }
    return t;
  };
  return { use: () => {
    const a = i();
    if (a === void 0) throw new Error("Context is not available");
    return a;
  }, tryUse: () => i(), set: (a, o) => {
    o || r(a), t = a, n = true;
  }, unset: () => {
    t = void 0, n = false;
  }, call: (a, o) => {
    r(a), t = a;
    try {
      return s ? s.run(a, o) : o();
    } finally {
      n || (t = void 0);
    }
  }, async callAsync(a, o) {
    t = a;
    const u = () => {
      t = a;
    }, l = () => t === a ? u : void 0;
    W$2.add(l);
    try {
      const d = s ? s.run(a, o) : o();
      return n || (t = void 0), await d;
    } finally {
      W$2.delete(l);
    }
  } };
}
function De$1(e = {}) {
  const t = {};
  return { get(n, r = {}) {
    return t[n] || (t[n] = Ie$1({ ...e, ...r })), t[n];
  } };
}
const b$1 = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof global < "u" ? global : {}, j$2 = "__unctx__", Fe$2 = b$1[j$2] || (b$1[j$2] = De$1()), Me$1 = (e, t = {}) => Fe$2.get(e, t), U$1 = "__unctx_async_handlers__", W$2 = b$1[U$1] || (b$1[U$1] = /* @__PURE__ */ new Set());
function je$1(e) {
  let t;
  const n = te$2(e), r = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(n, { ...r, body: e.node.req.body }) : new Request(n, { ...r, get body() {
    return t || (t = Ye$1(e), t);
  } });
}
function Ue$2(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: je$1(e), url: te$2(e) }, e.web.request;
}
function We$2() {
  return tt$1();
}
const ee$2 = /* @__PURE__ */ Symbol("$HTTPEvent");
function Be$2(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[ee$2]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function f(e) {
  return function(...t) {
    var _a;
    let n = t[0];
    if (Be$2(n)) t[0] = n instanceof H3Event || n.__is_event__ ? n : n[ee$2];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (n = We$2(), !n) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      t.unshift(n);
    }
    return e(...t);
  };
}
const te$2 = f(getRequestURL), Xe$1 = f(getRequestIP), v = f(setResponseStatus), B$1 = f(getResponseStatus), ze$1 = f(getResponseStatusText), w = f(getResponseHeaders), X$2 = f(getResponseHeader), Je$1 = f(setResponseHeader), ne$2 = f(appendResponseHeader), Ke$2 = f(parseCookies), Ve$1 = f(getCookie), Ge$1 = f(setCookie), S$1 = f(setHeader), Ye$1 = f(getRequestWebStream), Qe = f(removeResponseHeader), Ze$1 = f(Ue$2);
function et$1() {
  var _a;
  return Me$1("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function tt$1() {
  return et$1().use().event;
}
const C$1 = "Invariant Violation", { setPrototypeOf: nt$1 = function(e, t) {
  return e.__proto__ = t, e;
} } = Object;
class I extends Error {
  constructor(t = C$1) {
    super(typeof t == "number" ? `${C$1}: ${t} (see https://github.com/apollographql/invariant-packages)` : t);
    __publicField$1(this, "framesToPop", 1);
    __publicField$1(this, "name", C$1);
    nt$1(this, I.prototype);
  }
}
function rt$1(e, t) {
  if (!e) throw new I(t);
}
const x = "solidFetchEvent";
function st$1(e) {
  return { request: Ze$1(e), response: ct$1(e), clientAddress: Xe$1(e), locals: {}, nativeEvent: e };
}
function ot$1(e) {
  return { ...e };
}
function at$1(e) {
  if (!e.context[x]) {
    const t = st$1(e);
    e.context[x] = t;
  }
  return e.context[x];
}
function z$1(e, t) {
  for (const [n, r] of t.entries()) ne$2(e, n, r);
}
let it$1 = class it {
  constructor(t) {
    __publicField$1(this, "event");
    this.event = t;
  }
  get(t) {
    const n = X$2(this.event, t);
    return Array.isArray(n) ? n.join(", ") : n || null;
  }
  has(t) {
    return this.get(t) !== null;
  }
  set(t, n) {
    return Je$1(this.event, t, n);
  }
  delete(t) {
    return Qe(this.event, t);
  }
  append(t, n) {
    ne$2(this.event, t, n);
  }
  getSetCookie() {
    const t = X$2(this.event, "Set-Cookie");
    return Array.isArray(t) ? t : [t];
  }
  forEach(t) {
    return Object.entries(w(this.event)).forEach(([n, r]) => t(Array.isArray(r) ? r.join(", ") : r, n, this));
  }
  entries() {
    return Object.entries(w(this.event)).map(([t, n]) => [t, Array.isArray(n) ? n.join(", ") : n])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(w(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(w(this.event)).map((t) => Array.isArray(t) ? t.join(", ") : t)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
};
function ct$1(e) {
  return { get status() {
    return B$1(e);
  }, set status(t) {
    v(e, t);
  }, get statusText() {
    return ze$1(e);
  }, set statusText(t) {
    v(e, B$1(e), t);
  }, headers: new it$1(e) };
}
const m = { NORMAL: 0, WILDCARD: 1, PLACEHOLDER: 2 };
function lt$1(e = {}) {
  const t = { options: e, rootNode: re$1(), staticRoutesMap: {} }, n = (r) => e.strictTrailingSlash ? r : r.replace(/\/$/, "") || "/";
  if (e.routes) for (const r in e.routes) J$2(t, n(r), e.routes[r]);
  return { ctx: t, lookup: (r) => ut$1(t, n(r)), insert: (r, s) => J$2(t, n(r), s), remove: (r) => dt$1(t, n(r)) };
}
function ut$1(e, t) {
  const n = e.staticRoutesMap[t];
  if (n) return n.data;
  const r = t.split("/"), s = {};
  let i = false, a = null, o = e.rootNode, u = null;
  for (let l = 0; l < r.length; l++) {
    const d = r[l];
    o.wildcardChildNode !== null && (a = o.wildcardChildNode, u = r.slice(l).join("/"));
    const h = o.children.get(d);
    if (h === void 0) {
      if (o && o.placeholderChildren.length > 1) {
        const g = r.length - l;
        o = o.placeholderChildren.find((c) => c.maxDepth === g) || null;
      } else o = o.placeholderChildren[0] || null;
      if (!o) break;
      o.paramName && (s[o.paramName] = d), i = true;
    } else o = h;
  }
  return (o === null || o.data === null) && a !== null && (o = a, s[o.paramName || "_"] = u, i = true), o ? i ? { ...o.data, params: i ? s : void 0 } : o.data : null;
}
function J$2(e, t, n) {
  let r = true;
  const s = t.split("/");
  let i = e.rootNode, a = 0;
  const o = [i];
  for (const u of s) {
    let l;
    if (l = i.children.get(u)) i = l;
    else {
      const d = ft$1(u);
      l = re$1({ type: d, parent: i }), i.children.set(u, l), d === m.PLACEHOLDER ? (l.paramName = u === "*" ? `_${a++}` : u.slice(1), i.placeholderChildren.push(l), r = false) : d === m.WILDCARD && (i.wildcardChildNode = l, l.paramName = u.slice(3) || "_", r = false), o.push(l), i = l;
    }
  }
  for (const [u, l] of o.entries()) l.maxDepth = Math.max(o.length - u, l.maxDepth || 0);
  return i.data = n, r === true && (e.staticRoutesMap[t] = i), i;
}
function dt$1(e, t) {
  let n = false;
  const r = t.split("/");
  let s = e.rootNode;
  for (const i of r) if (s = s.children.get(i), !s) return n;
  if (s.data) {
    const i = r.at(-1) || "";
    s.data = null, Object.keys(s.children).length === 0 && s.parent && (s.parent.children.delete(i), s.parent.wildcardChildNode = null, s.parent.placeholderChildren = []), n = true;
  }
  return n;
}
function re$1(e = {}) {
  return { type: e.type || m.NORMAL, maxDepth: 0, parent: e.parent || null, children: /* @__PURE__ */ new Map(), data: e.data || null, paramName: e.paramName || null, wildcardChildNode: null, placeholderChildren: [] };
}
function ft$1(e) {
  return e.startsWith("**") ? m.WILDCARD : e[0] === ":" || e === "*" ? m.PLACEHOLDER : m.NORMAL;
}
const se$1 = [{ page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index.mjs'), import: () => import('../build/index.mjs') }, path: "/", filePath: "/Users/ddibiase/Projects/urql/examples/with-solid-start/src/routes/index.tsx" }], pt$1 = ht$1(se$1.filter((e) => e.page));
function ht$1(e) {
  function t(n, r, s, i) {
    const a = Object.values(n).find((o) => s.startsWith(o.id + "/"));
    return a ? (t(a.children || (a.children = []), r, s.slice(a.id.length)), n) : (n.push({ ...r, id: s, path: s.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), n);
  }
  return e.sort((n, r) => n.path.length - r.path.length).reduce((n, r) => t(n, r, r.path, r.path), []);
}
function gt$1(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
lt$1({ routes: se$1.reduce((e, t) => {
  if (!gt$1(t)) return e;
  let n = t.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (r, s) => `**:${s}`).split("/").map((r) => r.startsWith(":") || r.startsWith("*") ? r : encodeURIComponent(r)).join("/");
  if (/:[^/]*\?/g.test(n)) throw new Error(`Optional parameters are not supported in API routes: ${n}`);
  if (e[n]) throw new Error(`Duplicate API routes for "${n}" found at "${e[n].route.path}" and "${t.path}"`);
  return e[n] = { route: t }, e;
}, {}) });
var yt$1 = " ";
const Rt$1 = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(yt$1), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function wt$1(e, t) {
  let { tag: n, attrs: { key: r, ...s } = { key: void 0 }, children: i } = e;
  return Rt$1[n]({ attrs: { ...s, nonce: t }, key: r, children: i });
}
function St$1(e, t, n, r = "default") {
  return lazy(async () => {
    var _a;
    {
      const i = (await e.import())[r], o = (await ((_a = t.inputs) == null ? void 0 : _a[e.src].assets())).filter((l) => l.tag === "style" || l.attrs.rel === "stylesheet");
      return { default: (l) => [...o.map((d) => wt$1(d)), createComponent(i, l)] };
    }
  });
}
function oe() {
  function e(n) {
    return { ...n, ...n.$$route ? n.$$route.require().route : void 0, info: { ...n.$$route ? n.$$route.require().route.info : {}, filesystem: true }, component: n.$component && St$1(n.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: n.children ? n.children.map(e) : void 0 };
  }
  return pt$1.map(e);
}
let K$1;
const Ot$1 = isServer ? () => getRequestEvent().routes : () => K$1 || (K$1 = oe());
function bt$1(e) {
  const t = Ve$1(e.nativeEvent, "flash");
  if (t) try {
    let n = JSON.parse(t);
    if (!n || !n.result) return;
    const r = [...n.input.slice(0, -1), new Map(n.input[n.input.length - 1])], s = n.error ? new Error(n.result) : n.result;
    return { input: r, url: n.url, pending: false, result: n.thrown ? void 0 : s, error: n.thrown ? s : void 0 };
  } catch (n) {
    console.error(n);
  } finally {
    Ge$1(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function vt$1(e) {
  const t = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await t.json(), assets: [...await t.inputs[t.handler].assets()], router: { submission: bt$1(e) }, routes: oe(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const Ct$1 = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function xt$1(e) {
  return e.status && Ct$1.has(e.status) ? e.status : 302;
}
const $t = {};
function At(e) {
  const t = new TextEncoder().encode(e), n = t.length, r = n.toString(16), s = "00000000".substring(0, 8 - r.length) + r, i = new TextEncoder().encode(`;0x${s};`), a = new Uint8Array(12 + n);
  return a.set(i), a.set(t, 12), a;
}
function V$2(e, t) {
  return new ReadableStream({ start(n) {
    crossSerializeStream(t, { scopeId: e, plugins: [CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin], onSerialize(r, s) {
      n.enqueue(At(s ? `(${getCrossReferenceHeader(e)},${r})` : r));
    }, onDone() {
      n.close();
    }, onError(r) {
      n.error(r);
    } });
  } });
}
async function Et$1(e) {
  const t = at$1(e), n = t.request, r = n.headers.get("X-Server-Id"), s = n.headers.get("X-Server-Instance"), i = n.headers.has("X-Single-Flight"), a = new URL(n.url);
  let o, u;
  if (r) rt$1(typeof r == "string", "Invalid server function"), [o, u] = r.split("#");
  else if (o = a.searchParams.get("id"), u = a.searchParams.get("name"), !o || !u) return new Response(null, { status: 404 });
  const l = $t[o];
  let d;
  if (!l) return new Response(null, { status: 404 });
  d = await l.importer();
  const h = d[l.functionName];
  let g = [];
  if (!s || e.method === "GET") {
    const c = a.searchParams.get("args");
    if (c) {
      const p = JSON.parse(c);
      (p.t ? fromJSON(p, { plugins: [CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin] }) : p).forEach((y) => g.push(y));
    }
  }
  if (e.method === "POST") {
    const c = n.headers.get("content-type"), p = e.node.req, y = p instanceof ReadableStream, ae = p.body instanceof ReadableStream, D = y && p.locked || ae && p.body.locked, F = y ? p : p.body;
    if ((c == null ? void 0 : c.startsWith("multipart/form-data")) || (c == null ? void 0 : c.startsWith("application/x-www-form-urlencoded"))) g.push(await (D ? n : new Request(n, { ...n, body: F })).formData());
    else if (c == null ? void 0 : c.startsWith("application/json")) {
      const ie = D ? n : new Request(n, { ...n, body: F });
      g = fromJSON(await ie.json(), { plugins: [CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin] });
    }
  }
  try {
    let c = await provideRequestEvent(t, async () => (sharedConfig.context = { event: t }, t.locals.serverFunctionMeta = { id: o + "#" + u }, h(...g)));
    if (i && s && (c = await Y$2(t, c)), c instanceof Response) {
      if (c.headers && c.headers.has("X-Content-Raw")) return c;
      s && (c.headers && z$1(e, c.headers), c.status && (c.status < 300 || c.status >= 400) && v(e, c.status), c.customBody ? c = await c.customBody() : c.body == null && (c = null));
    }
    return s ? (S$1(e, "content-type", "text/javascript"), V$2(s, c)) : G$1(c, n, g);
  } catch (c) {
    if (c instanceof Response) i && s && (c = await Y$2(t, c)), c.headers && z$1(e, c.headers), c.status && (!s || c.status < 300 || c.status >= 400) && v(e, c.status), c.customBody ? c = c.customBody() : c.body == null && (c = null), S$1(e, "X-Error", "true");
    else if (s) {
      const p = c instanceof Error ? c.message : typeof c == "string" ? c : "true";
      S$1(e, "X-Error", p.replace(/[\r\n]+/g, ""));
    } else c = G$1(c, n, g, true);
    return s ? (S$1(e, "content-type", "text/javascript"), V$2(s, c)) : c;
  }
}
function G$1(e, t, n, r) {
  const s = new URL(t.url), i = e instanceof Error;
  let a = 302, o;
  return e instanceof Response ? (o = new Headers(e.headers), e.headers.has("Location") && (o.set("Location", new URL(e.headers.get("Location"), s.origin + "").toString()), a = xt$1(e))) : o = new Headers({ Location: new URL(t.headers.get("referer")).toString() }), e && o.append("Set-Cookie", `flash=${encodeURIComponent(JSON.stringify({ url: s.pathname + s.search, result: i ? e.message : e, thrown: r, error: i, input: [...n.slice(0, -1), [...n[n.length - 1].entries()]] }))}; Secure; HttpOnly;`), new Response(null, { status: a, headers: o });
}
let $$1;
function Tt$1(e) {
  var _a;
  const t = new Headers(e.request.headers), n = Ke$2(e.nativeEvent), r = e.response.headers.getSetCookie();
  t.delete("cookie");
  let s = false;
  return ((_a = e.nativeEvent.node) == null ? void 0 : _a.req) && (s = true, e.nativeEvent.node.req.headers.cookie = ""), r.forEach((i) => {
    if (!i) return;
    const { maxAge: a, expires: o, name: u, value: l } = _e$2(i);
    if (a != null && a <= 0) {
      delete n[u];
      return;
    }
    if (o != null && o.getTime() <= Date.now()) {
      delete n[u];
      return;
    }
    n[u] = l;
  }), Object.entries(n).forEach(([i, a]) => {
    t.append("cookie", `${i}=${a}`), s && (e.nativeEvent.node.req.headers.cookie += `${i}=${a};`);
  }), t;
}
async function Y$2(e, t) {
  let n, r = new URL(e.request.headers.get("referer")).toString();
  t instanceof Response && (t.headers.has("X-Revalidate") && (n = t.headers.get("X-Revalidate").split(",")), t.headers.has("Location") && (r = new URL(t.headers.get("Location"), new URL(e.request.url).origin + "").toString()));
  const s = ot$1(e);
  return s.request = new Request(r, { headers: Tt$1(e) }), await provideRequestEvent(s, async () => {
    await vt$1(s), $$1 || ($$1 = (await import('../build/app-Di3qf0r5.mjs')).default), s.router.dataOnly = n || true, s.router.previousUrl = e.request.headers.get("referer");
    try {
      renderToString(() => {
        sharedConfig.context.event = s, $$1();
      });
    } catch (o) {
      console.log(o);
    }
    const i = s.router.data;
    if (!i) return t;
    let a = false;
    for (const o in i) i[o] === void 0 ? delete i[o] : a = true;
    return a && (t instanceof Response ? t.customBody && (i._$value = t.customBody()) : (i._$value = t, t = new Response(null, { status: 200 })), t.customBody = () => i, t.headers.set("X-Single-Flight", "true")), t;
  });
}
const It$1 = eventHandler(Et$1);

var Oe$1 = () => {
}, O = Oe$1;
function N(e2) {
  return { tag: 0, 0: e2 };
}
function C(e2) {
  return { tag: 1, 0: e2 };
}
var Fe$1 = (e2) => e2;
function b(e2) {
  return (t) => (r) => {
    var a = O;
    t(((n) => {
      n === 0 ? r(0) : n.tag === 0 ? (a = n[0], r(n)) : e2(n[0]) ? r(n) : a(0);
    }));
  };
}
function F(e2) {
  return (t) => (r) => t(((a) => {
    a === 0 || a.tag === 0 ? r(a) : r(C(e2(a[0])));
  }));
}
function Ne$1(e2) {
  return (t) => (r) => {
    var a = [], n = O, i = false, s = false;
    t(((u) => {
      s || (u === 0 ? (s = true, a.length || r(0)) : u.tag === 0 ? n = u[0] : (i = false, (function(o) {
        var l = O;
        o(((p) => {
          if (p === 0) {
            if (a.length) {
              var d = a.indexOf(l);
              d > -1 && (a = a.slice()).splice(d, 1), a.length || (s ? r(0) : i || (i = true, n(0)));
            }
          } else p.tag === 0 ? (a.push(l = p[0]), l(0)) : a.length && (r(p), l(0));
        }));
      })(e2(u[0])), i || (i = true, n(0))));
    })), r(N(((u) => {
      if (u === 1) {
        s || (s = true, n(1));
        for (var v = 0, o = a, l = a.length; v < l; v++) o[v](1);
        a.length = 0;
      } else {
        !s && !i ? (i = true, n(0)) : i = false;
        for (var p = 0, d = a, m = a.length; p < m; p++) d[p](0);
      }
    })));
  };
}
function $e(e2) {
  return Ne$1(Fe$1)(e2);
}
function j$1(e2) {
  return $e(Ue$1(e2));
}
function qe$1(e2) {
  return (t) => (r) => {
    var a = false;
    t(((n) => {
      if (!a) if (n === 0) a = true, r(0), e2();
      else if (n.tag === 0) {
        var i = n[0];
        r(N(((s) => {
          s === 1 ? (a = true, i(1), e2()) : i(s);
        })));
      } else r(n);
    }));
  };
}
function ae$1(e2) {
  return (t) => (r) => {
    var a = false;
    t(((n) => {
      if (!a) if (n === 0) a = true, r(0);
      else if (n.tag === 0) {
        var i = n[0];
        r(N(((s) => {
          s === 1 && (a = true), i(s);
        })));
      } else e2(n[0]), r(n);
    }));
  };
}
function fe$1(e2) {
  return (t) => (r) => t(((a) => {
    a === 0 ? r(0) : a.tag === 0 ? (r(a), e2()) : r(a);
  }));
}
function D$1(e2) {
  var t = [], r = O, a = false;
  return (n) => {
    t.push(n), t.length === 1 && e2(((i) => {
      if (i === 0) {
        for (var s = 0, u = t, v = t.length; s < v; s++) u[s](0);
        t.length = 0;
      } else if (i.tag === 0) r = i[0];
      else {
        a = false;
        for (var o = 0, l = t, p = t.length; o < p; o++) l[o](i);
      }
    })), n(N(((i) => {
      if (i === 1) {
        var s = t.indexOf(n);
        s > -1 && (t = t.slice()).splice(s, 1), t.length || r(1);
      } else a || (a = true, r(0));
    })));
  };
}
function ue(e2) {
  return (t) => (r) => {
    var a = O, n = O, i = false, s = false, u = false, v = false;
    t(((o) => {
      v || (o === 0 ? (v = true, u || r(0)) : o.tag === 0 ? a = o[0] : (u && (n(1), n = O), i ? i = false : (i = true, a(0)), (function(p) {
        u = true, p(((d) => {
          u && (d === 0 ? (u = false, v ? r(0) : i || (i = true, a(0))) : d.tag === 0 ? (s = false, (n = d[0])(0)) : (r(d), s ? s = false : n(0)));
        }));
      })(e2(o[0]))));
    })), r(N(((o) => {
      o === 1 ? (v || (v = true, a(1)), u && (u = false, n(1))) : (!v && !i && (i = true, a(0)), u && !s && (s = true, n(0)));
    })));
  };
}
function ne$1(e2) {
  return (t) => (r) => {
    var a = O, n = false, i = 0;
    t(((s) => {
      n || (s === 0 ? (n = true, r(0)) : s.tag === 0 ? a = s[0] : i++ < e2 ? (r(s), !n && i >= e2 && (n = true, r(0), a(1))) : r(s));
    })), r(N(((s) => {
      s === 1 && !n ? (n = true, a(1)) : s === 0 && !n && i < e2 && a(0);
    })));
  };
}
function Se$1(e2) {
  return (t) => (r) => {
    var a = O, n = O, i = false;
    t(((s) => {
      i || (s === 0 ? (i = true, n(1), r(0)) : s.tag === 0 ? (a = s[0], e2(((u) => {
        u === 0 || (u.tag === 0 ? (n = u[0])(0) : (i = true, n(1), a(1), r(0)));
      }))) : r(s));
    })), r(N(((s) => {
      s === 1 && !i ? (i = true, a(1), n(1)) : i || a(0);
    })));
  };
}
function Ge(e2, t) {
  return (r) => (a) => {
    var n = O, i = false;
    r(((s) => {
      i || (s === 0 ? (i = true, a(0)) : s.tag === 0 ? (n = s[0], a(s)) : e2(s[0]) ? a(s) : (i = true, a(s), a(0), n(1)));
    }));
  };
}
function Je(e2) {
  return (t) => e2()(t);
}
function Ee(e2) {
  return (t) => {
    var r = e2[Symbol.asyncIterator](), a = false, n = false, i = false, s;
    t(N((async (u) => {
      if (u === 1) a = true, r.return && r.return();
      else if (n) i = true;
      else {
        for (i = n = true; i && !a; ) if ((s = await r.next()).done) a = true, r.return && await r.return(), t(0);
        else try {
          i = false, t(C(s.value));
        } catch (v) {
          if (r.throw) (a = !!(await r.throw(v)).done) && t(0);
          else throw v;
        }
        n = false;
      }
    })));
  };
}
function Be$1(e2) {
  return e2[Symbol.asyncIterator] ? Ee(e2) : (t) => {
    var r = e2[Symbol.iterator](), a = false, n = false, i = false, s;
    t(N(((u) => {
      if (u === 1) a = true, r.return && r.return();
      else if (n) i = true;
      else {
        for (i = n = true; i && !a; ) if ((s = r.next()).done) a = true, r.return && r.return(), t(0);
        else try {
          i = false, t(C(s.value));
        } catch (v) {
          if (r.throw) (a = !!r.throw(v).done) && t(0);
          else throw v;
        }
        n = false;
      }
    })));
  };
}
var Ue$1 = Be$1;
function K(e2) {
  return (t) => {
    var r = false;
    t(N(((a) => {
      a === 1 ? r = true : r || (r = true, t(C(e2)), t(0));
    })));
  };
}
function ze(e2) {
  return (t) => {
    var r = false, a = e2({ next(n) {
      r || t(C(n));
    }, complete() {
      r || (r = true, t(0));
    } });
    t(N(((n) => {
      n === 1 && !r && (r = true, a());
    })));
  };
}
function He$1() {
  var e2, t;
  return { source: D$1(ze(((r) => (e2 = r.next, t = r.complete, Oe$1)))), next(r) {
    e2 && e2(r);
  }, complete() {
    t && t();
  } };
}
function ie(e2) {
  return (t) => {
    var r = O, a = false;
    return t(((n) => {
      n === 0 ? a = true : n.tag === 0 ? (r = n[0])(0) : a || (e2(n[0]), r(0));
    })), { unsubscribe() {
      a || (a = true, r(1));
    } };
  };
}
function We$1(e2) {
  ie(((t) => {
  }))(e2);
}
function Pe(e2) {
  return new Promise(((t) => {
    var r = O, a;
    e2(((n) => {
      n === 0 ? Promise.resolve(a).then(t) : n.tag === 0 ? (r = n[0])(0) : (a = n[0], r(0));
    }));
  }));
}
var Ke$1 = (e2) => e2 && typeof e2.message == "string" && (e2.extensions || e2.name === "GraphQLError") ? e2 : typeof e2 == "object" && typeof e2.message == "string" ? new GraphQLError(e2.message, e2.nodes, e2.source, e2.positions, e2.path, e2, e2.extensions || {}) : new GraphQLError(e2);
class se extends Error {
  constructor(t) {
    var r = (t.graphQLErrors || []).map(Ke$1), a = ((n, i) => {
      var s = "";
      if (n) return `[Network] ${n.message}`;
      if (i) for (var u = 0, v = i.length; u < v; u++) s && (s += `
`), s += `[GraphQL] ${i[u].message}`;
      return s;
    })(t.networkError, r);
    super(a), this.name = "CombinedError", this.message = a, this.graphQLErrors = r, this.networkError = t.networkError, this.response = t.response;
  }
  toString() {
    return this.message;
  }
}
var $ = (e2, t) => {
  for (var r = 0 | (t || 5381), a = 0, n = 0 | e2.length; a < n; a++) r = (r << 5) + r + e2.charCodeAt(a);
  return r;
}, _$1 = /* @__PURE__ */ new Set(), le = /* @__PURE__ */ new WeakMap(), A = (e2, t) => {
  if (e2 === null || _$1.has(e2)) return "null";
  if (typeof e2 != "object") return JSON.stringify(e2) || "";
  if (e2.toJSON) return A(e2.toJSON(), t);
  if (Array.isArray(e2)) {
    for (var r = "[", a = 0, n = e2.length; a < n; a++) r.length > 1 && (r += ","), r += A(e2[a], t) || "null";
    return r += "]";
  } else if (!t && (B !== M && e2 instanceof B || U !== M && e2 instanceof U)) return "null";
  var i = Object.keys(e2).sort();
  if (!i.length && e2.constructor && Object.getPrototypeOf(e2).constructor !== Object.prototype.constructor) {
    var s = le.get(e2) || Math.random().toString(36).slice(2);
    return le.set(e2, s), A({ __key: s }, t);
  }
  _$1.add(e2);
  for (var u = "{", v = 0, o = i.length; v < o; v++) {
    var l = A(e2[i[v]], t);
    l && (u.length > 1 && (u += ","), u += A(i[v], t) + ":" + l);
  }
  return _$1.delete(e2), u += "}";
}, Y$1 = (e2, t, r) => {
  if (!(r == null || typeof r != "object" || r.toJSON || _$1.has(r))) if (Array.isArray(r)) for (var a = 0, n = r.length; a < n; a++) Y$1(e2, `${t}.${a}`, r[a]);
  else if (r instanceof B || r instanceof U) e2.set(t, r);
  else {
    _$1.add(r);
    for (var i in r) Y$1(e2, `${t}.${i}`, r[i]);
  }
}, J$1 = (e2, t) => (_$1.clear(), A(e2, t || false));
class M {
}
var B = typeof File < "u" ? File : M, U = typeof Blob < "u" ? Blob : M, Ve = /("{3}[\s\S]*"{3}|"(?:\\.|[^"])*")/g, Ye = /(?:#[^\n\r]+)?(?:[\r\n]+|$)/g, Xe = (e2, t) => t % 2 == 0 ? e2.replace(Ye, `
`) : e2, ce = (e2) => e2.split(Ve).map(Xe).join("").trim(), ve$1 = /* @__PURE__ */ new Map(), G = /* @__PURE__ */ new Map(), W$1 = (e2) => {
  var t;
  return typeof e2 == "string" ? t = ce(e2) : e2.loc && G.get(e2.__key) === e2 ? t = e2.loc.source.body : (t = ve$1.get(e2) || ce(print(e2)), ve$1.set(e2, t)), typeof e2 != "string" && !e2.loc && (e2.loc = { start: 0, end: t.length, source: { body: t, name: "gql", locationOffset: { line: 1, column: 1 } } }), t;
}, de$1 = (e2) => {
  var t;
  if (e2.documentId) t = $(e2.documentId);
  else if (t = $(W$1(e2)), e2.definitions) {
    var r = _e$1(e2);
    r && (t = $(`
# ${r}`, t));
  }
  return t;
}, z = (e2) => {
  var t, r;
  return typeof e2 == "string" ? (t = de$1(e2), r = G.get(t) || parse$1(e2, { noLocation: true })) : (t = e2.__key || de$1(e2), r = G.get(t) || e2), r.loc || W$1(r), r.__key = t, G.set(t, r), r;
}, R = (e2, t, r) => {
  var a = t || {}, n = z(e2), i = J$1(a, true), s = n.__key;
  return i !== "{}" && (s = $(i, s)), { key: s, query: n, variables: a, extensions: r };
}, _e$1 = (e2) => {
  for (var t = 0, r = e2.definitions.length; t < r; t++) {
    var a = e2.definitions[t];
    if (a.kind === Kind.OPERATION_DEFINITION) return a.name ? a.name.value : void 0;
  }
}, X$1 = (e2, t, r) => {
  if (!("data" in t || "errors" in t && Array.isArray(t.errors))) throw new Error("No Content");
  var a = e2.kind === "subscription";
  return { operation: e2, data: t.data, error: Array.isArray(t.errors) ? new se({ graphQLErrors: t.errors, response: r }) : void 0, extensions: t.extensions ? { ...t.extensions } : void 0, hasNext: t.hasNext == null ? a : t.hasNext, stale: false };
}, H = (e2, t) => {
  if (typeof e2 == "object" && e2 != null) {
    if (Array.isArray(e2)) {
      e2 = [...e2];
      for (var r = 0, a = t.length; r < a; r++) e2[r] = H(e2[r], t[r]);
      return e2;
    }
    if (!e2.constructor || e2.constructor === Object) {
      e2 = { ...e2 };
      for (var n in t) e2[n] = H(e2[n], t[n]);
      return e2;
    }
  }
  return t;
}, Ze = (e2, t, r, a) => {
  var n = e2.error ? e2.error.graphQLErrors : [], i = !!e2.extensions || !!(t.payload || t).extensions, s = { ...e2.extensions, ...(t.payload || t).extensions }, u = t.incremental;
  "path" in t && (u = [t]);
  var v = { data: e2.data };
  if (u) for (var o = function() {
    var d = u[l];
    Array.isArray(d.errors) && n.push(...d.errors), d.extensions && (Object.assign(s, d.extensions), i = true);
    var m = "data", h = v, g = [];
    if (d.path) g = d.path;
    else if (a) {
      var x = a.find(((S) => S.id === d.id));
      d.subPath ? g = [...x.path, ...d.subPath] : g = x.path;
    }
    for (var k = 0, f = g.length; k < f; m = g[k++]) h = h[m] = Array.isArray(h[m]) ? [...h[m]] : { ...h[m] };
    if (d.items) for (var y = +m >= 0 ? m : 0, c = 0, w = d.items.length; c < w; c++) h[y + c] = H(h[y + c], d.items[c]);
    else d.data !== void 0 && (h[m] = H(h[m], d.data));
  }, l = 0, p = u.length; l < p; l++) o();
  else v.data = (t.payload || t).data || e2.data, n = t.errors || t.payload && t.payload.errors || n;
  return { operation: e2.operation, data: v.data, error: n.length ? new se({ graphQLErrors: n, response: r }) : void 0, extensions: i ? s : void 0, hasNext: t.hasNext != null ? t.hasNext : e2.hasNext, stale: false };
}, et = (e2, t, r) => ({ operation: e2, data: void 0, error: new se({ networkError: t, response: r }), extensions: void 0, hasNext: false, stale: false });
function tt(e2) {
  var t = { query: void 0, documentId: void 0, operationName: _e$1(e2.query), variables: e2.variables || void 0, extensions: e2.extensions };
  return "documentId" in e2.query && e2.query.documentId && (!e2.query.definitions || !e2.query.definitions.length) ? t.documentId = e2.query.documentId : (!e2.extensions || !e2.extensions.persistedQuery || e2.extensions.persistedQuery.miss) && (t.query = W$1(e2.query)), t;
}
var rt = (e2, t) => {
  var r = e2.kind === "query" && e2.context.preferGetMethod;
  if (!r || !t) return e2.context.url;
  var a = at(e2.context.url);
  for (var n in t) {
    var i = t[n];
    i && a[1].set(n, typeof i == "object" ? J$1(i) : i);
  }
  var s = a.join("?");
  return s.length > 2047 && r !== "force" ? (e2.context.preferGetMethod = false, e2.context.url) : s;
}, at = (e2) => {
  var t = e2.indexOf("?");
  return t > -1 ? [e2.slice(0, t), new URLSearchParams(e2.slice(t + 1))] : [e2, new URLSearchParams()];
}, nt = (e2, t) => {
  if (t && !(e2.kind === "query" && e2.context.preferGetMethod)) {
    var r = J$1(t), a = ((u) => {
      var v = /* @__PURE__ */ new Map();
      return (B !== M || U !== M) && (_$1.clear(), Y$1(v, "variables", u)), v;
    })(t.variables);
    if (a.size) {
      var n = new FormData();
      n.append("operations", r), n.append("map", J$1({ ...[...a.keys()].map(((u) => [u])) }));
      var i = 0;
      for (var s of a.values()) n.append("" + i++, s);
      return n;
    }
    return r;
  }
}, it = (e2, t) => {
  var r = { accept: e2.kind === "subscription" ? "text/event-stream, multipart/mixed" : "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed" }, a = (typeof e2.context.fetchOptions == "function" ? e2.context.fetchOptions() : e2.context.fetchOptions) || {};
  if (a.headers) if (((s) => "has" in s && !Object.keys(s).length)(a.headers)) a.headers.forEach(((s, u) => {
    r[u] = s;
  }));
  else if (Array.isArray(a.headers)) a.headers.forEach(((s, u) => {
    Array.isArray(s) ? r[s[0]] ? r[s[0]] = `${r[s[0]]},${s[1]}` : r[s[0]] = s[1] : r[u] = s;
  }));
  else for (var n in a.headers) r[n.toLowerCase()] = a.headers[n];
  var i = nt(e2, t);
  return typeof i == "string" && !r["content-type"] && (r["content-type"] = "application/json"), { ...a, method: i ? "POST" : "GET", body: i, headers: r };
}, st = /boundary="?([^=";]+)"?/i, ot = /data: ?([^\n]+)/;
async function* he$1(e2) {
  if (e2.body[Symbol.asyncIterator]) for await (var t of e2.body) yield t;
  else {
    var r = e2.body.getReader(), a;
    try {
      for (; !(a = await r.read()).done; ) yield a.value;
    } finally {
      r.cancel();
    }
  }
}
async function* pe$1(e2, t) {
  var r = typeof TextDecoder < "u" ? new TextDecoder() : null, a = "", n;
  for await (var i of e2) for (a += i.constructor.name === "Buffer" ? i.toString() : r.decode(i, { stream: true }); (n = a.indexOf(t)) > -1; ) yield a.slice(0, n), a = a.slice(n + t.length);
}
async function* ft(e2, t, r) {
  var a = true, n = null, i;
  try {
    yield await Promise.resolve();
    var s = (i = await (e2.context.fetch || fetch)(t, r)).headers.get("Content-Type") || "", u;
    /multipart\/mixed/i.test(s) ? u = (async function* (p, d) {
      var m = p.match(st), h = "--" + (m ? m[1] : "-"), g = true, x;
      for await (var k of pe$1(he$1(d), `\r
` + h)) {
        if (g) {
          g = false;
          var f = k.indexOf(h);
          if (f > -1) k = k.slice(f + h.length);
          else continue;
        }
        try {
          yield x = JSON.parse(k.slice(k.indexOf(`\r
\r
`) + 4));
        } catch (y) {
          if (!x) throw y;
        }
        if (x && x.hasNext === false) break;
      }
      x && x.hasNext !== false && (yield { hasNext: false });
    })(s, i) : /text\/event-stream/i.test(s) ? u = (async function* (p) {
      var d;
      for await (var m of pe$1(he$1(p), `

`)) {
        var h = m.match(ot);
        if (h) {
          var g = h[1];
          try {
            yield d = JSON.parse(g);
          } catch (x) {
            if (!d) throw x;
          }
          if (d && d.hasNext === false) break;
        }
      }
      d && d.hasNext !== false && (yield { hasNext: false });
    })(i) : /text\//i.test(s) ? u = (async function* (p) {
      var d = await p.text();
      try {
        var m = JSON.parse(d);
        yield m;
      } catch {
        throw new Error(d);
      }
    })(i) : u = (async function* (p) {
      yield JSON.parse(await p.text());
    })(i);
    var v;
    for await (var o of u) o.pending && !n ? v = o.pending : o.pending && (v = [...v, ...o.pending]), n = n ? Ze(n, o, i, v) : X$1(e2, o, i), a = false, yield n, a = true;
    n || (yield n = X$1(e2, {}, i));
  } catch (l) {
    if (!a) throw l;
    yield et(e2, i && (i.status < 200 || i.status >= 300) && i.statusText ? new Error(i.statusText) : l, i);
  }
}
function ut(e2, t, r) {
  var a;
  return typeof AbortController < "u" && (r.signal = (a = new AbortController()).signal), qe$1((() => {
    a && a.abort();
  }))(b(((n) => !!n))(Ee(ft(e2, t, r))));
}
var Z = (e2, t) => {
  if (Array.isArray(e2)) for (var r = 0, a = e2.length; r < a; r++) Z(e2[r], t);
  else if (typeof e2 == "object" && e2 !== null) for (var n in e2) n === "__typename" && typeof e2[n] == "string" ? t.add(e2[n]) : Z(e2[n], t);
  return t;
}, ee$1 = (e2) => {
  if ("definitions" in e2) {
    for (var t = [], r = 0, a = e2.definitions.length; r < a; r++) {
      var n = ee$1(e2.definitions[r]);
      t.push(n);
    }
    return { ...e2, definitions: t };
  }
  if ("directives" in e2 && e2.directives && e2.directives.length) {
    for (var i = [], s = {}, u = 0, v = e2.directives.length; u < v; u++) {
      var o = e2.directives[u], l = o.name.value;
      l[0] !== "_" ? i.push(o) : l = l.slice(1), s[l] = o;
    }
    e2 = { ...e2, directives: i, _directives: s };
  }
  if ("selectionSet" in e2) {
    var p = [], d = e2.kind === Kind.OPERATION_DEFINITION;
    if (e2.selectionSet) {
      for (var m = 0, h = e2.selectionSet.selections.length; m < h; m++) {
        var g = e2.selectionSet.selections[m];
        d = d || g.kind === Kind.FIELD && g.name.value === "__typename" && !g.alias;
        var x = ee$1(g);
        p.push(x);
      }
      return d || p.push({ kind: Kind.FIELD, name: { kind: Kind.NAME, value: "__typename" }, _generated: true }), { ...e2, selectionSet: { ...e2.selectionSet, selections: p } };
    }
  }
  return e2;
}, ye$1 = /* @__PURE__ */ new Map(), lt = (e2) => {
  var t = z(e2), r = ye$1.get(t.__key);
  return r || (ye$1.set(t.__key, r = ee$1(t)), Object.defineProperty(r, "__key", { value: t.__key, enumerable: false })), r;
};
function ge$1(e2) {
  var t = (r) => e2(r);
  return t.toPromise = () => Pe(ne$1(1)(b(((r) => !r.stale && !r.hasNext))(t))), t.then = (r, a) => t.toPromise().then(r, a), t.subscribe = (r) => ie(r)(t), t;
}
function T(e2, t, r) {
  return { ...t, kind: e2, context: t.context ? { ...t.context, ...r } : r || t.context };
}
var me$1 = (e2, t) => T(e2.kind, e2, { meta: { ...e2.context.meta, ...t } }), ct = () => {
};
function It(e2) {
  for (var t = /* @__PURE__ */ new Map(), r = [], a = [], n = Array.isArray(e2) ? e2[0] : e2 || "", i = 1; i < arguments.length; i++) {
    var s = arguments[i];
    s && s.definitions ? a.push(s) : n += s, n += arguments[0][i];
  }
  a.unshift(z(n));
  for (var u = 0; u < a.length; u++) for (var v = 0; v < a[u].definitions.length; v++) {
    var o = a[u].definitions[v];
    if (o.kind === Kind.FRAGMENT_DEFINITION) {
      var l = o.name.value, p = W$1(o);
      t.has(l) || (t.set(l, p), r.push(o));
    } else r.push(o);
  }
  return z({ kind: Kind.DOCUMENT, definitions: r });
}
var V$1 = ({ kind: e2 }) => e2 !== "mutation" && e2 !== "query", vt = (e2) => {
  var t = lt(e2.query);
  if (t !== e2.query) {
    var r = T(e2.kind, e2);
    return r.query = t, r;
  } else return e2;
}, Rt = ({ forward: e2, client: t, dispatchDebug: r }) => {
  var a = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = (s) => s.kind === "query" && s.context.requestPolicy !== "network-only" && (s.context.requestPolicy === "cache-only" || a.has(s.key));
  return (s) => {
    var u = F(((o) => {
      var l = a.get(o.key), p = l || X$1(o, { data: null });
      return p = { ...p, operation: me$1(o, { cacheOutcome: l ? "hit" : "miss" }) }, o.context.requestPolicy === "cache-and-network" && (p.stale = true, xe(t, o)), p;
    }))(b(((o) => !V$1(o) && i(o)))(s)), v = ae$1(((o) => {
      var { operation: l } = o;
      if (l) {
        var p = l.context.additionalTypenames || [];
        if (o.operation.kind !== "subscription" && (p = ((w) => [...Z(w, /* @__PURE__ */ new Set())])(o.data).concat(p)), o.operation.kind === "mutation" || o.operation.kind === "subscription") {
          for (var d = /* @__PURE__ */ new Set(), m = 0; m < p.length; m++) {
            var h = p[m], g = n.get(h);
            g || n.set(h, g = /* @__PURE__ */ new Set());
            for (var x of g.values()) d.add(x);
            g.clear();
          }
          for (var k of d.values()) a.has(k) && (l = a.get(k).operation, a.delete(k), xe(t, l));
        } else if (l.kind === "query" && o.data) {
          a.set(l.key, o);
          for (var f = 0; f < p.length; f++) {
            var y = p[f], c = n.get(y);
            c || n.set(y, c = /* @__PURE__ */ new Set()), c.add(l.key);
          }
        }
      }
    }))(e2(b(((o) => o.kind !== "query" || o.context.requestPolicy !== "cache-only"))(F(((o) => me$1(o, { cacheOutcome: "miss" })))(j$1([F(vt)(b(((o) => !V$1(o) && !i(o)))(s)), b(((o) => V$1(o)))(s)])))));
    return j$1([u, v]);
  };
}, xe = (e2, t) => e2.reexecuteOperation(T(t.kind, t, { requestPolicy: "network-only" })), jt$1 = ({ forward: e2, dispatchDebug: t }) => (r) => {
  var a = Ne$1(((i) => {
    var s = tt(i), u = rt(i, s), v = it(i, s), o = Se$1(b(((l) => l.kind === "teardown" && l.key === i.key))(r))(ut(i, u, v));
    return o;
  }))(b(((i) => i.kind !== "teardown" && (i.kind !== "subscription" || !!i.context.fetchSubscriptions)))(r)), n = e2(b(((i) => i.kind === "teardown" || i.kind === "subscription" && !i.context.fetchSubscriptions))(r));
  return j$1([a, n]);
}, dt = (e2) => ({ client: t, forward: r, dispatchDebug: a }) => e2.reduceRight(((n, i) => i({ client: t, forward(s) {
  return D$1(n(D$1(s)));
}, dispatchDebug(s) {
} })), r), ht = ({ dispatchDebug: e2 }) => (t) => b(((r) => false))(t), pt = function e(t) {
  var r = 0, a = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), s = [], u = { url: t.url, fetchSubscriptions: t.fetchSubscriptions, fetchOptions: t.fetchOptions, fetch: t.fetch, preferGetMethod: t.preferGetMethod != null ? t.preferGetMethod : "within-url-limit", requestPolicy: t.requestPolicy || "cache-first" }, v = He$1();
  function o(f) {
    (f.kind === "mutation" || f.kind === "teardown" || !i.has(f.key)) && (f.kind === "teardown" ? i.delete(f.key) : f.kind !== "mutation" && i.add(f.key), v.next(f));
  }
  var l = false;
  function p(f) {
    if (f && o(f), !l) {
      for (l = true; l && (f = s.shift()); ) o(f);
      l = false;
    }
  }
  var d = (f) => {
    var y = Se$1(b(((c) => c.kind === "teardown" && c.key === f.key))(v.source))(b(((c) => c.operation.kind === f.kind && c.operation.key === f.key && (!c.operation.context._instance || c.operation.context._instance === f.context._instance)))(k));
    return f.kind !== "query" ? y = Ge(((c) => !!c.hasNext))(y) : y = ue(((c) => {
      var w = K(c);
      return c.stale || c.hasNext ? w : j$1([w, F((() => (c.stale = true, c)))(ne$1(1)(b(((S) => S.key === f.key))(v.source)))]);
    }))(y), f.kind !== "mutation" ? y = qe$1((() => {
      i.delete(f.key), a.delete(f.key), n.delete(f.key), l = false;
      for (var c = s.length - 1; c >= 0; c--) s[c].key === f.key && s.splice(c, 1);
      o(T("teardown", f, f.context));
    }))(ae$1(((c) => {
      if (c.stale) if (!c.hasNext) i.delete(f.key);
      else for (var w = 0; w < s.length; w++) {
        var S = s[w];
        if (S.key === c.operation.key) {
          i.delete(S.key);
          break;
        }
      }
      else c.hasNext || i.delete(f.key);
      a.set(f.key, c);
    }))(y)) : y = fe$1((() => {
      o(f);
    }))(y), D$1(y);
  }, m = this instanceof e ? this : Object.create(e.prototype), h = Object.assign(m, { suspense: !!t.suspense, operations$: v.source, reexecuteOperation(f) {
    if (f.kind === "teardown") p(f);
    else if (f.kind === "mutation") s.push(f), Promise.resolve().then(p);
    else if (n.has(f.key)) {
      for (var y = false, c = 0; c < s.length; c++) s[c].key === f.key && (s[c] = f, y = true);
      y || i.has(f.key) && f.context.requestPolicy !== "network-only" ? (i.delete(f.key), Promise.resolve().then(p)) : (s.push(f), Promise.resolve().then(p));
    }
  }, createRequestOperation(f, y, c) {
    return c || (c = {}), T(f, y, { _instance: f === "mutation" ? r = r + 1 | 0 : void 0, ...u, ...c, requestPolicy: c.requestPolicy || u.requestPolicy, suspense: c.suspense || c.suspense !== false && h.suspense });
  }, executeRequestOperation(f) {
    return f.kind === "mutation" ? ge$1(d(f)) : ge$1(Je((() => {
      var y = n.get(f.key);
      y || n.set(f.key, y = d(f)), y = fe$1((() => {
        p(f);
      }))(y);
      var c = a.get(f.key);
      return f.kind === "query" && c && (c.stale || c.hasNext) ? ue(K)(j$1([y, b(((w) => w === a.get(f.key)))(K(c))])) : y;
    })));
  }, executeQuery(f, y) {
    var c = h.createRequestOperation("query", f, y);
    return h.executeRequestOperation(c);
  }, executeSubscription(f, y) {
    var c = h.createRequestOperation("subscription", f, y);
    return h.executeRequestOperation(c);
  }, executeMutation(f, y) {
    var c = h.createRequestOperation("mutation", f, y);
    return h.executeRequestOperation(c);
  }, readQuery(f, y, c) {
    var w = null;
    return ie(((S) => {
      w = S;
    }))(h.query(f, y, c)).unsubscribe(), w;
  }, query: (f, y, c) => h.executeQuery(R(f, y), c), subscription: (f, y, c) => h.executeSubscription(R(f, y), c), mutation: (f, y, c) => h.executeMutation(R(f, y), c) }), g = ct, x = dt(t.exchanges), k = D$1(x({ client: h, dispatchDebug: g, forward: ht({ dispatchDebug: g }) })(v.source));
  return We$1(k), h;
}, Dt$1 = pt;
function yt(e2, t) {
  if (e2 == null) throw new Error(t);
  return e2;
}
const gt = createContext$1();
createContext$1();
const mt = () => yt(useContext(gt), "<A> and 'use' router primitives can be only used inside a Route."), xt = () => mt().navigatorFactory();
let kt;
function wt() {
  return kt;
}
const bt = "Location", Ot = 5e3, Nt = 18e4;
let te$1 = /* @__PURE__ */ new Map();
isServer || setInterval(() => {
  const e2 = Date.now();
  for (let [t, r] of te$1.entries()) !r[4].count && e2 - r[0] > Nt && te$1.delete(t);
}, 3e5);
function L() {
  if (!isServer) return te$1;
  const e2 = getRequestEvent();
  if (!e2) throw new Error("Cannot find cache context");
  return (e2.router || (e2.router = {})).cache || (e2.router.cache = /* @__PURE__ */ new Map());
}
function Q$1(e2, t) {
  e2.GET && (e2 = e2.GET);
  const r = (...a) => {
    const n = L(), i = wt(), u = getOwner() ? xt() : void 0, v = Date.now(), o = t + ke$1(a);
    let l = n.get(o), p;
    if (isServer) {
      const h = getRequestEvent();
      if (h) {
        const g = (h.router || (h.router = {})).dataOnly;
        if (g) {
          const x = h && (h.router.data || (h.router.data = {}));
          if (x && o in x) return x[o];
          if (Array.isArray(g) && !qt(o, g)) return x[o] = void 0, Promise.resolve();
        }
      }
    }
    if (getListener() && !isServer && (p = true, onCleanup(() => l[4].count--)), l && l[0] && (isServer || i === "native" || l[4].count || Date.now() - l[0] < Ot)) {
      p && (l[4].count++, l[4][0]()), l[3] === "preload" && i !== "preload" && (l[0] = v);
      let h = l[1];
      return h = "then" in l[1] ? l[1].then(m(false), m(true)) : m(false)(l[1]), h;
    }
    let d;
    if (!isServer && sharedConfig.has && sharedConfig.has(o) ? (d = sharedConfig.load(o), delete globalThis._$HY.r[o]) : d = e2(...a), l ? (l[0] = v, l[1] = d, l[3] = i) : (n.set(o, l = [v, d, , i, createSignal(v)]), l[4].count = 0), p && (l[4].count++, l[4][0]()), isServer) {
      const h = getRequestEvent();
      if (h && h.router.dataOnly) return h.router.data[o] = d;
    }
    if (d = "then" in d ? d.then(m(false), m(true)) : m(false)(d), isServer && sharedConfig.context && sharedConfig.context.async && !sharedConfig.context.noHydrate) {
      const h = getRequestEvent();
      (!h || !h.serverOnly) && sharedConfig.context.serialize(o, d);
    }
    return d;
    function m(h) {
      return async (g) => {
        if (g instanceof Response) {
          const x = getRequestEvent();
          if (x) for (const [f, y] of g.headers) f == "set-cookie" ? x.response.headers.append("set-cookie", y) : x.response.headers.set(f, y);
          const k = g.headers.get(bt);
          if (k !== null) {
            u && k.startsWith("/") ? startTransition(() => {
              u(k, { replace: true });
            }) : isServer ? x && (x.response.status = 302) : window.location.href = k;
            return;
          }
          g.customBody && (g = await g.customBody());
        }
        if (h) throw g;
        return l[2] = g, g;
      };
    }
  };
  return r.keyFor = (...a) => t + ke$1(a), r.key = t, r;
}
Q$1.get = (e2) => L().get(e2)[2];
Q$1.set = (e2, t) => {
  const r = L(), a = Date.now();
  let n = r.get(e2);
  n ? (n[0] = a, n[1] = Promise.resolve(t), n[2] = t, n[3] = "preload") : (r.set(e2, n = [a, Promise.resolve(t), t, "preload", createSignal(a)]), n[4].count = 0);
};
Q$1.delete = (e2) => L().delete(e2);
Q$1.clear = () => L().clear();
function qt(e2, t) {
  for (let r of t) if (r && e2.startsWith(r)) return true;
  return false;
}
function ke$1(e2) {
  return JSON.stringify(e2, (t, r) => St(r) ? Object.keys(r).sort().reduce((a, n) => (a[n] = r[n], a), {}) : r);
}
function St(e2) {
  let t;
  return e2 != null && typeof e2 == "object" && (!(t = Object.getPrototypeOf(e2)) || t === Object.prototype);
}
var Ae = createContext$1(), Tt = Ae.Provider, Et = () => {
  var e2 = useContext(Ae);
  return e2;
};
function Ct(e2, t, r) {
  var a = null;
  return (n, i, s) => (a || (a = Q$1((async (u, v, o) => {
    var l = R(e2, v != null ? v : void 0 ), p = { requestPolicy: void 0 , ...void 0 , ...o };
    return await u.executeQuery(l, p).toPromise();
  }), t)), a(n, i, s));
}
function Lt(e2, t) {
  var r = Et(), a = { fetching: false, stale: false, hasNext: false, data: void 0, error: void 0, extensions: void 0 }, [n, i] = createStore(a);
  return [n, (s, u) => {
    i({ ...a, fetching: true });
    var v = R(e2, s);
    return Pe(ne$1(1)(b(((o) => !o.hasNext))(ae$1(((o) => {
      batch((() => {
        i("data", reconcile(o.data)), i({ fetching: false, stale: o.stale, error: o.error, extensions: o.extensions, hasNext: o.hasNext });
      }));
    }))(r.executeMutation(v, u)))));
  }];
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
function Ft(e = {}) {
  let t, n = false;
  const s = (a) => {
    if (t && t !== a) throw new Error("Context conflict");
  };
  let r;
  if (e.asyncContext) {
    const a = e.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    a ? r = new a() : console.warn("[unctx] `AsyncLocalStorage` is not provided.");
  }
  const o = () => {
    if (r) {
      const a = r.getStore();
      if (a !== void 0) return a;
    }
    return t;
  };
  return { use: () => {
    const a = o();
    if (a === void 0) throw new Error("Context is not available");
    return a;
  }, tryUse: () => o(), set: (a, i) => {
    i || s(a), t = a, n = true;
  }, unset: () => {
    t = void 0, n = false;
  }, call: (a, i) => {
    s(a), t = a;
    try {
      return r ? r.run(a, i) : i();
    } finally {
      n || (t = void 0);
    }
  }, async callAsync(a, i) {
    t = a;
    const l = () => {
      t = a;
    }, c = () => t === a ? l : void 0;
    fe.add(c);
    try {
      const u = r ? r.run(a, i) : i();
      return n || (t = void 0), await u;
    } finally {
      fe.delete(c);
    }
  } };
}
function Dt(e = {}) {
  const t = {};
  return { get(n, s = {}) {
    return t[n] || (t[n] = Ft({ ...e, ...s })), t[n];
  } };
}
const V = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof global < "u" ? global : {}, de = "__unctx__", Mt = V[de] || (V[de] = Dt()), Ut = (e, t = {}) => Mt.get(e, t), he = "__unctx_async_handlers__", fe = V[he] || (V[he] = /* @__PURE__ */ new Set());
function jt(e) {
  let t;
  const n = _e(e), s = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(n, { ...s, body: e.node.req.body }) : new Request(n, { ...s, get body() {
    return t || (t = Zt(e), t);
  } });
}
function Wt(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: jt(e), url: _e(e) }, e.web.request;
}
function Bt() {
  return rn();
}
const Te = /* @__PURE__ */ Symbol("$HTTPEvent");
function Kt(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[Te]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function S(e) {
  return function(...t) {
    var _a;
    let n = t[0];
    if (Kt(n)) t[0] = n instanceof H3Event || n.__is_event__ ? n : n[Te];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (n = Bt(), !n) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      t.unshift(n);
    }
    return e(...t);
  };
}
const _e = S(getRequestURL), zt = S(getRequestIP), ee = S(setResponseStatus), pe = S(getResponseStatus), Gt = S(getResponseStatusText), J = S(getResponseHeaders), me = S(getResponseHeader), Jt = S(setResponseHeader), Qt = S(appendResponseHeader), ge = S(sendRedirect), Vt = S(getCookie), Yt = S(setCookie), Xt = S(setHeader), Zt = S(getRequestWebStream), en = S(removeResponseHeader), tn = S(Wt);
function nn() {
  var _a;
  return Ut("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function rn() {
  return nn().use().event;
}
const D = { NORMAL: 0, WILDCARD: 1, PLACEHOLDER: 2 };
function sn(e = {}) {
  const t = { options: e, rootNode: Ne(), staticRoutesMap: {} }, n = (s) => e.strictTrailingSlash ? s : s.replace(/\/$/, "") || "/";
  if (e.routes) for (const s in e.routes) ye(t, n(s), e.routes[s]);
  return { ctx: t, lookup: (s) => on(t, n(s)), insert: (s, r) => ye(t, n(s), r), remove: (s) => an(t, n(s)) };
}
function on(e, t) {
  const n = e.staticRoutesMap[t];
  if (n) return n.data;
  const s = t.split("/"), r = {};
  let o = false, a = null, i = e.rootNode, l = null;
  for (let c = 0; c < s.length; c++) {
    const u = s[c];
    i.wildcardChildNode !== null && (a = i.wildcardChildNode, l = s.slice(c).join("/"));
    const y = i.children.get(u);
    if (y === void 0) {
      if (i && i.placeholderChildren.length > 1) {
        const m = s.length - c;
        i = i.placeholderChildren.find((h) => h.maxDepth === m) || null;
      } else i = i.placeholderChildren[0] || null;
      if (!i) break;
      i.paramName && (r[i.paramName] = u), o = true;
    } else i = y;
  }
  return (i === null || i.data === null) && a !== null && (i = a, r[i.paramName || "_"] = l, o = true), i ? o ? { ...i.data, params: o ? r : void 0 } : i.data : null;
}
function ye(e, t, n) {
  let s = true;
  const r = t.split("/");
  let o = e.rootNode, a = 0;
  const i = [o];
  for (const l of r) {
    let c;
    if (c = o.children.get(l)) o = c;
    else {
      const u = cn(l);
      c = Ne({ type: u, parent: o }), o.children.set(l, c), u === D.PLACEHOLDER ? (c.paramName = l === "*" ? `_${a++}` : l.slice(1), o.placeholderChildren.push(c), s = false) : u === D.WILDCARD && (o.wildcardChildNode = c, c.paramName = l.slice(3) || "_", s = false), i.push(c), o = c;
    }
  }
  for (const [l, c] of i.entries()) c.maxDepth = Math.max(i.length - l, c.maxDepth || 0);
  return o.data = n, s === true && (e.staticRoutesMap[t] = o), o;
}
function an(e, t) {
  let n = false;
  const s = t.split("/");
  let r = e.rootNode;
  for (const o of s) if (r = r.children.get(o), !r) return n;
  if (r.data) {
    const o = s.at(-1) || "";
    r.data = null, Object.keys(r.children).length === 0 && r.parent && (r.parent.children.delete(o), r.parent.wildcardChildNode = null, r.parent.placeholderChildren = []), n = true;
  }
  return n;
}
function Ne(e = {}) {
  return { type: e.type || D.NORMAL, maxDepth: 0, parent: e.parent || null, children: /* @__PURE__ */ new Map(), data: e.data || null, paramName: e.paramName || null, wildcardChildNode: null, placeholderChildren: [] };
}
function cn(e) {
  return e.startsWith("**") ? D.WILDCARD : e[0] === ":" || e === "*" ? D.PLACEHOLDER : D.NORMAL;
}
const He = [{ page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index2.mjs'), import: () => import('../build/index2.mjs') }, path: "/", filePath: "/Users/ddibiase/Projects/urql/examples/with-solid-start/src/routes/index.tsx" }], ln = un(He.filter((e) => e.page));
function un(e) {
  function t(n, s, r, o) {
    const a = Object.values(n).find((i) => r.startsWith(i.id + "/"));
    return a ? (t(a.children || (a.children = []), s, r.slice(a.id.length)), n) : (n.push({ ...s, id: r, path: r.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), n);
  }
  return e.sort((n, s) => n.path.length - s.path.length).reduce((n, s) => t(n, s, s.path, s.path), []);
}
function dn(e, t) {
  const n = fn.lookup(e);
  if (n && n.route) {
    const s = n.route, r = t === "HEAD" ? s.$HEAD || s.$GET : s[`$${t}`];
    if (r === void 0) return;
    const o = s.page === true && s.$component !== void 0;
    return { handler: r, params: n.params, isPage: o };
  }
}
function hn(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
const fn = sn({ routes: He.reduce((e, t) => {
  if (!hn(t)) return e;
  let n = t.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (s, r) => `**:${r}`).split("/").map((s) => s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s)).join("/");
  if (/:[^/]*\?/g.test(n)) throw new Error(`Optional parameters are not supported in API routes: ${n}`);
  if (e[n]) throw new Error(`Duplicate API routes for "${n}" found at "${e[n].route.path}" and "${t.path}"`);
  return e[n] = { route: t }, e;
}, {}) }), Y = "solidFetchEvent";
function pn(e) {
  return { request: tn(e), response: yn(e), clientAddress: zt(e), locals: {}, nativeEvent: e };
}
function mn(e) {
  if (!e.context[Y]) {
    const t = pn(e);
    e.context[Y] = t;
  }
  return e.context[Y];
}
class gn {
  constructor(t) {
    __publicField(this, "event");
    this.event = t;
  }
  get(t) {
    const n = me(this.event, t);
    return Array.isArray(n) ? n.join(", ") : n || null;
  }
  has(t) {
    return this.get(t) !== null;
  }
  set(t, n) {
    return Jt(this.event, t, n);
  }
  delete(t) {
    return en(this.event, t);
  }
  append(t, n) {
    Qt(this.event, t, n);
  }
  getSetCookie() {
    const t = me(this.event, "Set-Cookie");
    return Array.isArray(t) ? t : [t];
  }
  forEach(t) {
    return Object.entries(J(this.event)).forEach(([n, s]) => t(Array.isArray(s) ? s.join(", ") : s, n, this));
  }
  entries() {
    return Object.entries(J(this.event)).map(([t, n]) => [t, Array.isArray(n) ? n.join(", ") : n])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(J(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(J(this.event)).map((t) => Array.isArray(t) ? t.join(", ") : t)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function yn(e) {
  return { get status() {
    return pe(e);
  }, set status(t) {
    ee(e, t);
  }, get statusText() {
    return Gt(e);
  }, set statusText(t) {
    ee(e, pe(e), t);
  }, headers: new gn(e) };
}
var vn = " ";
const Rn = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(vn), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function te(e, t) {
  let { tag: n, attrs: { key: s, ...r } = { key: void 0 }, children: o } = e;
  return Rn[n]({ attrs: { ...r, nonce: t }, key: s, children: o });
}
function bn(e, t, n, s = "default") {
  return lazy(async () => {
    var _a;
    {
      const o = (await e.import())[s], i = (await ((_a = t.inputs) == null ? void 0 : _a[e.src].assets())).filter((c) => c.tag === "style" || c.attrs.rel === "stylesheet");
      return { default: (c) => [...i.map((u) => te(u)), createComponent(o, c)] };
    }
  });
}
function qe() {
  function e(n) {
    return { ...n, ...n.$$route ? n.$$route.require().route : void 0, info: { ...n.$$route ? n.$$route.require().route.info : {}, filesystem: true }, component: n.$component && bn(n.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: n.children ? n.children.map(e) : void 0 };
  }
  return ln.map(e);
}
let we;
const Sn = isServer ? () => getRequestEvent().routes : () => we || (we = qe());
function En(e) {
  const t = Vt(e.nativeEvent, "flash");
  if (t) try {
    let n = JSON.parse(t);
    if (!n || !n.result) return;
    const s = [...n.input.slice(0, -1), new Map(n.input[n.input.length - 1])], r = n.error ? new Error(n.result) : n.result;
    return { input: s, url: n.url, pending: false, result: n.thrown ? void 0 : r, error: n.thrown ? r : void 0 };
  } catch (n) {
    console.error(n);
  } finally {
    Yt(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function An(e) {
  const t = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await t.json(), assets: [...await t.inputs[t.handler].assets()], router: { submission: En(e) }, routes: qe(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const Cn = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function ne(e) {
  return e.status && Cn.has(e.status) ? e.status : 302;
}
function xn(e, t, n = {}, s) {
  return eventHandler({ handler: (r) => {
    const o = mn(r);
    return provideRequestEvent(o, async () => {
      const a = dn(new URL(o.request.url).pathname, o.request.method);
      if (a) {
        const h = await a.handler.import(), g = o.request.method === "HEAD" ? h.HEAD || h.GET : h[o.request.method];
        o.params = a.params || {}, sharedConfig.context = { event: o };
        const d = await g(o);
        if (d !== void 0) return d;
        if (o.request.method !== "GET") throw new Error(`API handler for ${o.request.method} "${o.request.url}" did not return a response.`);
        if (!a.isPage) return;
      }
      const i = await t(o), l = typeof n == "function" ? await n(i) : { ...n }, c = l.mode || "stream";
      if (l.nonce && (i.nonce = l.nonce), c === "sync") {
        const h = renderToString(() => (sharedConfig.context.event = i, e(i)), l);
        if (i.complete = true, i.response && i.response.headers.get("Location")) {
          const g = ne(i.response);
          return ge(r, i.response.headers.get("Location"), g);
        }
        return h;
      }
      if (l.onCompleteAll) {
        const h = l.onCompleteAll;
        l.onCompleteAll = (g) => {
          Re(i)(g), h(g);
        };
      } else l.onCompleteAll = Re(i);
      if (l.onCompleteShell) {
        const h = l.onCompleteShell;
        l.onCompleteShell = (g) => {
          ve(i, r)(), h(g);
        };
      } else l.onCompleteShell = ve(i, r);
      const u = renderToStream(() => (sharedConfig.context.event = i, e(i)), l);
      if (i.response && i.response.headers.get("Location")) {
        const h = ne(i.response);
        return ge(r, i.response.headers.get("Location"), h);
      }
      if (c === "async") return u;
      const { writable: y, readable: m } = new TransformStream();
      return u.pipeTo(y), m;
    });
  } });
}
function ve(e, t) {
  return () => {
    if (e.response && e.response.headers.get("Location")) {
      const n = ne(e.response);
      ee(t, n), Xt(t, "Location", e.response.headers.get("Location"));
    }
  };
}
function Re(e) {
  return ({ write: t }) => {
    e.complete = true;
    const n = e.response && e.response.headers.get("Location");
    n && t(`<script>window.location="${n}"<\/script>`);
  };
}
function $n(e, t, n) {
  return xn(e, An, t);
}
function Oe() {
  let e = /* @__PURE__ */ new Set();
  function t(r) {
    return e.add(r), () => e.delete(r);
  }
  let n = false;
  function s(r, o) {
    if (n) return !(n = false);
    const a = { to: r, options: o, defaultPrevented: false, preventDefault: () => a.defaultPrevented = true };
    for (const i of e) i.listener({ ...a, from: i.location, retry: (l) => {
      l && (n = true), i.navigate(r, { ...o, resolve: false });
    } });
    return !a.defaultPrevented;
  }
  return { subscribe: t, confirm: s };
}
let re;
function ae() {
  (!window.history.state || window.history.state._depth == null) && window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, ""), re = window.history.state._depth;
}
isServer || ae();
function Pn(e) {
  return { ...e, _depth: window.history.state && window.history.state._depth };
}
function Ln(e, t) {
  let n = false;
  return () => {
    const s = re;
    ae();
    const r = s == null ? null : re - s;
    if (n) {
      n = false;
      return;
    }
    r && t(r) ? (n = true, window.history.go(-r)) : e();
  };
}
const Tn = /^(?:[a-z0-9]+:)?\/\//i, _n = /^\/+|(\/)\/+$/g, ke = "http://sr";
function j(e, t = false) {
  const n = e.replace(_n, "$1");
  return n ? t || /^[?#]/.test(n) ? n : "/" + n : "";
}
function Q(e, t, n) {
  if (Tn.test(t)) return;
  const s = j(e), r = n && j(n);
  let o = "";
  return !r || t.startsWith("/") ? o = s : r.toLowerCase().indexOf(s.toLowerCase()) !== 0 ? o = s + r : o = r, (o || "/") + j(t, !o);
}
function Nn(e, t) {
  return j(e).replace(/\/*(\*.*)?$/g, "") + j(t);
}
function Ie(e) {
  const t = {};
  return e.searchParams.forEach((n, s) => {
    s in t ? Array.isArray(t[s]) ? t[s].push(n) : t[s] = [t[s], n] : t[s] = n;
  }), t;
}
function Hn(e, t, n) {
  const [s, r] = e.split("/*", 2), o = s.split("/").filter(Boolean), a = o.length;
  return (i) => {
    const l = i.split("/").filter(Boolean), c = l.length - a;
    if (c < 0 || c > 0 && r === void 0 && !t) return null;
    const u = { path: a ? "" : "/", params: {} }, y = (m) => n === void 0 ? void 0 : n[m];
    for (let m = 0; m < a; m++) {
      const h = o[m], g = h[0] === ":", d = g ? l[m] : l[m].toLowerCase(), f = g ? h.slice(1) : h.toLowerCase();
      if (g && X(d, y(f))) u.params[f] = d;
      else if (g || !X(d, f)) return null;
      u.path += `/${d}`;
    }
    if (r) {
      const m = c ? l.slice(-c).join("/") : "";
      if (X(m, y(r))) u.params[r] = m;
      else return null;
    }
    return u;
  };
}
function X(e, t) {
  const n = (s) => s === e;
  return t === void 0 ? true : typeof t == "string" ? n(t) : typeof t == "function" ? t(e) : Array.isArray(t) ? t.some(n) : t instanceof RegExp ? t.test(e) : false;
}
function qn(e) {
  const [t, n] = e.pattern.split("/*", 2), s = t.split("/").filter(Boolean);
  return s.reduce((r, o) => r + (o.startsWith(":") ? 2 : 3), s.length - (n === void 0 ? 0 : 1));
}
function Fe(e) {
  const t = /* @__PURE__ */ new Map(), n = getOwner();
  return new Proxy({}, { get(s, r) {
    return t.has(r) || runWithOwner(n, () => t.set(r, createMemo(() => e()[r]))), t.get(r)();
  }, getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  }, ownKeys() {
    return Reflect.ownKeys(e());
  }, has(s, r) {
    return r in e();
  } });
}
function De(e) {
  let t = /(\/?\:[^\/]+)\?/.exec(e);
  if (!t) return [e];
  let n = e.slice(0, t.index), s = e.slice(t.index + t[0].length);
  const r = [n, n += t[1]];
  for (; t = /^(\/\:[^\/]+)\?/.exec(s); ) r.push(n += t[1]), s = s.slice(t[0].length);
  return De(s).reduce((o, a) => [...o, ...r.map((i) => i + a)], []);
}
const On = 100, kn = createContext$1(), Me = createContext$1();
function In(e, t = "") {
  const { component: n, preload: s, load: r, children: o, info: a } = e, i = !o || Array.isArray(o) && !o.length, l = { key: e, component: n, preload: s || r, info: a };
  return Ue(e.path).reduce((c, u) => {
    for (const y of De(u)) {
      const m = Nn(t, y);
      let h = i ? m : m.split("/*", 1)[0];
      h = h.split("/").map((g) => g.startsWith(":") || g.startsWith("*") ? g : encodeURIComponent(g)).join("/"), c.push({ ...l, originalPath: u, pattern: h, matcher: Hn(h, !i, e.matchFilters) });
    }
    return c;
  }, []);
}
function Fn(e, t = 0) {
  return { routes: e, score: qn(e[e.length - 1]) * 1e4 - t, matcher(n) {
    const s = [];
    for (let r = e.length - 1; r >= 0; r--) {
      const o = e[r], a = o.matcher(n);
      if (!a) return null;
      s.unshift({ ...a, route: o });
    }
    return s;
  } };
}
function Ue(e) {
  return Array.isArray(e) ? e : [e];
}
function je(e, t = "", n = [], s = []) {
  const r = Ue(e);
  for (let o = 0, a = r.length; o < a; o++) {
    const i = r[o];
    if (i && typeof i == "object") {
      i.hasOwnProperty("path") || (i.path = "");
      const l = In(i, t);
      for (const c of l) {
        n.push(c);
        const u = Array.isArray(i.children) && i.children.length === 0;
        if (i.children && !u) je(i.children, c.pattern, n, s);
        else {
          const y = Fn([...n], s.length);
          s.push(y);
        }
        n.pop();
      }
    }
  }
  return n.length ? s : s.sort((o, a) => a.score - o.score);
}
function W(e, t) {
  for (let n = 0, s = e.length; n < s; n++) {
    const r = e[n].matcher(t);
    if (r) return r;
  }
  return [];
}
function Dn(e, t, n) {
  const s = new URL(ke), r = createMemo((u) => {
    const y = e();
    try {
      return new URL(y, s);
    } catch {
      return console.error(`Invalid path ${y}`), u;
    }
  }, s, { equals: (u, y) => u.href === y.href }), o = createMemo(() => r().pathname), a = createMemo(() => r().search, true), i = createMemo(() => r().hash), l = () => "", c = on$1(a, () => Ie(r()));
  return { get pathname() {
    return o();
  }, get search() {
    return a();
  }, get hash() {
    return i();
  }, get state() {
    return t();
  }, get key() {
    return l();
  }, query: n ? n(c) : Fe(c) };
}
let _;
function Mn() {
  return _;
}
function Un(e, t, n, s = {}) {
  const { signal: [r, o], utils: a = {} } = e, i = a.parsePath || ((p) => p), l = a.renderPath || ((p) => p), c = a.beforeLeave || Oe(), u = Q("", s.base || "");
  if (u === void 0) throw new Error(`${u} is not a valid base path`);
  u && !r().value && o({ value: u, replace: true, scroll: false });
  const [y, m] = createSignal(false);
  let h;
  const g = (p, w) => {
    w.value === d() && w.state === b() || (h === void 0 && m(true), _ = p, h = w, startTransition(() => {
      h === w && (f(h.value), v(h.state), resetErrorBoundaries(), isServer || T[1]((E) => E.filter((q) => q.pending)));
    }).finally(() => {
      h === w && batch(() => {
        _ = void 0, p === "navigate" && Qe(h), m(false), h = void 0;
      });
    }));
  }, [d, f] = createSignal(r().value), [b, v] = createSignal(r().state), L = Dn(d, b, a.queryWrapper), A = [], T = createSignal(isServer ? Ye() : []), M = createMemo(() => typeof s.transformUrl == "function" ? W(t(), s.transformUrl(L.pathname)) : W(t(), L.pathname)), ie = () => {
    const p = M(), w = {};
    for (let E = 0; E < p.length; E++) Object.assign(w, p[E].params);
    return w;
  }, ze = a.paramsWrapper ? a.paramsWrapper(ie, t) : Fe(ie), ce = { pattern: u, path: () => u, outlet: () => null, resolvePath(p) {
    return Q(u, p);
  } };
  return createRenderEffect(on$1(r, (p) => g("native", p), { defer: true })), { base: ce, location: L, params: ze, isRouting: y, renderPath: l, parsePath: i, navigatorFactory: Je, matches: M, beforeLeave: c, preloadRoute: Ve, singleFlight: s.singleFlight === void 0 ? true : s.singleFlight, submissions: T };
  function Ge(p, w, E) {
    untrack(() => {
      if (typeof w == "number") {
        w && (a.go ? a.go(w) : console.warn("Router integration does not support relative routing"));
        return;
      }
      const q = !w || w[0] === "?", { replace: B, resolve: O, scroll: K, state: k } = { replace: false, resolve: !q, scroll: true, ...E }, I = O ? p.resolvePath(w) : Q(q && L.pathname || "", w);
      if (I === void 0) throw new Error(`Path '${w}' is not a routable path`);
      if (A.length >= On) throw new Error("Too many redirects");
      const le = d();
      if (I !== le || k !== b()) if (isServer) {
        const ue = getRequestEvent();
        ue && (ue.response = { status: 302, headers: new Headers({ Location: I }) }), o({ value: I, replace: B, scroll: K, state: k });
      } else c.confirm(I, E) && (A.push({ value: le, replace: B, scroll: K, state: b() }), g("navigate", { value: I, state: k }));
    });
  }
  function Je(p) {
    return p = p || useContext(Me) || ce, (w, E) => Ge(p, w, E);
  }
  function Qe(p) {
    const w = A[0];
    w && (o({ ...p, replace: w.replace, scroll: w.scroll }), A.length = 0);
  }
  function Ve(p, w) {
    const E = W(t(), p.pathname), q = _;
    _ = "preload";
    for (let B in E) {
      const { route: O, params: K } = E[B];
      O.component && O.component.preload && O.component.preload();
      const { preload: k } = O;
      w && k && runWithOwner(n(), () => k({ params: K, location: { pathname: p.pathname, search: p.search, hash: p.hash, query: Ie(p), state: null, key: "" }, intent: "preload" }));
    }
    _ = q;
  }
  function Ye() {
    const p = getRequestEvent();
    return p && p.router && p.router.submission ? [p.router.submission] : [];
  }
}
function jn(e, t, n, s) {
  const { base: r, location: o, params: a } = e, { pattern: i, component: l, preload: c } = s().route, u = createMemo(() => s().path);
  l && l.preload && l.preload();
  const y = c ? c({ params: a, location: o, intent: _ || "initial" }) : void 0;
  return { parent: t, pattern: i, path: u, outlet: () => l ? createComponent(l, { params: a, location: o, data: y, get children() {
    return n();
  } }) : n(), resolvePath(h) {
    return Q(r.path(), h, u());
  } };
}
const We = (e) => (t) => {
  const { base: n } = t, s = children(() => t.children), r = createMemo(() => je(s(), t.base || ""));
  let o;
  const a = Un(e, r, () => o, { base: n, singleFlight: t.singleFlight, transformUrl: t.transformUrl });
  return e.create && e.create(a), createComponent$1(kn.Provider, { value: a, get children() {
    return createComponent$1(Wn, { routerState: a, get root() {
      return t.root;
    }, get preload() {
      return t.rootPreload || t.rootLoad;
    }, get children() {
      return [(o = getOwner()) && null, createComponent$1(Bn, { routerState: a, get branches() {
        return r();
      } })];
    } });
  } });
};
function Wn(e) {
  const t = e.routerState.location, n = e.routerState.params, s = createMemo(() => e.preload && untrack(() => {
    e.preload({ params: n, location: t, intent: Mn() || "initial" });
  }));
  return createComponent$1(Show, { get when() {
    return e.root;
  }, keyed: true, get fallback() {
    return e.children;
  }, children: (r) => createComponent$1(r, { params: n, location: t, get data() {
    return s();
  }, get children() {
    return e.children;
  } }) });
}
function Bn(e) {
  if (isServer) {
    const r = getRequestEvent();
    if (r && r.router && r.router.dataOnly) {
      Kn(r, e.routerState, e.branches);
      return;
    }
    r && ((r.router || (r.router = {})).matches || (r.router.matches = e.routerState.matches().map(({ route: o, path: a, params: i }) => ({ path: o.originalPath, pattern: o.pattern, match: a, params: i, info: o.info }))));
  }
  const t = [];
  let n;
  const s = createMemo(on$1(e.routerState.matches, (r, o, a) => {
    let i = o && r.length === o.length;
    const l = [];
    for (let c = 0, u = r.length; c < u; c++) {
      const y = o && o[c], m = r[c];
      a && y && m.route.key === y.route.key ? l[c] = a[c] : (i = false, t[c] && t[c](), createRoot((h) => {
        t[c] = h, l[c] = jn(e.routerState, l[c - 1] || e.routerState.base, be(() => s()[c + 1]), () => {
          var _a;
          const g = e.routerState.matches();
          return (_a = g[c]) != null ? _a : g[0];
        });
      }));
    }
    return t.splice(r.length).forEach((c) => c()), a && i ? a : (n = l[0], l);
  }));
  return be(() => s() && n)();
}
const be = (e) => () => createComponent$1(Show, { get when() {
  return e();
}, keyed: true, children: (t) => createComponent$1(Me.Provider, { value: t, get children() {
  return t.outlet();
} }) });
function Kn(e, t, n) {
  const s = new URL(e.request.url), r = W(n, new URL(e.router.previousUrl || e.request.url).pathname), o = W(n, s.pathname);
  for (let a = 0; a < o.length; a++) {
    (!r[a] || o[a].route !== r[a].route) && (e.router.dataOnly = true);
    const { route: i, params: l } = o[a];
    i.preload && i.preload({ params: l, location: t.location, intent: "preload" });
  }
}
function zn([e, t], n, s) {
  return [e, s ? (r) => t(s(r)) : t];
}
function Gn(e) {
  let t = false;
  const n = (r) => typeof r == "string" ? { value: r } : r, s = zn(createSignal(n(e.get()), { equals: (r, o) => r.value === o.value && r.state === o.state }), void 0, (r) => (!t && e.set(r), sharedConfig.registry && !sharedConfig.done && (sharedConfig.done = true), r));
  return e.init && onCleanup(e.init((r = e.get()) => {
    t = true, s[1](n(r)), t = false;
  })), We({ signal: s, create: e.create, utils: e.utils });
}
function Jn(e, t, n) {
  return e.addEventListener(t, n), () => e.removeEventListener(t, n);
}
function Qn(e, t) {
  const n = e && document.getElementById(e);
  n ? n.scrollIntoView() : t && window.scrollTo(0, 0);
}
function Vn(e) {
  const t = new URL(e);
  return t.pathname + t.search;
}
function Yn(e) {
  let t;
  const n = { value: e.url || (t = getRequestEvent()) && Vn(t.request.url) || "" };
  return We({ signal: [() => n, (s) => Object.assign(n, s)] })(e);
}
const Xn = /* @__PURE__ */ new Map();
function Zn(e = true, t = false, n = "/_server", s) {
  return (r) => {
    const o = r.base.path(), a = r.navigatorFactory(r.base);
    let i, l;
    function c(d) {
      return d.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function u(d) {
      if (d.defaultPrevented || d.button !== 0 || d.metaKey || d.altKey || d.ctrlKey || d.shiftKey) return;
      const f = d.composedPath().find((M) => M instanceof Node && M.nodeName.toUpperCase() === "A");
      if (!f || t && !f.hasAttribute("link")) return;
      const b = c(f), v = b ? f.href.baseVal : f.href;
      if ((b ? f.target.baseVal : f.target) || !v && !f.hasAttribute("state")) return;
      const A = (f.getAttribute("rel") || "").split(/\s+/);
      if (f.hasAttribute("download") || A && A.includes("external")) return;
      const T = b ? new URL(v, document.baseURI) : new URL(v);
      if (!(T.origin !== window.location.origin || o && T.pathname && !T.pathname.toLowerCase().startsWith(o.toLowerCase()))) return [f, T];
    }
    function y(d) {
      const f = u(d);
      if (!f) return;
      const [b, v] = f, L = r.parsePath(v.pathname + v.search + v.hash), A = b.getAttribute("state");
      d.preventDefault(), a(L, { resolve: false, replace: b.hasAttribute("replace"), scroll: !b.hasAttribute("noscroll"), state: A ? JSON.parse(A) : void 0 });
    }
    function m(d) {
      const f = u(d);
      if (!f) return;
      const [b, v] = f;
      s && (v.pathname = s(v.pathname)), r.preloadRoute(v, b.getAttribute("preload") !== "false");
    }
    function h(d) {
      clearTimeout(i);
      const f = u(d);
      if (!f) return l = null;
      const [b, v] = f;
      l !== b && (s && (v.pathname = s(v.pathname)), i = setTimeout(() => {
        r.preloadRoute(v, b.getAttribute("preload") !== "false"), l = b;
      }, 20));
    }
    function g(d) {
      if (d.defaultPrevented) return;
      let f = d.submitter && d.submitter.hasAttribute("formaction") ? d.submitter.getAttribute("formaction") : d.target.getAttribute("action");
      if (!f) return;
      if (!f.startsWith("https://action/")) {
        const v = new URL(f, ke);
        if (f = r.parsePath(v.pathname + v.search), !f.startsWith(n)) return;
      }
      if (d.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const b = Xn.get(f);
      if (b) {
        d.preventDefault();
        const v = new FormData(d.target, d.submitter);
        b.call({ r, f: d.target }, d.target.enctype === "multipart/form-data" ? v : new URLSearchParams(v));
      }
    }
    delegateEvents(["click", "submit"]), document.addEventListener("click", y), e && (document.addEventListener("mousemove", h, { passive: true }), document.addEventListener("focusin", m, { passive: true }), document.addEventListener("touchstart", m, { passive: true })), document.addEventListener("submit", g), onCleanup(() => {
      document.removeEventListener("click", y), e && (document.removeEventListener("mousemove", h), document.removeEventListener("focusin", m), document.removeEventListener("touchstart", m)), document.removeEventListener("submit", g);
    });
  };
}
function er(e) {
  if (isServer) return Yn(e);
  const t = () => {
    const s = window.location.pathname.replace(/^\/+/, "/") + window.location.search, r = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return { value: s + window.location.hash, state: r };
  }, n = Oe();
  return Gn({ get: t, set({ value: s, replace: r, scroll: o, state: a }) {
    r ? window.history.replaceState(Pn(a), "", s) : window.history.pushState(a, "", s), Qn(decodeURIComponent(window.location.hash.slice(1)), o), ae();
  }, init: (s) => Jn(window, "popstate", Ln(s, (r) => {
    if (r) return !n.confirm(r);
    {
      const o = t();
      return !n.confirm(o.value, { state: o.state });
    }
  })), create: Zn(e.preload, e.explicitLinks, e.actionBase, e.transformUrl), utils: { go: (s) => window.history.go(s), beforeLeave: n } })(e);
}
const tr = Dt$1({ url: "https://trygql.formidable.dev/graphql/basic-pokedex", exchanges: [Rt, jt$1] });
function nr() {
  return createComponent$1(er, { root: (e) => createComponent$1(Tt, { value: tr, get children() {
    return createComponent$1(Suspense, { get children() {
      return e.children;
    } });
  } }), get children() {
    return createComponent$1(Sn, {});
  } });
}
const Be = isServer ? (e) => {
  const t = getRequestEvent();
  return t.response.status = e.code, t.response.statusText = e.text, onCleanup(() => !t.nativeEvent.handled && !t.complete && (t.response.status = 200)), null;
} : (e) => null;
var rr = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">', "</span>"], sr = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">500 | Internal Server Error</span>'];
const or = (e) => {
  const t = isServer ? "500 | Internal Server Error" : "Error | Uncaught Client Exception";
  return createComponent$1(ErrorBoundary, { fallback: (n) => (console.error(n), [ssr(rr, ssrHydrationKey(), escape(t)), createComponent$1(Be, { code: 500 })]), get children() {
    return e.children;
  } });
}, ar = (e) => {
  let t = false;
  const n = catchError(() => e.children, (s) => {
    console.error(s), t = !!s;
  });
  return t ? [ssr(sr, ssrHydrationKey()), createComponent$1(Be, { code: 500 })] : n;
};
var Se = ["<script", ">", "<\/script>"], ir = ["<script", ' type="module"', " async", "><\/script>"], cr = ["<script", ' type="module" async', "><\/script>"];
const lr = ssr("<!DOCTYPE html>");
function Ke(e, t, n = []) {
  for (let s = 0; s < t.length; s++) {
    const r = t[s];
    if (r.path !== e[0].path) continue;
    let o = [...n, r];
    if (r.children) {
      const a = e.slice(1);
      if (a.length === 0 || (o = Ke(a, r.children, o), !o)) continue;
    }
    return o;
  }
}
function ur(e) {
  const t = getRequestEvent(), n = t.nonce;
  let s = [];
  return Promise.resolve().then(async () => {
    let r = [];
    if (t.router && t.router.matches) {
      const o = [...t.router.matches];
      for (; o.length && (!o[0].info || !o[0].info.filesystem); ) o.shift();
      const a = o.length && Ke(o, t.routes);
      if (a) {
        const i = globalThis.MANIFEST.client.inputs;
        for (let l = 0; l < a.length; l++) {
          const c = a[l], u = i[c.$component.src];
          r.push(u.assets());
        }
      }
    }
    s = await Promise.all(r).then((o) => [...new Map(o.flat().map((a) => [a.attrs.key, a])).values()].filter((a) => a.attrs.rel === "modulepreload" && !t.assets.find((i) => i.attrs.key === a.attrs.key)));
  }), useAssets(() => s.length ? s.map((r) => te(r)) : void 0), createComponent$1(NoHydration, { get children() {
    return [lr, createComponent$1(ar, { get children() {
      return createComponent$1(e.document, { get assets() {
        return [createComponent$1(HydrationScript, {}), t.assets.map((r) => te(r, n))];
      }, get scripts() {
        return n ? [ssr(Se, ssrHydrationKey() + ssrAttribute("nonce", escape(n, true), false), `window.manifest = ${JSON.stringify(t.manifest)}`), ssr(ir, ssrHydrationKey(), ssrAttribute("nonce", escape(n, true), false), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))] : [ssr(Se, ssrHydrationKey(), `window.manifest = ${JSON.stringify(t.manifest)}`), ssr(cr, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))];
      }, get children() {
        return createComponent$1(Hydration, { get children() {
          return createComponent$1(or, { get children() {
            return createComponent$1(nr, {});
          } });
        } });
      } });
    } })];
  } });
}
var dr = ['<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>URQL with SolidStart</title>', "</head>"], hr = ["<html", ' lang="en">', '<body><div id="app">', "</div><!--$-->", "<!--/--></body></html>"];
const br = $n(() => createComponent$1(ur, { document: ({ assets: e, children: t, scripts: n }) => ssr(hr, ssrHydrationKey(), createComponent$1(NoHydration, { get children() {
  return ssr(dr, escape(e));
} }), escape(t), escape(n)) }));

const handlers = [
  { route: '', handler: _tzRcST, lazy: false, middleware: true, method: undefined },
  { route: '/_server', handler: It$1, lazy: false, middleware: true, method: undefined },
  { route: '/', handler: br, lazy: false, middleware: true, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b$2(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C$2(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  {
    const _handler = h3App.handler;
    h3App.handler = (event) => {
      const ctx = { event };
      return nitroAsyncContext.callAsync(ctx, () => _handler(event));
    };
  }
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
const server = cert && key ? new Server({ key, cert }, toNodeListener(nitroApp.h3App)) : new Server$1(toNodeListener(nitroApp.h3App));
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const path = process.env.NITRO_UNIX_SOCKET;
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${addressInfo.family === "IPv6" ? `[${addressInfo.address}]` : addressInfo.address}:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(listener, nitroApp);
const nodeServer = {};

export { Ct as C, Et as E, It as I, Lt as L, Ot$1 as O, nodeServer as n };
//# sourceMappingURL=nitro.mjs.map
