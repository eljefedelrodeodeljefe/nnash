'use strict'
const test = require('tape')
const assert = require('assert')
const VCache = require('../')
const _clone = require('./common')._clone
const randomString = require('./common').randomString

let n = 0
const value = randomString(100)
const value2 = randomString(100)
const key = randomString(10)


test('general: set / get, simple', function (t) {
  t.plan(3)

  const c = new VCache()
  const start = _clone(c.getStats())

  c.set('xxx', {pay: 'load'}, (err) => {
    t.equal(err, null)
    c.get('xxx', (err, res) => {
      t.equal(err, null)
      t.deepEqual(res, {pay: 'load'})
    })
  })
})

test('general: set / get, with string', function (t) {
  t.plan(3)

  const c = new VCache()
  const start = _clone(c.getStats())

  c.set('xxx', 'payload', (err) => {
    t.equal(err, null)
    c.get('xxx', (err, res) => {
      t.equal(err, null)
      t.equal(res, 'payload')
    })
  })
})

test('general: set / get, with get missing', function (t) {
  t.plan(4)

  const c = new VCache()
  const start = _clone(c.getStats())

  c.set('xxx', 'payload', (err) => {
    t.equal(err, null)
    c.get('xxy', (err, res) => {
      t.ok(err)
      t.equal(err.message, 'NotFoundError')
      t.equal(res, undefined)
    })
  })
})

test('general: set / get, ttl', function (t) {
  t.plan(3)

  const c = new VCache()
  const start = _clone(c.getStats())

  c.set('xxx', {pay: 'load'}, 1000, (err) => {
    const now = Date.now()
    t.equal(err, null)
    c.get('xxx', (err, res) => {
      t.equal(err, null)
      t.deepEqual(res, {pay: 'load'})

      c.getTTL('xxx', (err, res) => {
        // REVIEW: is this range appropiate
        if (res >= 999900 && res <= 1000100) {
          // only end test when resulting ttl is in this range
          t.pass()
          t.end()
        }
      })
    })
  })
})


test('general: del', function (t) {
  t.end()
})

test('general: promise', function (t) {
  t.end()
})
