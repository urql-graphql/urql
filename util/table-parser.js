const _ = require("lodash");
const parser = require("remark");

// Not worth using as it's old + misses edge cases, but an interesting reference: https://github.com/vzaccaria/mdtable2json
// function tableToJson(t) {
//   const headerCellArray = t.children[0].children;
//   const headers = _.map(headerCellArray, (it) => {
//     return it.children[0].value
//   });
//   // Remove head
//   t.children.splice(0, 1);
//   var matrix = _.map(t.children, (row) => {
//     return _.map(row.children, (cell) => {
//       if (!_.isUndefined(cell.children[0])) {
//         return cell.children[0].value
//       } else {
//         return ""
//       }
//     })
//   });
//   var json = _.map(matrix, (row) => {
//     var o = {};
//     _.map(row, (cell, index) => {
//       o[headers[index]] = cell
//     });
//     return o
//   });
//   return {
//     headers, json
//   }
// }
//
//
// function getTables(string) {
//   var tokens = parser.parse(string);
//   return _.map(_.filter(tokens.children, it => {
//     return it.type === 'table'
//   }), tableToJson)
// }
