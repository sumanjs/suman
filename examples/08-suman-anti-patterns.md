There are several anti-patterns when using Suman


1. self/that. I am personally a fan of self/that usage. However, when using Suman, it is indeed an anti-pattern. If you notice that you
have used "self" or "that" instead of "this" to call something from the Suman API, then you should write your code to avoid the self pattern when using Suman. With arrow functions, you can
avoid the self/that pattern, when using functional loops for example. The reason to avoid self/that is that a reference to self/that might show up in a nested describe block and then
you may start registering test cases and hooks to the wrong block. You should always use "this" when calling this.describe/this.before/this.after etc, and you will be all good.

2. Putting code outside of and above ```Test.describe``` (the call that creates the root suite). As much code of your test code as possible should be inside the Test.describe callback.
There are several reasons for this. It makes it a bit easier to see the title of your suite. It also minimizes the 
amount of code loaded before a test suite is actually run. If you have a lot of code above your Test.describe call, it probably means you aren't using the 
Suman helper files effectively or correctly, (suman.ioc.js, suman.order.js, suman.hooks.js, etc).

3. Arrow functions, generator functions, or async/await for describe blocks. Arrow functions are useful for Suman, and they can be used everywhere except 
for describe blocks. This has to do with arrow functions binding the context for the callback to the wrong value. Describe blocks are designed to bind the callback to a new value (not the context of the current lexical scope), and to register
all API calls synchronously. Suman is designed to throw an exception if any library call is made after a describe block function has returned.

4. Nesting hooks and test cases. Describe blocks (aka child suites) are supposed to be nested! But hooks and test cases are not designed to be nested.
Suman will throw an error if you try to do it, whereas Mocha would let you errantly do it; see this issue:
https://github.com/mochajs/mocha/issues/1975, LOL, sorry Tom, wasn't me.


5. Using process.nextTick or setImmediate in hook / test callbacks

```js

// not necessary to do this
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
        done();   // callign done in the same tick is just fine
      }

});
```
