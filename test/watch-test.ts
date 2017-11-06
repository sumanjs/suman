#!/usr/bin/env node

const suman = require('suman');
const {Test} = suman.init(module);

console.log('zoee');

// how many roads, ny s
Test.create('yolo', function (it) {

  it('maxxes out1', t => {

  });

  it('maxxes out2', t => {

  });

  it.cb('mokkoout2', t => {
    setTimeout(function () {
      t.done();
    }, 3);
  });

});
