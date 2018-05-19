#!/usr/bin/env node

import suman = require('suman');
const {Test} = suman.init(module);

console.log('zoee');


Test.create('yolo', function (b, it) {
  
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
