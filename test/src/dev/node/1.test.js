#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {}, {
  // series: false
  allowSkip: true
});

///////////////////////////////////////////////////////////////////////

let count = 0;

const opts = {
  series: true,
  fixed: true
};

Test.define(v => {
  
  v.inject('age', 'age', 'age')
    .names('b', 'before', 'after', 'afterEach')
    .run((b, before, after, afterEach, it) => {
      
      it('is cool', t => {

        // console.log(t);
        debugger;
      
      });
      
    })
    .run((b, before, after, afterEach, it) => {
      
      it('is cool', t => {
      
      });
      
    });
  
});


Test.create(opts, ['rudolph', function (assert, describe, before, beforeEach, after, afterEach, it, inject) {
  
  before.last(h => {
    h.log('mucho before last 1');
  });
  
  before({cb: true, retries: 4}, h => {
    h.done();
  });
  
  before.define(v => {
    
    debugger;
    
    v.run(h => {
      console.log('in the run now 1.');
    });
    
    v.run(h => {
      console.log('in the run now 2.');
    });
  });
  
  // test.define()
  // .retries()
  // .cb(function () {
  //
  // });
  
  before.last(h => {
    h.log('mucho before last 2');
  });
  
  before.last(h => {
    h.log('mucho before last 3');
  });
  
  before(h => {
    console.log('mucho before');
  });
  
  before.first(h => {
    console.log('mucho before first 1');
  });
  
  before.first(h => {
    console.log('mucho before first 2');
  });
  
  before.first(h => {
    console.log('mucho before first 3');
  });
  
  after.last(h => {
    console.log('me after last 3');
  });
  
  after(h => {
    console.log('me after 2');
  });
  
  after.first(h => {
    console.log('me first 1');
  });
  
  it('xxx ', t => {
    assert(true);
    // t.fatal();
  });
  
  it.skip['retries:5, name:hi']('zoom', t => {
  
  });
  
  before('hi', [h => {
    h.assert.equal(++count, 1);
  }]);
  
  describe('nested1', {}, b => {
    
    b.set('a', true);
    
    // console.log('before => ', before);
    assert.equal(count, 0);
    
    before(h => {
      h.assert(h.get('a'));
      h.assert.equal(++count, 2);
    });
    
    it('sync test', t => {
      assert(true);
    });
    
    after(h => {
      h.assert.equal(++count, 5);
    });
    
    describe('nested2', {}, b => {
      
      assert(b.get('a'));
      
      assert.equal(count, 0);
      
      it('sync test', t => {
        assert(true);
      });
      
      before(h => {
        h.assert.equal(++count, 3);
      });
      
      after(h => {
        h.assert.equal(++count, 4);
      });
      
    });
    
  });
  
  describe('nested3', b => {
    
    assert.equal(count, 0);
    
    before('zoomy', h => {
      h.assert.equal(++count, 6);
    });
    
    it('sync test', t => {
      assert(true);
    });
    
  });
  
  after.last('roomy', h => {
    h.assert.equal(++count, 8);
  });
  
  after.always('roomy', h => {
    h.assert.equal(++count, 7);
  });
  
}]);
