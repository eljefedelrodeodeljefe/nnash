'use strict'
const test = require('tape')
const assert = require('assert')
const VCache = require('../')
const _clone = require('./common')._clone
const randomString = require('./common').randomString
const c = new VCache()
const start = _clone(c.getStats())
const value = randomString(100)
const value2 = randomString(100)

const val = randomString(20)
let n = 0

function gen (ks, cb) {
  for (var k = 0, len = ks.length; k < len; k++) {
    let key = ks[k]

    c.set(key, val, 0, (err) => {
      assert.equal(err, null)

      if (k === len - 1) {
        return cb(null)
      }
    })
  }
}

function check (ks, cb) {
  for (var l = 0, len1 = ks.length; l < len1; l++) {
    key = ks[l]
    n++
    c.get(key, (err, res) => {
      if (err) {
        return cb(err)
      }
      assert.equal(res, val)

      if (l === len1 -1) {
        return cb(null)
      }
    })
  }
}

test('many', function (t) {
  const c = new VCache()

  let time, _dur, i, j, k, key, l, len, len1, ref
  const count = 100000
  const ks = []

  console.log('\nSTART MANY TEST/BENCHMARK.\nSet, Get and check ' + count + ' elements')

  for (i = j = 1, ref = count; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    key = randomString(7)
    ks.push(key)
  }

  time = new Date().getTime()

  gen(ks, () => {
    _dur = new Date().getTime() - time

    console.log('BENCHMARK for SET:', _dur + 'ms', ' ( ' + (_dur / count) + 'ms per item ) ')

    time = new Date().getTime()

    check(ks, () => {
      _dur = new Date().getTime() - time
      console.log('BENCHMARK for GET:', _dur + 'ms', ' ( ' + (_dur / count) + 'ms per item ) ')
      console.log('BENCHMARK STATS:', c.getStats())
      t.pass()
      t.end()
    })
  })
})
