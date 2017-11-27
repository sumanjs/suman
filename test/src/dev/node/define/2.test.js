#!/usr/bin/env node

const suman = require('suman');
const {Test} = suman.init(module);


Test.define('ballistic')
  .parallel(true)
  .run(function (b, test, context, after) {
    
    b.set('a', {foo: true});
    
    
    context('inner', b => {
      
      b.set('b', {bar: 4});
      
      test.define('rghh')
        .run(t => {
          const z = b.get('a');
          z.foo = 5;
        })
        .run(t => {
          const z = b.get('a');
          t.assert.equal(z.foo, 5);
        });
    });
    
    after.define('hi')
      .run(h => {
        const z = b.get();
      });
    
  });

Test.define('ballistic', v => {
  
  v.parallel(true)
    .run(function (b, test, context, after) {
      
      b.set('a', {foo: true});
      
      context('inner', b => {
        
        b.set('b', {bar: 4});
        
        test.define('rghh')
          .run(t => {
            const z = b.get('a');
            z.foo = 5;
          })
          .run(t => {
            const z = b.get('a');
            t.assert.equal(z.foo, 5);
          });
      });
      
      after.define('hi')
        .run(h => {
          debugger;
          const z = b.get();
          debugger;
        });
      
    })
    .run(function (b, test, context, after) {
      
      b.set('a', {foo: true});
      
      context('inner', b => {
        
        b.set('b', {bar: 4});
        
        test.define('rghh')
          .run(t => {
            const z = b.get('a');
            z.foo = 5;
          })
          .run(t => {
            const z = b.get('a');
            t.assert.equal(z.foo, 5);
          });
      });
      
      after.define('hi')
        .run(h => {
          debugger;
          const z = b.get();
          debugger;
        });
      
    })
    .run(function (b, test, context, after) {
      
      b.set('a', {foo: true});
      
      context('inner', b => {
        
        b.set('b', {bar: 4});
        
        test.define('rghh')
          .run(t => {
            const z = b.get('a');
            z.foo = 5;
          })
          .run(t => {
            const z = b.get('a');
            t.assert.equal(z.foo, 5);
          });
      });
      
      after.define('hi')
        .run(h => {
          debugger;
          const z = b.get();
          debugger;
        });
      
    });
});


