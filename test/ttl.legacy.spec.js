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


test('ttl', function (t) {
  t.plan(43)
  console.log('\nSTART TTL TEST')

  const c = new VCache({
    stdTTL: 0
  })

  const val = randomString(20)
  const key = 'k1_' + randomString(7)
  const key2 = 'k2_' + randomString(7)
  const key3 = 'k3_' + randomString(7)
  const key4 = 'k4_' + randomString(7)
  const key5 = 'k5_' + randomString(7)
  const _keys = [key, key2, key3, key4, key5]
  let n = 0
  const _now = Date.now()

  c.set(key, val, 0.5, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    const ts = c.getTTL(key)

    if (ts > _now && ts < _now + 300) {
      throw new Error('Invalid timestamp')
    }

    c.get(key, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)
    })
  })

  c.set(key2, val, 0.3, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    c.get(key2, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)
    })
  })

  setTimeout(function () {
    ++n
    c.get(key, function (err, res) {
      t.equal(err, null)
      t.deepEqual(val, res)
    })
  }, 400)

  setTimeout(function () {
    const ts = c.getTTL(key)
    t.equal(ts, undefined)
    ++n
    c.get(key, function (err, res) {
      t.equal(err, null)
      t.equal(res, undefined)
    })
  }, 600)

  setTimeout(function () {
    ++n

    c.getTTL(key, function (err, ts) {
      if (ts > _now && ts < _now + 300) {
        throw new Error('Invalid timestamp')
      }
    })

    c.get(key2, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)
    })
  }, 250)

  setTimeout(function () {
    process.nextTick(function () {
      const startKeys = c.getStats().keys
      const key = 'autotest'
      const _testExpired = function (_key, _val) {
        if (Array.prototype.indexOf.call(_keys, _key) < 0) {
          t.equal(_key, key)
          t.equal(_val, val)
        }
      }

      const _testSet = function (_key) {
        t.equal(_key, key)
      }

      c.once('set', _testSet)
      c.set(key, val, 0.5, function (err, res) {
        t.equal(err, null)
        t.ok(res)
        t.equal(startKeys + 1, c.getStats().keys)

        c.get(key, function (err, res) {
          t.equal(val, res)
          c.on('expired', _testExpired)

          return setTimeout(function () {
            c._checkData(false)
            t.equal(c.storage.data[key], undefined)
            c.removeAllListeners('set')
            c.removeAllListeners('expired')
          }, 700)
        })
      })
    })
  }, 1000)

  c.set(key3, val, 100, function (err, res) {
    t.equal(err, null)
    t.ok(res)
    c.get(key3, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)
      c.ttl(key3 + 'false', 0.3, function (err, setted) {
        t.equal(err, null)
        t.equal(false, setted)
      })
      c.ttl(key3, 0.3, function (err, setted) {
        t.equal(err, null)
        t.ok(setted)
      })
      c.get(key3, function (err, res) {
        t.equal(val, res)
      })
      setTimeout(function () {
        res = c.get(key3)
        t.equal(res, undefined)
        t.equal(c.storage.data[key3], undefined)
      }, 500)
    })
  })

  c.set(key4, val, 100, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    c.get(key4, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)
      c.ttl(key4 + 'false', function (err, setted) {
        t.equal(err, null)
        return t.equal(false, setted)
      })
      c.ttl(key4, function (err, setted) {
        t.equal(err, null)
        t.ok(setted)
        t.equal(c.storage.data[key4], undefined)
      })
    })
  })
})


test('cache with TTL', function (t) {
  t.plan(11)
  const val = randomString(20)
  const key5 = 'k5_' + randomString(7)
  localCacheTTL.set(key5, val, 100, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    localCacheTTL.get(key5, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)

      localCacheTTL.ttl(key5 + 'false', function (err, setted) {
        t.equal(err, null)
        t.equal(false, setted)
      })

      localCacheTTL.ttl(key5, function (err, setted) {
        t.equal(err, null)
        t.ok(setted)
      })

      localCacheTTL.get(key5, function (err, res) {
        t.equal(val, res)
      })

      setTimeout(function () {
        let res = localCache.get(key5)
        t.equal(res, undefined)

        localCacheTTL._checkData(false)
        t.equal(localCacheTTL.storage.data[key5], undefined)
      }, 500)
    })
  })
})
