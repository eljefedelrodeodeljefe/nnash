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

let startKeys

const ks = []
let n = 0
const count = 10000


function gen (cb) {
  for (var i = 0; i < count; i++) {
    let key = randomString(7)
    ks.push(key)
    c.set(key, {}, function () {
      if (i === count - 1) {
        startKeys = c.getStats().keys
        cb()
      }
    })
  }
}

function deleteAll (cb) {
  for (var i = 0; i < count; i++) {
    c.del(ks[i], function (err, res) {
      n++
      assert.equal(err, null)
      assert.equal(res, 1)

      if (i === count - 1) {
        return cb()
      }
    })
  }
}

function deleteAllAgain (cb) {
  for (var i = 0; i < count; i++) {
    c.del(ks[i], function (err, res) {
      n++
      assert.equal(res, 0)
      assert.equal(err, null)

      if (i === count - 1) {
        return cb()
      }
    })
  }
}

test('delete', function (t) {
  console.log('\nSTART DELETE TEST')

  gen(() => {
    deleteAll(() => {
      deleteAllAgain(() => {
        // REVIEW: what are we actually checking here?
        t.equal(startKeys - count, c.getStats().keys)
        t.pass('When native assert hasn\'t thrown, this does pass.')
        t.end()
      })
    })
  })
})
