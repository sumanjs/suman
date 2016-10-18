

The best patterns to use with Suman to get the most out of the framework.


1. Inject dependencies with suman.ioc.js



2. Use the delay functionality to source dependencies asynchronously before registering any given test cases.

```js

Test.describe('A', {}, function(fs, delay){
  
      const $items = null;
  
     fs.readDir('some-unit-test-dir', function(err, items){
               err && throw err;
               $items = items;
               delay(); // all describe blocks have already been registered, and now we execute their respective callbacks
     });
     
     
     this.describe(function(){
     
             this.describe(require('a'));
             this.describe(require('b'));
             
             $items.forEach(item => {
                 this.describe(require(item));
             });
     
     });


});

```