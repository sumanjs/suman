#!/usr/bin/env node
// 'use strict';

const suman = require('suman');
const Test = suman.init(module);

///////////////////////////////////////////////////////////////////////

let count = 0;

const su = require('suman-utils');

const isolated2 = function (fn) {

  const str = String(fn).trim();

  if (str.indexOf('async') === 0) {
    throw new Error('Cannot use async functions for isolated scopes.');
  }

  if (str.indexOf('function') !== 0 && !/=>\s*{/.test(str)) {
    throw new Error('Cannot use functions without outer braces.');
  }

  const first = str.indexOf('{') + 1;
  const last = str.lastIndexOf('}');
  const body = str.substr(first, last - first);
  console.log('body:', body);
  const paramNames = su.getArgumentNames(str);
  return new Function(...paramNames.concat(body));
};

function isolated(fn) {
  return new Function(`
    with (new Proxy({}, {
      has() { return true; },
      get(target, property) {
        if (typeof property !== 'string') return target[property];
        throw new ReferenceError(property + ' accessed from isolated scope');
      }
    })) return ${Function.prototype.toString.call(fn)}
  `).call(new Proxy(function () {
  }, new Proxy({}, {
    get() {
      throw new ReferenceError('this accessed from isolated scope');
    }
  })));
}



Test.create((assert, describe, before, beforeEach, after, afterEach, it) => {

  before(async h => {
    h.assert.equal(++count, 1);
    h.supply.three = 3;
  });

  it.cb('sync test', async t => {
    t.assert.equal(++count, 2);
    t.assert.equal(t.supply.three, 3);
    t.done();
  });

  after.cb(async h => {
    h.assert.equal(++count, 26);
    h.ctn();
  });

  it.cb('zoom', new Function(
    'h', [
      'console.log(h);;',
      'h.ctn();'
    ]
    .join(';')
  ));

  const foo = 3;
  it.cb('zoom', isolated(h => {
    // console.log(foo);
    const x = foo;
    h.ctn();
  }));

  before(h => {
    h.supply.foo = 3;
  });

  it.cb('zoom', suman.isolated(function (t) {
    console.log('fooooo:', t.supply.foo);
    t.ctn();
  }));

  describe('here we go', function (b) {

    before(async h => {
      h.assert.equal(++count, 3);
      h.assert.equal(h.supply.three, 3);
    });

    it.cb('sync test', async t => {
      t.assert.equal(++count, 4);
      t.assert.equal(t.supply.three, 3);
      t.done()
    });

    after.cb(async h => {
      h.assert.equal(++count, 25);
      h.ctn();
    });

    describe('here we go', function (b) {

      before(async h => {
        h.assert.equal(++count, 5);
      });

      it('sync test', async t => {
        t.assert.equal(++count, 6);
      });

      after(async h => {
        h.assert.equal(++count, 19);
      });

      describe('here we go', function (b) {

        before(async h => {
          h.assert.equal(++count, 7);
        });

        it('sync test', async t => {
          t.assert.equal(++count, 8);
        });

        after.cb(async h => {
          h.assert.equal(++count, 13);
          h.ctn();
        });

        after(async h => {
          h.assert.equal(++count, 14);
        });

        describe('here we go', function (b) {

          before(async h => {
            h.assert.equal(++count, 9);
          });

          it('sync test', async t => {
            t.assert.equal(++count, 10);
          });

          after.cb(async h => {
            h.assert.equal(++count, 11);
            h.ctn();
          });

          after(async h => {
            h.assert.equal(++count, 12);
          });

        });

      });

      describe('here we go', function (b) {

        before(async h => {
          h.assert.equal(++count, 15);
        });

        after.cb(async h => {
          h.assert.equal(++count, 17);
          h.ctn();
        });

        it('sync test', async t => {
          t.assert.equal(++count, 16);
        });

        after(async h => {
          h.assert.equal(++count, 18);
        });

      });

    });

    describe('here we go', function (b) {

      before(async h => {
        h.assert.equal(++count, 20);
      });

      after.cb(async h => {
        h.assert.equal(++count, 23);
        h.ctn();
      });

      it('sync test', async t => {
        t.assert.equal(++count, 21);
      });

      it.cb('sync test', async t => {
        t.assert.equal(++count, 22);
        t.done();
      });

      after(async h => {
        h.assert.equal(++count, 24);
      });

    });

  });

});
