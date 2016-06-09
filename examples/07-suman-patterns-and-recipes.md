



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