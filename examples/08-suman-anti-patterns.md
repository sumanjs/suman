There are several anti-patterns when using Suman


1. self/that. I am personally a fan of self/that usage. However, when using Suman, it is indeed an anti-pattern. If you notice that you
have used self or that instead of this, then you should write your code to avoid the self pattern when using Suman. With arrow functions, you can
avoid the self/that pattern, when using functional loops for example.

2. Putting code outside of ```Test.describe```. As much code of your test code as possible should be inside the Test.describe callback.
There are several reasons for this. It makes it a bit easier to see the title of your suite. It also minimizes the 
amount of code loaded before a test suite is actually run.

3. Arrow functions for describe blocks. Arrow functions are useful for Suman, and they can be used everywhere except 
for describe blocks. This has to do with arrow functions binding the context for the callback to the wrong value.

4. Nesting hooks and test cases. Describes are supposed to be nested! But every other callback is not designed to be nested.
Suman will throw an error if you try to do it, whereas Mocha would let you errantly do it; see this issue LOL,
https://github.com/mochajs/mocha/issues/1975, sorry Tom, wasn't me.


5. Using nextTick or setImmediate in hook / test callbacks

```js

// not ideal
this.it('not necesary', function(done){

       var c;
      if(c = condition()){
          c.doSomethingAsync().then(function(val){
               done(null,val)
          });
      }
      else{
        process.nextTick(done);   // no need to wrap in nextTick call
      }

});

// this is better
this.it('not necesary', function(done){
      var c;
           if(c = condition()){
               c.doSomethingAsync().then(function(val){
                    done(null,val)
               });
           }
      else{
        done();   // this is just fine
      }

});
```
