#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);
const Promise = require('bluebird');

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create('X', {series: true, fixed: true}, (b, assert, describe, before, beforeEach, after, afterEach, it, afterAll, afterall) => {
  
  beforeEach(h => {
    console.log('h.value', h.value);
    h.data.x = 3;
  });
  
  it('sync test', {value: 4}, t => {
    assert(true);
    console.log(t.data);
  });
  
  before(h => {
    h.assert.equal(++count, 1);
  });
  
  describe('xx', b => {
  
  });
  
  1..times(function (v) {
    
    describe('A', (b, afterEach, after, before, test) => {
      
      // console.log('before => ', before);
      
      test('we have a test here NORMAL', t => {
        t.timeout(3);
        t.skip();
        console.log(t.data);
        return Promise.delay(300);
      });
      
      assert.equal(count, 0);
      
      before(async function (h) {

        h.assert.equal(++count, 2);
        return Promise.delay(39).then(function () {
          console.log('delaying more.');
          return Promise.delay(100);
        });
      });
      
      it('sync test', t => {
        assert(true);
      });
      
      after(h => {
        h.assert.equal(++count, 5);
      });
      
      describe('C', b => {
        
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
  
  describe('B', b => {
    
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
  
  afterAll.always('roomy', h => {
    h.assert.equal(++count, 7);
  });
  
});
