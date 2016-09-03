'use strict'
const Readable = require('stream').Readable

// TODO: remove temporary hack. Prefer Object.assign
function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function _isArray (obj) {
  return Array.isArray(obj)
}

function _isString (obj) {
  return typeof obj === 'string' || obj instanceof String
}

function _isFunction (obj) {
  return typeof obj === 'function'
}

function _isNumber (obj) {
  return !isNaN(parseFloat(obj))
}

function _isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

function _size (obj) {
  return Object.keys(obj).length
}

class NCache extends Readable {
  constructor (options) {
    super()
    this.options = Object.assign({
      forceString: false,
      objectValueSize: 80,
      arrayValueSize: 40,
      stdTTL: 0,
      checkperiod: 600,
      useClones: true,
      errorOnMissing: false
    }, options)
    this._initErrors()
    this.data = {}
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0
    }

    this._ERRORS = {
      'ENOTFOUND': 'Key `<%= key %>` not found',
      'EKEYSTYPE': 'The keys argument has to be an array.'
    }

    this._checkData()
  }

  set (key, value, ttl, cb) {
    let existent = false

    if (this.options.forceString && !_isString(value)) {
      value = JSON.stringify(value)
    }

    if (arguments.length === 3 && _isFunction(ttl)) {
      cb = ttl
      ttl = this.options.stdTTL
    }

    if (this.data[key]) {
      existent = true
      this.stats.vsize -= this._getValLength(this._unwrap(this.data[key], false))
    }

    this.data[key] = this._wrap(value, ttl)
    this.stats.vsize += this._getValLength(value)

    if (!existent) {
      this.stats.ksize += this._getKeyLength(key)
      this.stats.keys++
    }

    this.emit('set', key, value)

    if (cb != null) {
      cb(null, true)
    }

    return true
  }

  get (key, cb, errorOnMissing) {
    if (typeof cb === 'boolean' && arguments.length === 2) {
      errorOnMissing = cb
      cb = undefined
    }

    if ((this.data[key] != null) && this._check(key, this.data[key])) {
      this.stats.hits++
      let _ret = this._unwrap(this.data[key])

      if (cb != null) {
        cb(null, _ret)
      }

      return _ret
    } else {
      this.stats.misses++

      if (this.options.errorOnMissing || errorOnMissing) {
        let _err = this._error('ENOTFOUND', {
          key: key
        }, cb)
        if (_err != null) {
          throw _err
        }
        return
      } else {
        if (cb != null) {
          cb(null, undefined)
        }
      }
      return undefined
    }
  }

  del (keys, cb) {
    var i, len

    if (_isString(keys)) {
      keys = [keys]
    }

    let delCount = 0
    for (i = 0, len = keys.length; i < len; i++) {
      let key = keys[i]

      if (this.data[key] != null) {
        this.stats.vsize -= this._getValLength(this._unwrap(this.data[key], false))
        this.stats.ksize -= this._getKeyLength(key)
        this.stats.keys--
        delCount++
        const oldVal = this.data[key]
        delete this.data[key]
        this.emit('del', key, oldVal.v)
      } else {
        this.stats.misses++
      }
    }

    if (cb != null) {
      cb(null, delCount)
    }

    return delCount
  }

  close () {
    this._killCheckPeriod()
  }

  mget (keys, cb) {
    var i, len

    if (!_isArray(keys)) {
      let _err = this._error('EKEYSTYPE')

      if (cb != null) {
        cb(_err)
      }

      return _err
    }

    let oRet = {}

    for (i = 0, len = keys.length; i < len; i++) {
      let key = keys[i]
      if ((this.data[key] != null) && this._check(key, this.data[key])) {
        this.stats.hits++
        oRet[key] = this._unwrap(this.data[key])
      } else {
        this.stats.misses++
      }
    }
    if (cb != null) {
      cb(null, oRet)
    }
    return oRet
  }

  ttl () {
    // TODO: fix this verbose arg parsing
    var cb, ttl, i, len
    const key = arguments[0]
    const args = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : []

    for (i = 0, len = args.length; i < len; i++) {
      const arg = args[i]
      switch (typeof arg) {
        case 'number':
          ttl = arg
          break
        case 'function':
          cb = arg
      }
    }
    ttl || (ttl = this.options.stdTTL)
    if (!key) {
      if (cb != null) {
        cb(null, false)
      }
      return false
    }
    if ((this.data[key] != null) && this._check(key, this.data[key])) {
      if (ttl > 0) {
        this.data[key] = this._wrap(this.data[key].v, ttl, false)
      } else {
        this.del(key)
      }
      if (cb != null) {
        cb(null, true)
      }
      return true
    } else {
      if (cb != null) {
        cb(null, false)
      }
      return false
    }
  }

  getTTL (key, cb) {
    if (!key) {
      if (cb != null) {
        cb(null, undefined)
      }
      return undefined
    }

    if ((this.data[key] != null) && this._check(key, this.data[key])) {
      const _ttl = this.data[key].t
      if (cb != null) {
        cb(null, _ttl)
      }
      return _ttl
    } else {
      if (cb != null) {
        cb(null, undefined)
      }
      return undefined
    }
  }

  keys (cb) {
    const _keys = Object.keys(this.data)

    if (cb != null) {
      return cb(null, _keys)
    }

    return _keys
  }

  getStats () {
    return this.stats
  }

  flushAll (_startPeriod) {
    if (_startPeriod == null) {
      _startPeriod = true
    }
    this.data = {}

    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0
    }

    this._killCheckPeriod()
    this._checkData(_startPeriod)
    this.emit('flush')
  }

  _checkData (startPeriod) {
    if (startPeriod == null) {
      startPeriod = true
    }

    const ref = this.data

    for (let key in ref) {
      let value = ref[key]
      this._check(key, value)
    }

    if (startPeriod && this.options.checkperiod > 0) {
      this.checkTimeout = setTimeout(this._checkData, this.options.checkperiod * 1000)
      if (this.checkTimeout.unref != null) {
        this.checkTimeout.unref()
      }
    }
  }

  _killCheckPeriod () {
    if (this.checkTimeout != null) {
      return clearTimeout(this.checkTimeout)
    }
  }

  _check (key, data) {
    if (data.t !== 0 && data.t < Date.now()) {
      this.del(key)
      this.emit('expired', key, this._unwrap(data))
      return false
    } else {
      return true
    }
  }

  _wrap (value, ttl, asClone) {
    if (asClone == null) {
      asClone = true
    }

    if (!this.options.useClones) {
      asClone = false
    }

    const now = Date.now()

    let livetime = 0
    const ttlMultiplicator = 1000

    if (ttl === 0) {
      livetime = 0
    } else if (ttl) {
      livetime = now + (ttl * ttlMultiplicator)
    } else {
      if (this.options.stdTTL === 0) {
        livetime = this.options.stdTTL
      } else {
        livetime = now + (this.options.stdTTL * ttlMultiplicator)
      }
    }

    return {
      t: livetime,
      v: asClone ? clone(value) : value
    }
  }

  _unwrap (value, asClone) {
    if (asClone == null) {
      asClone = true
    }
    if (!this.options.useClones) {
      asClone = false
    }
    if (value.v != null) {
      if (asClone) {
        return clone(value.v)
      } else {
        return value.v
      }
    }
    return null
  }

  _getKeyLength (key) {
    return key.length
  }

  _getValLength (value) {
    if (_isString(value)) {
      return value.length
    } else if (this.options.forceString) {
      return JSON.stringify(value).length
    } else if (_isArray(value)) {
      return this.options.arrayValueSize * value.length
    } else if (_isNumber(value)) {
      return 8
    } else if (_isObject(value)) {
      return this.options.objectValueSize * _size(value)
    } else {
      return 0
    }
  }

  _error (type, data, cb) {
    if (data == null) {
      data = {}
    }

    const error = new Error()

    error.name = type
    error.errorcode = type
    error.message = this.ERRORS[type] != null ? this.ERRORS[type](data) : '-'
    error.data = data

    if (cb && _isFunction(cb)) {
      cb(error, null)
    } else {
      return error
    }
  }

  _initErrors () {
    this.ERRORS = {}

    const ref = this._ERRORS
    for (let _errT in ref) {
      let _errMsg = ref[_errT]
    }
  }
}

module.exports = NCache
