#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);


Test.create('name this test',function (assert, describe, it, beforeEach) {

  describe('A', {parallel: true}, function(){

    beforeEach.cb(t => {
      setTimeout(t, 1000);
    });


    it('one', function(){


    });

    it('two', function(){


    });

    it('three', function(){


    });

  });

});
