const Cache = require('../../')
const LevelDBPlugin = require('./')

LevelDBPlugin.dbInit('./mydb')

const cache = new Cache({
  plugins: [
    LevelDBPlugin
  ]
})

const obj = { my: 'Special', variable: 42 }

cache.set('myKey', obj, function (err, success) {
  if(!err && success) {
    console.log(success)
    // true
    cache.get('myKey', function(err, value) {
      if(!err) {
        if(value == undefined) {
          // key not found
        } else {
          console.log(value)
          // { my: "Special', variable: 42 }
          // ... do something ...
        }
      }
    })
  }
})
