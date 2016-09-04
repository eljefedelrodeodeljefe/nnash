const Cache = require('../')
const cache = new Cache({ stdTTL: 100, checkperiod: 120 } );

const obj = { my: 'Special', variable: 42 }

cache.set('myKey', obj, function (err) {
  if (err) {
    console.log(err)
  }

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

})
