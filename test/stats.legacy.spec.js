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


test('stats', function (t) {
  t.plan(45)
  var i, j, k, l, ref, ref1, ref2

  console.log('\nSTART STATS TEST')

  let n = 0

  const start = _clone(c.getStats())
  const count = 5
  const keys = []
  const vals = []

  for (i = j = 1, ref = count * 2; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    let key = randomString(7)
    let val = randomString(50)
    keys.push(key)
    vals.push(val)

    c.set(key, val, 0, function (err) {
      n++
      t.equal(err, null)
    })
  }

  for (i = k = 1, ref1 = count; 1 <= ref1 ? k <= ref1 : k >= ref1; i = 1 <= ref1 ? ++k : --k) {
    c.get(keys[i], function (err, res) {
      n++
      t.equal(vals[i], res)
      t.equal(err, null)
    })
    c.del(keys[i], function (err, count) {
      n++
      t.equal(err, null)
      t.ok(count)
    })
  }

  for (i = l = 1, ref2 = count; 1 <= ref2 ? l <= ref2 : l >= ref2; i = 1 <= ref2 ? ++l : --l) {
    c.get('xxxx', function (err, res) {
      ++n
      t.equal(err, null)
      t.equal(res, undefined)
    })
  }

  const end = c.getStats()

  t.equal(end.hits - start.hits, 5, 'hits wrong')
  t.equal(end.misses - start.misses, 5, 'misses wrong')
  t.equal(end.keys - start.keys, 5, 'hits wrong')
  t.equal(end.ksize - start.ksize, 5 * 7, 'hits wrong')
  t.equal(end.vsize - start.vsize, 5 * 50, 'hits wrong')
})
