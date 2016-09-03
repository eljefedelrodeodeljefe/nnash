const test = require('tape')
const VCache = require('../')

// TODO: remove temporary hack. Prefer Object.assign
function _clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

let localCache = new VCache({
  stdTTL: 0
})

let localCacheNoClone = new VCache({
  stdTTL: 0,
  useClones: false,
  checkperiod: 0
})

let localCacheTTL = new VCache({
  stdTTL: 0.3,
  checkperiod: 0
})

localCache._killCheckPeriod()

function randomString (length, withnumbers) {
  var chars, i, randomstring, rnum, string_length
  if (withnumbers == null) {
    withnumbers = true
  }
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  if (withnumbers) {
    chars += "0123456789"
  }
  string_length = length || 5;
  randomstring = ""
  i = 0
  while (i < string_length) {
    rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
    i++
  }
  return randomstring;
};


test('general', function (t) {
  t.plan(27)
  console.log("\nSTART GENERAL TEST: `" + VCache.version + ("` on node:`" + process.version + "`"))

  const c = new VCache()

  let n = 0
  const start = _clone(c.getStats())
  const value = randomString(100)
  const value2 = randomString(100)
  const key = randomString(10)

  c.once("del", function (_key, _val) {
    t.equal(_key, key)
    t.equal(_val, value2)
  })

  c.set(key, value, 0, function (err, res) {
    t.equal(err, null)
    n++
    t.equal(1, c.getStats().keys - start.keys)

    c.get(key, function (err, res) {
      n++
      t.equal(value, res)
    })

    c.keys(function (err, res) {
      n++
      const pred = [key]
      t.deepEqual(pred, res)
    })

    c.get("yxx", function (err, res) {
      n++
      t.equal(err, null)
      t.equal(res, undefined)
    })

    const errorHandlerCallback = function (err, res) {
      n++
      t.equal(err.name, "ENOTFOUND")
      // t.equal(err.message, "Key `xxx` not found")
    }

    c.get("xxx", errorHandlerCallback, true)

    try {
      c.get("xxy", true)
    } catch (error) {
      const err = error
      n++
      t.equal(err.name, "ENOTFOUND")
      // t.equal(err.message, "Key `xxy` not found")
    }

    const originalThrowOnMissingValue = c.options.errorOnMissing

    c.options.errorOnMissing = true

    try {
      c.get("xxz")
    } catch (error1) {
      const err = error1
      n++
      t.equal(err.name, "ENOTFOUND")
      // t.equal(err.message, "Key `xxz` not found")
    }

    c.options.errorOnMissing = originalThrowOnMissingValue

    console.log(c.options.errorOnMissing)

    c.del("xxx", function (err, res) {
      n++
      t.equal(err, null)
      t.equal(0, res)

    })

    c.set(key, value2, 0, function (err, res) {
      n++
      t.equal(err, null)
      t.ok(res, err)

      c.get(key, function (err, res) {
        n++
        const pred = value2
        t.equal(pred, res)
        t.equal(1, c.getStats().keys - start.keys)
      })
    })

    c.del(key, function (err, res) {
      c.removeAllListeners("del")
      n++
      t.equal(err, null)
      t.equal(1, res)
      t.equal(0, c.getStats().keys - start.keys)

      c.get(key, function (err, res) {
        n++
        t.equal(err, null)
        t.equal(res, undefined)
      })

      c.set("zero", 0, 0, function (err, res) {
        n++
        t.equal(err, null)
        t.ok(res, err)
      })

      c.get("zero", function (err, res) {
        n++
        t.equal(err, null)
        t.equal(0, res)
      })
    })
  })

  if (typeof Promise !== "undefined" && Promise !== null) {
    p = new Promise(function (fulfill, reject) {
      return fulfill('Some deferred value')
    })
    p.then(function (value) {
      t.equal(value, 'Some deferred value')
    })
    localCacheNoClone.set("promise", p)
    q = localCacheNoClone.get("promise")
    try {
      q.then(function (value) {
        n++;
      })
    } catch (error) {
      _err = error;
      t.ok(false, _err)
      return;
    }
  } else {
    console.log("No Promise test, because not availible in this node version")
  }
  // TODO
  // beforeExit(function () {
  //   var _count;
  //   _count = 14;
  //   if (typeof Promise !== "undefined" && Promise !== null) {
  //     _count += 1;
  //   }
  //   t.equal(_count, n, "not exited")
  // })
})

