'use strict';

require('co-mocha');
const bluebird = require('bluebird');
const expect = require('expect');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('superagent-bluebird-promise').agent();
const middlewareCache = require('../src');
const RedisRepository = require('@repositories/redis');
const redis = require('redis');

const mock = {
  noop() { }
};

const repo = require('./repo');

/**
 * mocha --require clarify lib/index.test.js --watch
 * istanbul cover --print both node_modules/.bin/_mocha -- lib/index.test.js --watch
 * eslint ./path/to/file.test.js --watch
 */

const sendLocals = (req, res) => res.send(res.locals);

describe('cache', () => {
  let sandbox;
  let app;
  let server;
  let cache;
  const selector = 'complete';

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    app = express();
    cache = middlewareCache(repo);
    delete repo.data.foo;
    app.use(bodyParser.json());
    sandbox.stub(mock);

    app.get('/foo', (req, res) => res.send({
      name: 'foo'
    }));

    server = app.listen(3000);
  });

  afterEach(() => {
    sandbox.restore();
    server.close();
  });

  describe('caches', () => {
    const middleware = (req, res, next) => {
      res.locals.complete = true;
      setTimeout(next, 500);
    };

    it('should hit a regular api just fine (and cache)', function * () {
      const res = yield request.get('http://localhost:3000/foo').send();
      expect(res.body.name).toBe('foo');
    });

    it('should not swallow middleware errors', done => {
      const middleware2 = () => {
        throw new Error();
      };

      const options = {
        key: 'foo'
      };

      const cachedMiddleware = cache(selector, middleware, options);

      app.get('/baz', cachedMiddleware, middleware2, sendLocals);

      request.get('http://localhost:3000/baz').send()
        .then(() => done(new Error('Expected promise to reject.')),
        err => {
          expect(err).toExist();
          done();
        });
    });

    it('should cache middleware', function * () {
      const options = {
        key: 'foo',
        expire: 100
      };

      const cachedMiddleware = cache(selector, middleware, options);

      app.get('/baz', cachedMiddleware, sendLocals);

      let res = yield request.get('http://localhost:3000/baz').send();
      expect(res.body.cache).toNotExist('cache shouldent exist at start.');

      yield bluebird.delay(10);

      res = yield request.get('http://localhost:3000/baz').send();
      expect(res.body.cache).toInclude('complete');

      yield bluebird.delay(120);

      res = yield request.get('http://localhost:3000/baz').send();
      expect(res.body.cache).toNotExist();
    });

    it('should cache middleware w hash func', function * () {
      const options = {
        key: req => `foo|${req.query.foo}`
      };

      const cachedMiddleware = cache(selector, middleware, options);

      app.get('/baz', cachedMiddleware, sendLocals);

      let res = yield request.get('http://localhost:3000/baz?foo=bar').send();
      expect(res.body.fromCache).toNotExist();

      res = yield request.get('http://localhost:3000/baz?foo=bar').send();
      expect(res.body.cache).toInclude('complete');

      yield bluebird.delay(100);

      res = yield request.get('http://localhost:3000/baz?foo=bar').send();
      expect(res.body.fromCache).toNotExist();
    });

    it('should cache middleware w default hash func', function * () {
      const cachedMiddleware = cache(selector, middleware);

      app.get('/baz', cachedMiddleware, sendLocals);

      let res = yield request.get('http://localhost:3000/baz?foo=bar').send();
      expect(res.body.fromCache).toNotExist();

      res = yield request.get('http://localhost:3000/baz?foo=bar').send();
      expect(res.body.cache).toInclude('complete');

      yield bluebird.delay(100);

      res = yield request.get('http://localhost:3000/baz?foo=bar').send();
      expect(res.body.fromCache).toNotExist();
    });

    describe('redis', () => {
      let redisRepo;
      let redisCache;
      before(done => {
        redisRepo = new RedisRepository(redis, 'middleware');
        redisCache = middlewareCache(redisRepo);
        redisRepo.clear(done);
      });

      it('should cache in redis', function * () {
        const options = {
          selector: 'complete',
          expire: 1
        };

        const cachedMiddleware = redisCache(options.selector, middleware, options);

        app.get('/baz', cachedMiddleware, sendLocals);

        let res = yield request.get('http://localhost:3000/baz?foo=bar').send();
        expect(res.body.cache).toNotExist('repo should be clear at start');

        res = yield request.get('http://localhost:3000/baz?foo=bar').send();
        expect(res.body.cache).toInclude('complete');

        yield bluebird.delay(1000);

        res = yield request.get('http://localhost:3000/baz?foo=bar').send();
        expect(res.body.cache).toNotExist('Cache should be clear.');
      });
    });
  });
});
