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


test('multi', function (t) {
  t.plan(110)
  var i, j, k, l, len, len1, ref
  console.log('\nSTART MULTI TEST')

  const c = new VCache()

  let n = 0
  const count = 100
  const ks = []
  const val = randomString(20)

  for (i = j = 1, ref = count; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    let key = randomString(7)
    ks.push(key)
  }

  for (k = 0, len = ks.length; k < len; k++) {
    let key = ks[k]

    c.set(key, val, 0, function (err, res) {
      n++
      t.equal(err, null)
    })
  }

  const startKeys = c.getStats().keys
  const getKeys = ks.splice(50, 5)

  let pred = {}

  for (l = 0, len1 = getKeys.length; l < len1; l++) {
    const key = getKeys[l]
    pred[key] = val
  }
  c.mget(getKeys[0], function (err, res) {
    n++
    t.ok(err !== null)
    t.equal(err.constructor.name, 'Error')
    t.equal('EKEYSTYPE', err.name)
    t.equal(res, undefined)
  })
  c.mget(getKeys, function (err, res) {
    n++
    t.equal(err, null)
    t.deepEqual(pred, res)
  })
  c.del(getKeys, function (err, res) {
    n++
    t.equal(err, null)
    t.equal(getKeys.length, res)
  })

  c.mget(getKeys, function (err, res) {
    n++
    t.equal(err, null)
    t.deepEqual(res, {})
  })
})
