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

class Storage extends Readable {
  constructor (options) {
    super()
    this.data = {}
    this.options = Object.assign({}, options)

    if (this.options.plugins && this.options.plugins.length >= 0) {
      this._handleStoragePlugin(this.options.plugins)
    }
  }

  set () {

  }

  get () {

  }

  _set (key, data, cb) {
    const res = this.data[key] = data
    return cb(null, res)
  }

  _get (key, cb) {
    return cb(null, this.data[key])
  }

  _handleStoragePlugin (plugins) {
    // Expect an array of plugins. Each element is an object of one or more
    // functions, with the public functions being enumarable. Get the key and
    // override default functions of this class.
    plugins.forEach((plugin) => {
      for (var key in plugin) {
        if (plugin.hasOwnProperty(key)) {
          this[key] = plugin[key]
        }
      }
    })
  }
}

class NNash extends Readable {
  constructor (options) {
    super()
    this.storage = new Storage(options)

    this.options = Object.assign({
      forceString: false,
      objectValueSize: 80,
      arrayValueSize: 40,
      stdTTL: 0,
      checkperiod: 600,
      useClones: true,
      errorOnMissing: false
    }, options)

    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0
    }

    this._checkData()
  }

  set (key, value, ttl, cb) {
    let existent = false
    // force data to be string if options is set
    if (this.options.forceString && !_isString(value)) {
      value = JSON.stringify(value)
    }
    // remap arguments if necessary
    if (arguments.length === 3 && _isFunction(ttl)) {
      cb = ttl
      ttl = this.options.stdTTL
    }
    // remove existing data from stats
    this.storage._get(key, (err, res) => {
      if (err) {
        return cb(err)
      }

      if (!err && res) {
        existent = true
        this.stats.vsize -= this._getValLength(this._unwrap(res, false))
      }

      const data = this._wrap(value, ttl)
      // set the value below
      this.storage._set(key, data, (err) => {
        if (err) {
          return cb(err)
        }
        // fire event on next event cycle; REVIEW: is synchronous fire necessary
        process.nextTick(() => { this.emit('set', key, value) })

        this.stats.vsize += this._getValLength(value)
        // only add the keys and key-size if the key is new
        if (!existent) {
          this.stats.ksize += this._getKeyLength(key)
          this.stats.keys++
        }

        return cb(null)
      })
    })
  }

  get (key, cb) {
    this.storage._get(key, (err, value) => {
      if (err) {
        return cb(err)
      }

      if (value) {
        this._check(key, value, (err, res) => {
          if (err) {
            return cb(err)
          }

          if (res) {
            this.stats.hits++
            process.nextTick(() => { this.emit('cache-hit', key) })
            return cb(null, this._unwrap(this.storage.data[key]))
          }
        })
      } else {
        this.stats.misses++
        process.nextTick(() => { this.emit('cache-miss', key) })
        err = new Error()
        err.message = 'NotFoundError'
        return cb(err)
      }
    })
  }

  del (keys, cb) {
    // treat API as: always expect an array
    if (_isString(keys)) {
      keys = [keys]
    }

    let delCount = 0

    const len = keys.length
    for (var i = 0; i < len; i++) {
      let key = keys[i]

      this.storage._get(key, (err, res) => {
        if (err) {
          return cb(err)
        }

        if (res) {
          this.stats.vsize -= this._getValLength(this._unwrap(res, false))
          this.stats.ksize -= this._getKeyLength(key)
          this.stats.keys--
          delCount++
          const oldVal = res
          delete this.storage.data[key]
          process.nextTick(() => { this.emit('del', key, oldVal.v) })
        } else {
          this.stats.misses++
        }

        if (i === len - 1) {
          return cb(null, delCount)
        }
      })
    }
  }

  close () {
    this._killCheckPeriod()
  }

  mget (keys, cb) {
    if (!_isArray(keys)) {
      let _err = this._error('EKEYSTYPE')

      if (cb != null) {
        cb(_err)
      }

      return _err
    }

    let oRet = {}

    for (var i = 0, len = keys.length; i < len; i++) {
      let key = keys[i]
      if ((this.storage.data[key] != null)) {
        this._check(key, this.storage.data[key], (err, res) => {
          if (err) {
            return cb(err)
          }

          if (res) {
            this.stats.hits++
            oRet[key] = this._unwrap(this.storage.data[key])
          } else {
            this.stats.misses++
          }
        })
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
    const args = arguments.length ? Array.prototype.slice.call(arguments, 1) : []
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

    this.storage._get(key, (err, res) => {
      if (err) {
        return cb(err)
      }

      // TODO: refactor for branch depth
      if (res) {
        this._check(key, res, (err, success) => {
          if (err) {
            return cb(err)
          }

          if (success) {
            if (ttl > 0) {
              this.storage._set(key, this._wrap(res.v, ttl, false), (err, res) => {
                if (err) {
                  return cb(err)
                }
                return cb(null, true)
              })
            } else {
              this.del(key, (err) => {
                if (err) {
                  return cb(err)
                }
                return cb(null, true)
              })
            }
          }
        })
      }
    })
  }

  getTTL (key, cb) {
    this.storage._get(key, (err, res) => {
      if (err) {
        return cb(err)
      }

      const _ttl = res.t
      return cb(null, _ttl)
    })
  }

  keys (cb) {
    const _keys = Object.keys(this.storage.data)
    return cb(null, _keys)
  }

  getStats () {
    return this.stats
  }

  flushAll (_startPeriod) {
    if (_startPeriod == null) {
      _startPeriod = true
    }

    this.storage.data = {}

    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0
    }

    this._killCheckPeriod()
    this._checkData(_startPeriod)
    process.nextTick(() => { this.emit('flush') })
  }

  _checkData (startPeriod) {
    if (startPeriod == null) {
      startPeriod = true
    }

    // TODO: re-enable this check
    // const ref = this.storage.data
    // for (let key in ref) {
    //   let value = ref[key]
    //   this._check(key, value)
    // }

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

  _check (key, data, cb) {
    if (data.t !== 0 && data.t < Date.now()) {
      this.del(key, (err) => {
        if (err) {
          return cb(err, false)
        }
        return cb(null, false)
      })
    } else {
      return cb(null, true)
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
    error.message = type
    error.data = data

    if (cb && _isFunction(cb)) {
      cb(error, null)
    } else {
      return error
    }
  }
}

module.exports = NNash
module.exports.Storage = Storage