test('general sync', function (t) {
  let res, pred
  console.log("\nSTART GENERAL TEST SYNC")

  const c = new VCache()

  c.flushAll()

  const start = _clone(c.getStats())
  const value = randomString(100)
  const value2 = randomString(100)
  const key = randomString(10)

  c.once("del", function (_key, _val) {
    t.equal(_key, key)
    t.equal(_val, value2)
  })

  t.ok(c.set(key, value, 0))
  t.equal(1, c.getStats().keys - start.keys)

  res = c.get(key)
  t.equal(value, res)

  res = c.keys()
  pred = [key]
  t.deepEqual(pred, res)

  res = c.get("xxx")
  t.equal(res, undefined)

  res = c.del("xxx")
  t.equal(0, res)

  res = c.set(key, value2, 0)
  t.ok(res, res)

  res = c.get(key)
  t.equal(value2, res)
  t.equal(1, c.getStats().keys - start.keys)

  res = c.del(key)
  c.removeAllListeners("del")
  t.equal(1, res)
  t.equal(0, c.getStats().keys - start.keys)

  res = c.get(key)
  t.equal(res, undefined)

  res = c.set("mulitA", 23)
  t.ok(res, res)

  res = c.set("mulitB", 23)
  t.ok(res, res)

  res = c.set("mulitC", 23)
  t.ok(res, res)

  res = c.get("mulitA")
  t.equal(res, 23)

  res = c.get("mulitB")
  t.equal(res, 23)

  res = c.get("mulitC")
  t.equal(res, 23)

  res = c.del(["mulitA", "mulitB"])
  t.equal(2, res)

  res = c.get("mulitA")
  t.equal(res, undefined)

  res = c.get("mulitB")
  t.equal(res, undefined)

  res = c.get("mulitC")
  t.equal(res, 23)

  res = c.del(["mulitC"])
  t.equal(1, res)

  res = c.get("mulitC")
  t.equal(res, undefined)

  res = c.del(["mulitA", "mulitB", "mulitC"])
  t.equal(0, res)

  res = c.set("zero", 0, 0)
  t.ok(res, res)

  res = c.get("zero")
  t.equal(0, res)


  let tObj = {
    a: 1,
    b: {
      x: 2,
      y: 3
    }
  }

  res = c.set("clone", tObj, 0)
  t.ok(res, res)
  tObj.b.x = 666

  res = c.get("clone")
  t.equal(2, res.b.x)
  res.b.y = 42

  res2 = c.get("clone")
  t.equal(3, res2.b.y)
  t.end()
})

test('flush', function (t) {
  t.plan(103)
  var i, j, k, key, len, ref
  console.log("\nSTART FLUSH TEST")

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
      n++;
      t.equal(err, null)
    })
  }
  t.equal(c.getStats().keys, startKeys + count)
  c.flushAll(false)
  t.equal(c.getStats().keys, 0)
  t.deepEqual(c.data, {})
})


test('many', function (t) {
  t.plan(200000)

  const c = new VCache()

  let time, _dur, i, j, k, key, l, len, len1, ref;
  let n = 0
  const count = 100000
  const ks = []

  console.log("\nSTART MANY TEST/BENCHMARK.\nSet, Get and check " + count + " elements")

  const val = randomString(20)

  for (i = j = 1, ref = count; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    key = randomString(7)
    ks.push(key)
  }
  time = new Date().getTime()
  for (k = 0, len = ks.length; k < len; k++) {
    key = ks[k]
    t.ok(c.set(key, val, 0))
  }
  _dur = new Date().getTime() - time

  console.log("BENCHMARK for SET:", _dur + "ms", " ( " + (_dur / count) + "ms per item ) ")

  time = new Date().getTime()
  for (l = 0, len1 = ks.length; l < len1; l++) {
    key = ks[l]
    n++
    t.equal(val, c.get(key))
  }
  _dur = new Date().getTime() - time

  console.log("BENCHMARK for GET:", _dur + "ms", " ( " + (_dur / count) + "ms per item ) ")
  console.log("BENCHMARK STATS:", c.getStats())
})

test('delete', function (t) {
  console.log("\nSTART DELETE TEST")
  const c = new VCache()

  let n = 0
  const count = 10000

  const ks = [];
  for (var i = 0; i < count; i++) {
    let key = randomString(7)
    ks.push(key)
    c.set(key, {})
  }

  const startKeys = c.getStats().keys

  for (var i = 0; i < count; i++) {
    c.del(ks[i], function (err, res) {
      n++
      t.equal(err, null)
      return t.equal(res, 1)
    })
  }

  for (var i = 0; i < count; i++) {
    c.del(ks[i], function (err, res) {
      n++
      t.equal(res, 0)
      return t.equal(err, null)
    })
  }

  t.equal(startKeys - count, c.getStats().keys)

  t.end()
})


