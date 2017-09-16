'use strict';

const suman = require('suman');
const Test = suman.init(module);

///////////////////////////////////////////

Test.create('hotels', {parallel: false}, function (it, before, beforeEach) {

  it.cb('first', t => {
    setTimeout(t, 2000);
  });

});

Test.create('hotels', {parallel: false}, function (it, before, beforeEach) {

  console.log('we in.');

  it.cb('second', t => {
    setTimeout(t, 1000);
  });

});

