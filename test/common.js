'use strict'
// TODO: remove temporary hack. Prefer Object.assign
exports._clone = function _clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

exports.randomString = function randomString (length, withnumbers) {
  var chars, i, randomstring, rnum, string_length
  if (withnumbers == null) {
    withnumbers = true
  }
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  if (withnumbers) {
    chars += '0123456789'
  }
  string_length = length || 5
  randomstring = ''
  i = 0
  while (i < string_length) {
    rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
    i++
  }
  return randomstring
};
