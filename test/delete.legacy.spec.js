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


test('delete', function (t) {
  console.log('\nSTART DELETE TEST')
  const c = new VCache()

  let n = 0
  const count = 10000

  const ks = []
  for (var i = 0; i < count; i++) {
    let key = randomString(7)
    ks.push(key)
    c.set(key, {})
  }

  const startKeys = c.getStats().keys

  for (var i = 0; i < count; i++) {
    c.del(ks[i], function (err, res) {
      n++
      assert.equal(err, null)
      return assert.equal(res, 1)
    })
  }

  for (var i = 0; i < count; i++) {
    c.del(ks[i], function (err, res) {
      n++
      assert.equal(res, 0)
      return assert.equal(err, null)
    })
  }

  t.equal(startKeys - count, c.getStats().keys)

  t.end()
})
