const suman = require('suman');
const {Test} = suman.init(module);

Test.define('age').parallel(true)
  .run((b, test, describe) => {
    
    b.set('3', 5);
    
    test.define('here we go')
      .timeout(400)
      .parallel(true)
      .run(t => {
        t.assert(false, 'bust a move');
      });
    
  })
  .run((b, test) => {
    
    b.set('3', 5);
    
    test('here', t => {
        t.assert(true);
    });
  
    test('here', t => {
      t.assert(true);
    });
  
    test('here', t => {
      t.assert(true);
    });
  
    test.define('here we go')
      .timeout(400)
      .parallel(true)
      .run(t => {
        t.assert(false, 'bust a move');
      });
  
  });


return;

Test.define('here we go', v => {
  
  v.timeout(5)
    .run(function (it, test) {
      
      test.define('here is a name', v => {
        v.timeout(1)
          .run(t => {
          
          })
          .run(t => {
          
          })
          .run(t => {
          
          })
          .run(t => {
          
          });
      })
      
    });
  
  Test.create(function (it, test) {
    
    test.define('here is a name', v => {
      
      test.define('here is a name', v => {
        
        v.timeout(1)
          .run(t => {
          
          })
          .run(t => {
          
          })
          .run(t => {
          
          })
          .run(t => {
          
          });
      });
      
      v.timeout(1)
        .run(t => {
        
        })
        .run(t => {
        
        })
        .run(t => {
        
        })
        .run(t => {
        
        });
    });
    
    
  });
  
});