test('stats', function (t) {
  t.plan(55)
  var i, j, k, l, ref, ref1, ref2

  const c = new VCache()

  console.log("\nSTART STATS TEST")

  let n = 0

  const start = _clone(localCache.getStats())
  const count = 5
  const keys = []
  const vals = []

  for (i = j = 1, ref = count * 2; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    let key = randomString(7)
    let val = randomString(50)
    keys.push(key)
    vals.push(val)

    c.set(key, val, 0, function (err, success) {
      n++;
      t.equal(err, null)
      t.ok(success)
    })
  }

  for (i = k = 1, ref1 = count; 1 <= ref1 ? k <= ref1 : k >= ref1; i = 1 <= ref1 ? ++k : --k) {
    c.get(keys[i], function (err, res) {
      n++
      t.equal(vals[i], res)
      t.equal(err, null)
    })
    c.del(keys[i], function (err, success) {
      n++
      t.equal(err, null)
      t.ok(success)
    })
  }

  for (i = l = 1, ref2 = count; 1 <= ref2 ? l <= ref2 : l >= ref2; i = 1 <= ref2 ? ++l : --l) {
    c.get("xxxx", function (err, res) {
      ++n;
      t.equal(err, null)
      t.equal(res, undefined)
    })
  }

  const end = c.getStats()

  t.equal(end.hits - start.hits, 5, "hits wrong")
  t.equal(end.misses - start.misses, 5, "misses wrong")
  t.equal(end.keys - start.keys, 5, "hits wrong")
  t.equal(end.ksize - start.ksize, 5 * 7, "hits wrong")
  t.equal(end.vsize - start.vsize, 5 * 50, "hits wrong")
})


test('multi', function (t) {
  t.plan(110)
  var i, j, k, l, len, len1, ref
  console.log("\nSTART MULTI TEST")

  const c = new VCache()

  let n = 0
  const count = 100;
  const ks = [];
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
    key = getKeys[l]
    pred[key] = val
  }
  c.mget(getKeys[0], function (err, res) {
    n++
    t.ok(err !== null)
    t.equal(err.constructor.name, "Error")
    t.equal("EKEYSTYPE", err.name)
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

test('ttl', function (t) {
  t.plan(43)
  console.log("\nSTART TTL TEST")

  const c = new VCache({
    stdTTL: 0
  })

  const val = randomString(20)
  const key = "k1_" + randomString(7)
  const key2 = "k2_" + randomString(7)
  const key3 = "k3_" + randomString(7)
  const key4 = "k4_" + randomString(7)
  const key5 = "k5_" + randomString(7)
  const _keys = [key, key2, key3, key4, key5]
  let n = 0;
  const _now = Date.now()

  c.set(key, val, 0.5, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    const ts = c.getTTL(key)

    if (ts > _now && ts < _now + 300) {
      throw new Error("Invalid timestamp")
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
        throw new Error("Invalid timestamp")
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
      const key = "autotest"
      const _testExpired = function (_key, _val) {
        if (Array.prototype.indexOf.call(_keys, _key) < 0) {
          t.equal(_key, key)
          t.equal(_val, val)
        }
      }

      const _testSet = function (_key) {
        t.equal(_key, key)
      }

      c.once("set", _testSet)
      c.set(key, val, 0.5, function (err, res) {
        t.equal(err, null)
        t.ok(res)
        t.equal(startKeys + 1, c.getStats().keys)

        c.get(key, function (err, res) {
          t.equal(val, res)
          c.on("expired", _testExpired)

          return setTimeout(function () {
            c._checkData(false)
            t.equal(c.data[key], undefined)
            c.removeAllListeners("set")
            c.removeAllListeners("expired")
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
      c.ttl(key3 + "false", 0.3, function (err, setted) {
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
        t.equal(c.data[key3], undefined)
      }, 500)
    })
  })

  c.set(key4, val, 100, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    c.get(key4, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)
      c.ttl(key4 + "false", function (err, setted) {
        t.equal(err, null)
        return t.equal(false, setted)
      })
      c.ttl(key4, function (err, setted) {
        t.equal(err, null)
        t.ok(setted)
        t.equal(c.data[key4], undefined)
      })
    })
  })
})


test('cache with TTL', function (t) {
  t.plan(11)
  const val = randomString(20)
  const key5 = "k5_" + randomString(7)
  localCacheTTL.set(key5, val, 100, function (err, res) {
    t.equal(err, null)
    t.ok(res)

    localCacheTTL.get(key5, function (err, res) {
      t.equal(err, null)
      t.equal(val, res)

      localCacheTTL.ttl(key5 + "false", function (err, setted) {
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
        t.equal(localCacheTTL.data[key5], undefined)
      }, 500)
    })
  })
})
