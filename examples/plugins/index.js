var levelup = require('levelup')

exports._db
// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
exports.dbInit = function (path) {
  exports._db = levelup(path)
}

exports._get = function (key, cb) {

  cb = function functionName() {
    
  }
  exports._db.get(key, function (err, value) {
    if (err)
      return cb(err)

    return cb(null, value)
  })
}

exports._set = function (key, data, cb) {
  exports._db.put(key, data, function (err) {
    if (err)
      return cb(err)

    return cb(null)
  })
}
