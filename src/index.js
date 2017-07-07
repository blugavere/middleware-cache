'use strict';

const sha1 = require('sha1');

const getDefaultKey = selector => req => `cache:${selector}:${sha1(JSON.stringify(req.params))}`;

module.exports = (repo, opts) => {
  opts = opts || {};
  if (!opts.namespace) {
    opts.namespace = 'cache';
  }

  return function (selector, middleware, options) {
    options = options || {};
    const expire = options.expire || 500;
    const key = options.key || getDefaultKey(selector);

    if (!selector || !middleware) {
      throw new Error('Selector and middleware are required.');
    }

    return (req, res, next) => {
      let hash = key;
      if (typeof key === 'function') {
        hash = key(req, res);
      }
      return repo.findOne(hash, (err, cachedResult) => {
        if (err) {
          return next(err);
        }
        if (cachedResult) {
          res.locals[selector] = cachedResult.value;

          if (res.locals[opts.namespace]) {
            res.locals[opts.namespace].push(selector);
          } else {
            res.locals[opts.namespace] = [selector];
          }

          return next();
        }

        middleware(req, res, () => {
          const value = res.locals[selector];
          const obj = {
            _id: hash,
            value
          };
          repo.add(obj, {expire}, () => {});
          next();
        });
      });
    };
  };
};
