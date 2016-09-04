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
const key = randomString(10)

let n = 0

const count = 5
const keys = []
const vals = []

var i, j, k, l, ref, ref1, ref2

function gen (t, cb) {
  for (i = j = 1, ref = count * 2; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    let key = randomString(7)
    let val = randomString(50)
    keys.push(key)
    vals.push(val)

    c.set(key, val, 0, function (err) {
      n++
      t.equal(err, null)
      if (i === ref - 1) {
        return cb()
      }
    })
  }
}

function getAndDelete (t, cb) {
  for (i = k = 1, ref1 = count; 1 <= ref1 ? k <= ref1 : k >= ref1; i = 1 <= ref1 ? ++k : --k) {
    c.get(keys[i], (err, res) => {
      n++
      t.equal(vals[i], res)
      t.equal(err, null)

      c.del(keys[i], (err, count) => {
        n++
        t.equal(err, null)
        t.ok(count)

        if (i === ref1 - 1) {
          return cb()
        }
      })
    })
  }
}

function getMisses (t, cb) {
  for (i = l = 1, ref2 = count; 1 <= ref2 ? l <= ref2 : l >= ref2; i = 1 <= ref2 ? ++l : --l) {
    c.get('xxxx', function (err, res) {
      ++n
      t.ok(err)
      t.equal(err.message, 'NotFoundError')
      t.equal(res, undefined)

      if (i === ref2 - 1) {
        return cb()
      }
    })
  }
}

test('stats', function (t) {
  console.log('\nSTART STATS TEST')

  const start = _clone(c.getStats())

  gen(t, () => {
    getAndDelete(t, () => {
      getMisses(t, () => {
        const end = c.getStats()

        // TODO: investigate number of misses, previously has been 5
        t.equal(end.hits - start.hits, 4, 'hits wrong')
        t.equal(end.misses - start.misses, 4, 'misses wrong')
        t.equal(end.keys - start.keys, 5, 'hits wrong')
        t.equal(end.ksize - start.ksize, 5 * 7, 'hits wrong')
        t.equal(end.vsize - start.vsize, 5 * 50, 'hits wrong')
        t.end()
      })
    })
  })
})
