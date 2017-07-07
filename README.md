# middleware-cache [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

# middleware-cache

```sh
$ npm install --save middleware-cache
```

## Overview

The middleware cache is a higher order component that stores the results of an express middleware function in a repository so that repetitive long running calls can be made more efficient.

For examples of repositories you can use, checkout this repo.
[Node Repositories](https://github.com/blugavere/node-repositories)

Most likely you will want to use an in-memory cache or a [redis cache](https://github.com/blugavere/node-repositories#redis). Caching in something like mongo will require you to invalidate the cache on your own.

## Options
- key: string or hash function to determine where to store in db. note that this should be namespaced for the middleware type.
- selector: function to pick the resulting cacheable data out of the ORIGINAL middleware result.

## Usage

```js

// pass the data store into the cache function
const cache = require('middleware-cache')(repo);

const middleware = (req, res, next) => {
  res.locals.complete = true;
  setTimeout(next, 500);
};

const options = {
  key: (req, res) => `orderHistory|${req.user._id}`
  param: 'orderHistory',
  expire: 1000 //todo
};

const cachedMiddleware = cache(middleware, options);

app.use(cachedMiddleware);
app.get('/foo', cachedMiddleware, (req, res) => res.send({}));

```

[npm-image]: https://badge.fury.io/js/middleware-cache.svg
[npm-url]: https://npmjs.org/package/middleware-cache
[travis-image]: https://travis-ci.org/giddyinc/middleware-cache.svg?branch=master
[travis-url]: https://travis-ci.org/giddyinc/middleware-cache
