nnash
===========

[![Build Status](https://secure.travis-ci.org/eljefedelrodeodeljefe/nnash.svg?branch=master)](http://travis-ci.org/eljefedelrodeodeljefe/nnash)
[![Build Status](https://david-dm.org/eljefedelrodeodeljefe/nnash.svg)](https://david-dm.org/eljefedelrodeodeljefe/nnash)
[![NPM version](https://badge.fury.io/js/nnash.svg)](http://badge.fury.io/js/nnash)
[![Coverage Status](https://coveralls.io/repos/github/eljefedelrodeodeljefe/nnash/badge.svg?branch=master)](https://coveralls.io/github/eljefedelrodeodeljefe/nnash?branch=master)

[![NPM](https://nodei.co/npm/nnash.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/nnash/)

# Simple and fast NodeJS internal caching.

A simple caching module that has `set`, `get` and `delete` methods and works a little bit like memcached.  
Keys can have a timeout (`ttl`) after which they expire and are deleted from the cache.  
All keys are stored in a single object so the practical limit is at around 1m keys.

# Install

```bash
  npm install nnash --save
```

# Examples:

## Initialize (INIT):

```js
const Cache = require('nnash')
const cache = new Cache(options)
```

### Options

- `stdTTL`: *(default: `0`)* the standard ttl as number in seconds for every generated cache element.  
`0` = unlimited
- `checkperiod`: *(default: `600`)* The period in seconds, as a number, used for the automatic delete check interval.  
`0` = no periodic check.
- `errorOnMissing`: *(default: `false`)* en/disable throwing or passing an error to the callback if attempting to `.get` a missing or expired value.
- `useClones`: *(default: `true`)* en/disable cloning of variables. If `true` you'll get a copy of the cached variable. If `false` you'll save and get just the reference.  
**Note:** `true` is recommended, because it'll behave like a server-based caching. You should set `false` if you want to save complex variable types like functions, promises, regexp, ...

```js
const Cache = require('nnash')
const cache = new Cache({ stdTTL: 100, checkperiod: 120 } );
```

## Store a key (SET):

`cache.set( key, val, [ ttl ], [callback] )`

Sets a `key` `value` pair. It is possible to define a `ttl` (in seconds).  
Returns `true` on success.

```js
const obj = { my: 'Special', variable: 42 }
cache.set('myKey', obj, function (err, success) {
  if(!err && success) {
    console.log(success)
    // true
    // ... do something ...
  }
})
```

> Note: If the key expires based on it's `ttl` it will be deleted entirely from the internal data object.

**Since `1.0.0`**:  
Callback is now optional. You can also use synchronous syntax.

```js
const obj = { my: 'Special', variable: 42 }
const success = cache.set('myKey', obj, 10000 )
// true
```


## Retrieve a key (GET):

`cache.get(key, [callback])`

Gets a saved value from the cache.
Returns a `undefined` if not found or expired.
If the value was found it returns an object with the `key` `value` pair.

```js
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
```

**Since `1.0.0`**:  
Callback is now optional. You can also use synchronous syntax.

```js
value = cache.get('myKey')
if ( value == undefined ) {
  // handle miss!
}
// { my: "Special', variable: 42 }
```

**Since `2.0.0`**:  

The return format changed to a simple value and a `ENOTFOUND` error if not found *( as `callback( err )` or on sync call as result instance of `Error` )*.

**Since `2.1.0`**:

The return format changed to a simple value, but a due to discussion in #11 a miss shouldn't return an error.
So after 2.1.0 a miss returns `undefined`.

**Since `3.1.0`**
`errorOnMissing` option added

```js
try{
    value = cache.get('not-existing-key', true );
} catch (err) {
    // ENOTFOUND: Key `not-existing-key` not found
}
```

## Get multiple keys (MGET):

`cache.mget( [ key1, key2, ... ,keyn ], [callback] )`

Gets multiple saved values from the cache.
Returns an empty object `{}` if not found or expired.
If the value was found it returns an object with the `key` `value` pair.

```js
cache.mget([ 'myKeyA', 'myKeyB' ], function (err, value) {
  if (!err) {
    console.log(value)
    /*
      {
        "myKeyA": { my: 'Special', variable: 123 },
        "myKeyB": { the: 'Glory', answer: 42 }
      }
    */
    // ... do something ...

});
```

**Since `1.0.0`**:  
Callback is now optional. You can also use synchronous syntax.

```js
const value = cache.mget([ 'myKeyA', 'myKeyB' ])
/*
  {
    "myKeyA": { my: "Special', variable: 123 },
    "myKeyB": { the: "Glory', answer: 42 }
  }
*/
```

**Since `2.0.0`**:  

The method for mget changed from `.get([ 'a', 'b' ] )` to `.mget( [ 'a', 'b' ])`

## Delete a key (DEL):

`cache.del(key, [callback])`

Delete a key. Returns the number of deleted entries. A delete will never fail.

```js
cache.del('myKey', function( err, count ){
  if( !err ){
    console.log( count ); // 1
    // ... do something ...
  }
});
```

**Since `1.0.0`**:  
Callback is now optional. You can also use synchronous syntax.

```js
value = cache.del('A');
// 1
```

## Delete multiple keys (MDEL):

`cache.del( [ key1, key2, ... ,keyn ], [callback] )`

Delete multiple keys. Returns the number of deleted entries. A delete will never fail.

```js
cache.del([ 'myKeyA', 'myKeyB' ], function (err, count) {
  if (!err) {
    console.log(count) // 2
    // ... do something ...
  }
})
```

**Since `1.0.0`**:  
Callback is now optional. You can also use synchronous syntax.

```js
value = cache.del('A');
// 1

value = cache.del([ 'B', 'C' ])
// 2

value = cache.del([ 'A', 'B', 'C', 'D' ])
// 1 - because A, B and C not exists
```

## Change TTL (TTL):

`cache.ttl( key, ttl, [callback] )`

Redefine the ttl of a key. Returns true if the key has been found and changed. Otherwise returns false.  
If the ttl-argument isn't passed the default-TTL will be used.

```js
const cache = new NodeCache({ stdTTL: 100 })
cache.ttl('existendKey', 100, function (err, changed) {
  if (!err) {
    console.log( changed ); // true
    // ... do something ...
  }
});

cache.ttl('missingKey', 100, function (err, changed) {
  if (!err) {
    console.log(changed) // false
    // ... do something ...
  }
});

cache.ttl('existendKey', function (err, changed) {
  if (!err) {
    console.log(changed) // true
    // ... do something ...
  }
})
```

## Get TTL (getTTL):

`cache.getTTL(key, [callback])`

Receive the ttl of a key.
You will get:
- `undefined` if the key does not exist
- `0` if this key has no ttl
- a timestamp in ms until the key expires

```js
const cache = new NodeCache({ stdTTL: 100 })

// Date.now() = 1456000500000
cache.set('ttlKey', 'MyExpireData')
cache.set('noTtlKey', 0, 'NonExpireData')

const ts = cache.getTTL('ttlKey')
// ts wil be approximately 1456000600000

cache.getTTL('ttlKey', function( err, ts ){
  if (!err) {
    // ts wil be approximately 1456000600000
  }
})
// ts wil be approximately 1456000600000

const ts = cache.getTTL('noTtlKey')
// ts = 0

const ts = cache.getTTL('unknownKey')
// ts = undefined

```

## List keys (KEYS)

`cache.keys( [callback] )`

Returns an array of all existing keys.  

```js
// async
cache.keys(function (err, mykeys) {
  if (!err) {
    console.log( mykeys )
   // [ "all', "my', "keys', "foo', "bar" ]
  }
})

// sync
const mykeys = cache.keys()

console.log( mykeys )
// [ "all', "my', "keys', "foo', "bar" ]
```

## Statistics (STATS):

`cache.getStats()`

Returns the statistics.  

```js
cache.getStats()
  /*
    {
      keys: 0,    // global key count
      hits: 0,    // global hit count
      misses: 0,  // global miss count
      ksize: 0,   // global key size count
      vsize: 0    // global value size count
    }
  */
```

## Flush all data (FLUSH):

`cache.flushAll()`

Flush all data.  

```js
cache.flushAll();
cache.getStats();
  /*
    {
      keys: 0,    // global key count
      hits: 0,    // global hit count
      misses: 0,  // global miss count
      ksize: 0,   // global key size count
      vsize: 0    // global value size count
    }
  */
```

## Close the cache:

`cache.close()`

This will clear the interval timeout which is set on check period option.

```js
cache.close()
```

# Events

## set

Fired when a key has been added or changed.
You will get the `key` and the `value` as callback argument.

```js
cache.on('set', function( key, value ){
  // ... do something ...  
});
```

## del

Fired when a key has been removed manually or due to expiry.
You will get the `key` and the deleted `value` as callback arguments.

```js
cache.on('del', functionv(key, value) {
  // ... do something ...  
})
```

## expired

Fired when a key expires.
You will get the `key` and `value` as callback argument.

```js
cache.on('expired', function (key, value) {
  // ... do something ...  
})
```

## flush

Fired when the cache has been flushed.

```js
cache.on('flush', function () {
  // ... do something ...  
})
```

## Benchmarks

### Version 1.1.x

After adding io.js to the travis test here are the benchmark results for set and get of 100000 elements.
But be careful with this results, because it has been executed on travis machines, so it is not guaranteed, that it was executed on similar hardware.

**node.js `0.10.36`**  
SET: `324`ms ( `3.24`µs per item )  
GET: `7956`ms ( `79.56`µs per item )   

**node.js `0.12.0`**  
SET: `432`ms ( `4.32`µs per item )  
GET: `42767`ms ( `427.67`µs per item )   

**io.js `v1.1.0`**  
SET: `510`ms ( `5.1`µs per item )  
GET: `1535`ms ( `15.35`µs per item )   

### Version 2.0.x

Again the same benchmarks by travis with version 2.0

**node.js `0.6.21`**  
SET: `786`ms ( `7.86`µs per item )  
GET: `56`ms ( `0.56`µs per item )   

**node.js `0.10.36`**  
SET: `353`ms ( `3.53`µs per item )
GET: `41`ms ( `0.41`µs per item )   

**node.js `0.12.2`**  
SET: `327`ms ( `3.27`µs per item )  
GET: `32`ms ( `0.32`µs per item )   

**io.js `v1.7.1`**  
SET: `238`ms ( `2.38`µs per item )  
GET: `34`ms ( `0.34`µs per item )  

> As you can see the version 2.x will increase the GET performance up to 200x in node 0.10.x.
This is possible because the memory allocation for the object returned by 1.x is very expensive.

### Version 3.0.x

*see [travis results](https://travis-ci.org/eljefedelrodeodeljefe/nnash/builds/64560503)*

**node.js `0.6.21`**  
SET: `786`ms ( `7.24`µs per item )  
GET: `56`ms ( `1.14`µs per item )   

**node.js `0.10.38`**  
SET: `353`ms ( `5.41`µs per item )
GET: `41`ms ( `1.23`µs per item )   

**node.js `0.12.4`**  
SET: `327`ms ( `4.63`µs per item )  
GET: `32`ms ( `0.60`µs per item )   

**io.js `v2.1.0`**  
SET: `238`ms ( `4.06`µs per item )  
GET: `34`ms ( `0.67`µs per item )

> until the version 3.0.x the object cloning is included, so we lost a little bit of the performance

### Version 3.1.x

**node.js `v0.10.41`**  
SET: `305ms`  ( `3.05µs` per item )  
GET: `104ms`  ( `1.04µs` per item )

**node.js `v0.12.9`**  
SET: `337ms`  ( `3.37µs` per item )  
GET: `167ms`  ( `1.67µs` per item )

**node.js `v4.2.6`**  
SET: `356ms`  ( `3.56µs` per item )  
GET: `83ms`  ( `0.83µs` per item )

## Compatibility


# The MIT License (MIT)
