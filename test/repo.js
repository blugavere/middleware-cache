
'use strict';

const uuid = require('uuid');

class Repo {
  constructor() {
    this.data = {};
    this.add = this.add.bind(this);
    this.findOne = this.findOne.bind(this);
  }
  findOne(id, cb) {
    const self = this;
    return cb(null, self.data[id] || null);
  }
  add(obj, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    const id = obj._id ? obj._id : uuid.v4();
    this.data[id] = obj;
    setTimeout(() => {
      delete this.data[obj._id];
    }, options.expire || 30);
    return cb(null, obj);
  }
}

module.exports = new Repo();
