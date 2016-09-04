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

test('flush', function (t) {
  t.plan(3)
  var i, j, k, key, len, ref
  console.log('\nSTART FLUSH TEST')

  const c = new VCache()

  let n = 0
  const count = 100
  const startKeys = c.getStats().keys
  const ks = []
  const val = randomString(20)

  for (i = j = 1, ref = count; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    key = randomString(7)
    ks.push(key)
  }

  for (k = 0, len = ks.length; k < len; k++) {
    key = ks[k]
    c.set(key, val, 0, function (err, res) {
      n++
      assert.equal(err, null)
    })
  }
  t.equal(c.getStats().keys, startKeys + count)
  c.flushAll(false)
  t.equal(c.getStats().keys, 0)
  t.deepEqual(c.storage.data, {})
})
