const { gql } = require('@urql/core');
const { getIntrospectedSchema } = require('@urql/introspection');

const makeEntries = (amount, makeEntry) => {
  const entries = [];
  for (let i = 0; i < amount; i++) entries.push(makeEntry(i));
  return entries;
};

const schema = getIntrospectedSchema(`
  type Author {
    id: ID!
    name: String
  }

  type Todo {
    id: ID!
    text: String
    complete: Boolean
    due: String
    author: Author!
  }

  type Query {
    todos: [Todo!]
  }
`);

const makeTodo = i => ({
  __typename: 'Todo',
  id: `${i}`,
  text: `Todo ${i}`,
  complete: Boolean(i % 2),
  due: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
  author: {
    __typename: 'Author',
    id: `Author ${i}`,
    name: `Tom ${i}. Hiddleston`
  },
});

const json = JSON.stringify({
  todos: makeEntries(1000, makeTodo),
});

var n = '';
var r = 0;

function init(str) {
  n = str;
  r = 0;
}

var tokens = {
  null: function () {
    for (var e; (e = n.charCodeAt(r++)) <= 32; );
    switch (e) {
      case 110:
        return (r += 3), !0;
      default:
        return r--, !1;
    }
  },
  bool: function () {
    for (var e; (e = n.charCodeAt(r++)) <= 32; );
    switch (e) {
      case 102:
        return (r += 4), !1;
      case 116:
        return (r += 3), !0;
      default:
        return void r--;
    }
  },
  delim: function () {
    for (var e; (e = n.charCodeAt(r++)) < 32; );
    return e;
  },
  int: function () {
    var e,
      t = r;
    for (
      45 !== n.charCodeAt(r++) && r--;
      (e = n.charCodeAt(r++)) >= 48 && e <= 57;

    );
    if (t !== --r) return parseInt(n.slice(t, r), 10) || 0;
  },
  float: function () {
    var e,
      t = r;
    for (
      (45 !== n.charCodeAt(r) && 43 !== n.charCodeAt(r)) || n.charCodeAt(r++);
      (e = n.charCodeAt(r++)) >= 48 && e <= 57;

    );
    if ((r--, 46 === n.charCodeAt(r))) {
      for (n.charCodeAt(r++); (e = n.charCodeAt(r++)) >= 48 && e <= 57; );
      r--;
    }
    if (101 === n.charCodeAt(r) || 69 === n.charCodeAt(r)) {
      for (n.charCodeAt(r++); (e = n.charCodeAt(r++)) >= 48 && e <= 57; );
      r--;
    }
    if (t !== r) return parseFloat(n.slice(t, r)) || 0;
  },
  str: function () {
    for (var e; 34 !== (e = n.charCodeAt(r++)); );
    for (var t = r, a = ''; 34 !== (e = n.charCodeAt(r++)); )
      switch (e) {
        case 92:
          var i = r - 1;
          switch ((e = n.charCodeAt(r++))) {
            case 98:
              e = 8;
              break;
            case 102:
              e = 12;
              break;
            case 110:
              e = 10;
              break;
            case 114:
              e = 13;
              break;
            case 116:
              e = 9;
              break;
            case 117:
              e = 0 | parseInt(n.slice(r, (r += 4)), 16);
          }
          (a += n.slice(t, i) + String.fromCharCode(e)), (t = r);
          break;
        default:
          continue;
      }
    return a + n.slice(t, r - 1);
  },
  prop: function () {
    for (; 58 !== n.charCodeAt(r++); );
  },
  any: function () {
    var e,
      t = r,
      a = 0;
    e: for (; (e = n.charCodeAt(r++)); )
      switch (e) {
        case 123:
        case 91:
          a++;
          break;
        case 125:
        case 93:
          if (a) {
            if (--a) break;
            break e;
          }
          r--;
          break e;
        case 34:
          for (; (e = n.charCodeAt(r++)) && 34 !== e; )
            92 === e && n.charCodeAt(r++);
          break;
        case 44:
          if (a) continue;
          r--;
          break e;
        case 0:
          break e;
      }
    return JSON.parse(n.slice(t, r));
  },
};

function parse(str) {
  init(str);
  var val_0;
  if (tokens.null()) {
    val_0 = null;
  } else {
    tokens.delim();
    val_0 = { todos: null };
    tokens.prop();
    var val_1;
    if (tokens.null()) {
      val_1 = null;
    } else {
      val_1 = [];
      for (var i_1 = 0; tokens.delim() !== 93; i_1++) {
        var val_2;
        tokens.delim();
        val_2 = {
          __typename: null,
          id: null,
          text: null,
          complete: null,
          due: null,
          author: null,
        };
        tokens.prop();
        var val_3;
        val_3 = tokens.str();
        val_2.__typename = val_3;
        tokens.delim();
        tokens.prop();
        var val_3;
        val_3 = tokens.str();
        val_2.id = val_3;
        tokens.delim();
        tokens.prop();
        var val_3;
        if (tokens.null()) {
          val_3 = null;
        } else {
          val_3 = tokens.str();
        }
        val_2.text = val_3;
        tokens.delim();
        tokens.prop();
        var val_3;
        if (tokens.null()) {
          val_3 = null;
        } else {
          val_3 = tokens.bool();
        }
        val_2.complete = val_3;
        tokens.delim();
        tokens.prop();
        var val_3;
        if (tokens.null()) {
          val_3 = null;
        } else {
          val_3 = tokens.str();
        }
        val_2.due = val_3;
        tokens.delim();
        tokens.prop();
        var val_3;
        tokens.delim();
        val_3 = { __typename: null, id: null, name: null };
        tokens.prop();
        var val_4;
        val_4 = tokens.str();
        val_3.__typename = val_4;
        tokens.delim();
        tokens.prop();
        var val_4;
        val_4 = tokens.str();
        val_3.id = val_4;
        tokens.delim();
        tokens.prop();
        var val_4;
        if (tokens.null()) {
          val_4 = null;
        } else {
          val_4 = tokens.str();
        }
        val_3.name = val_4;
        tokens.delim();
        val_2.author = val_3;
        tokens.delim();
        val_1[i_1] = val_2;
      }
    }
    val_0.todos = val_1;
    tokens.delim();
  }
  return val_0;
}

for (let i = 0; i < 1000; i++)
  parse(json);
