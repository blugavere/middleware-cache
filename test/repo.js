
'use strict';

const uuid = require('uuid');

const repo = {
  data: {},
  findOne(id) {
    return Promise.resolve(this.data[id] || null);
  },
  create(obj) {
    const id = obj._id ? obj._id : uuid.v4();
    this.data[id] = obj;
    setTimeout(() => {
      delete this.data[obj._id];
    }, 10);
    return Promise.resolve(obj);
  }
};

module.exports = repo;
