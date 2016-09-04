'use strict'
const test = require('tape')
const assert = require('assert')
const VCache = require('../')
const _clone = require('./common')._clone
const randomString = require('./common').randomString

const c = new VCache()
let n = 0
const start = _clone(c.getStats())
const value = randomString(100)
const value2 = randomString(100)
const key = randomString(10)


test('general: set', function (t) {
  t.end()
})

test('general: get', function (t) {
  t.end()
})




test('general: del', function (t) {
  t.end()
})

test('general: promise', function (t) {
  t.end()
})
