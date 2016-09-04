'use strict'
const test = require('tape')
const assert = require('assert')
const VCache = require('../')
const _clone = require('./common')._clone
const randomString = require('./common').randomString
const c = new VCache()

c.flushAll()

const start = _clone(c.getStats())
const value = randomString(100)
const value2 = randomString(100)
const key = randomString(10)


test('general sync', function (t) {
  t.end()
})
