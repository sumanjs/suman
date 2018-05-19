"use strict";

const suman = require('suman');
const {Test} = suman.init(module);

var sleep = timeout => {
  return new Promise(resolve => {
    setTimeout(t => {
      console.log(`I was sleeping ${timeout} ms`);
      resolve();
    }, timeout);
  });
};

var error = (timeout,v) => {
  setTimeout(t => {
    throw new Error("BOOM!!! " + v);
  }, timeout);
};

Test.create((describe, it) => {

  describe("scope", b => {
    
    it ("test #1", async t => {
      error(100, t.desc);
      await sleep(100);
    });

    it ("test #2", async t => await sleep(100));

    it ("test #3", async t => {
      error(100, t.desc);
      await sleep(100);
    });

    it ("test #4", async t => await sleep(100));
    it ("test #5", async t => await sleep(100));
    it ("test #6", async t => await sleep(100));
  });
  
});
