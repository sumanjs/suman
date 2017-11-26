#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

Test.define('groovy', v => {
  
  debugger;
  
  v.timeout(10)
    .source('age', 'age', 'age')
    .run((b, it, describe, test) => {
      
      b.set('is', 'cool');
      
      test.define('turtle')
      .series(true)
      .cb(true)
        .timeout(1000).run(t => {
        //////////////////// and here too!
        debugger;
        t.assert.equal(b.get('is'), 'cool', 'sandy');
      });
      
      describe('inner', b => {
        
        it('is cool hand luke 1', t => {
        
        });
        
        it('is cool hand luke 2', t => {
        
        });
        
        it('is cool hand luke 3', t => {
        
        });
        
      });
    });
});

Test.define(v => {
  
  v.inject('age', 'age', 'age')
    .source('mika')
    .run((b, before, after, afterEach, it) => {
      
      this.foo = true;
      
      debugger;
      
      const {mika} = b.ioc;
      
      console.log('mika => ', mika);
      
      before.define(v =>
        v.first(true)
          .timeout(300)
          .run(h => {
            debugger;
            console.log('this is before');
          }));
      
      it('is cool 1', t => {
        debugger;
      });
      
    })
    .run((b, before, after, afterEach, it) => {
      
      before.define(v =>
        v.timeout(300)
          .run(h => {
            debugger;
            console.log('this is before');
          }));
      
      it('is cool 2', t => {
      
      });
      
    });
  
});
