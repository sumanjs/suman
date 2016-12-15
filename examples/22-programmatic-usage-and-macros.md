

You can use Suman programmatically. This is like test macros.

// test.js

import * as suman from 'suman';
const Test = suman.init(module);

Test.create('example', function(it){
 
      it('has legs', t => {
        
         assert(true);
          
      });
});


// other.file.js

import * as suman from 'suman';
const test = suman.load('./test.js');
test.on('test', t => t.apply(null,[1,2,3]));

