#!/usr/bin/env ts-node
'use strict';

import suman, {s} from 'suman';

const {Test} = suman.init(module, {
  override: {
    opts: {
      allowSkip: true,
    },
    config: {}
  }
});

///////////////////////////////////////////////////////////////////////

let count = 0;

const opts = {
  series: true,
  fixed: true
};

global.Promise = require('bluebird');

Test.create(opts, ['rudolph', function (b, assert, describe, before, beforeEach, after, afterEach, it, inject) {
  
  // inject('eage', t => {
  //   return t.registerFnMap({
  //     a: function (cb) {
  //       // await Promise.delay(300);
  //       return process.nextTick(cb, null, 'dogs');
  //     },
  //     b: async function () {
  //       return 'dogs';
  //     }
  //   });
  // });
  
  inject('eage', t => {
    return t.registerFnMap({
      a: function (cb) {
        // await Promise.delay(300);
        return process.nextTick(cb, null, 'dogs');
      },
      b: function (cb) {
        process.nextTick(cb, null, 'dogs');
      }
    });
  });
  
  it('hagieao agoeajgoea', t => {
    t.assert(true);
  });
  
  it.skip['retries:5, name:hi']('zoom', t => {
  
  });
  
  before('hi', [h => {
    h.assert.equal(++count, 1);
  }]);
  
  describe('zoom', b => {
    
    describe('nested1', {}, (b) => {
      
      const a = b.getInjectedValue('a');
      console.log('a is => ', a);
      
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
