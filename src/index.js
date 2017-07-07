'use strict';

module.exports = (repo, opts) => {
  opts = opts || {};
  if (!opts.namespace) {
    opts.namespace = 'cache';
  }

  return function (middleware, options) {
    options = options || {};
    const key = options.key;
    const selector = options.selector;

    if (!key || !selector) {
      throw new Error(`Key and selector are required. ${key}, ${selector}`);
    }

    // return higher order middleware
    return (req, res, next) => {
      let hash = key;
      if (typeof key === 'function') {
        hash = key(req, res);
      }
      // if(hash is string) else treat hash as selector from req/res
      return repo.findOne(hash)
        .then(cachedResult => {
          console.log('cached result', cachedResult);
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
            console.log('mw result', obj, res.locals);
            return repo.create(obj).then(() => {
              next();
            });
          });
        });
    };
  };
};
