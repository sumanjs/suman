#Suman

For test suites in your project:

## ```npm install -D suman```

For command line tools:

## ```npm install -g suman```


(disclaimer: Suman is in beta, despite the current version number)

Suman is designed to be a direct successor to Mocha, Chai, Tape and Jasmine. Mocha is most familiar to us and perhaps to you - Mocha was an awesome test library, but has several shortcomings that we experienced ourselves over time, and eventually we wanted a test runner
that we could use that was better than Mocha. If you like Mocha and BDD test interfaces you will love Suman.

The reasons why Mocha and its peers need a replacement are:

* in Mocha everything was run in series, which can take unnecessary amounts of time for async tests
* in Mocha suites were not run in separate processes (necessary for isolation and independence of test results)
* Mocha could not move forward with ES6 features due to certain patterns used
* heavy usage of globals was bringing Mocha down
* Mocha lacked real ability to do true dynamic testing (meaning, registering a dynamic number of it() test cases) ---> e.g., make a network call, get X values, create a test case for each.
* Mocha had confusing and obfuscated context values (values for 'this'), which we have greatly simplified, allowing for the usage of arrow functions (which we guarantee people will try to use in
the most unnecessary places, but we have to deal with it).
* and lastly a BIG ONE: clean reporting - at the command line, using Mocha, logging/debugging output by the developer would obfuscate the test results, nullifying any advantage of reporting tools. Suman has a simple
trick up its sleeve to allow for 100% clean reporting for any test or group of tests. 


Compared to Suman, most testing frameworks are frivolous and dumbed-down, and don't feel robust enough to test mission critical systems.
For example, Tape's ability to pre-load modules using the command line before running tests is sort of a joke
compared to the dependency injection ability of this library.


## Suman features:

* extremely powerful, while aiming to be straightforward, clean, concise, consistent and accurate
* designed with ES6 and ES7 in mind, including async/await and generators
* very simple but powerful dependency injection (DI/IoC) of values and dependencies, 
       * => controlled by the developer (used primarily for injecting values acquired asynchronously, such as DB values)
       * => inspired by familiar tools such as Angular and RequireJS
       * => completely optional, it's the developer's choice whether to incorporate DI or not
       
* bdd interface
* no globals whatsoever
* async test cases and hooks can be run in parallel in any given suite
* suites are run in separate Node.js processes
* a nifty web UI reporter, along with standard command line reports
* ability to store past test reports (backdata) and view test results chronologically with browser to look at trends
* hooks behave just like in Mocha
* syntax and structure is borrowed directly from Mocha so that conversion is as easy as possible
* command line tools and better grep facilities than predecessors
* => prefer standard core assert Node module (unopinionated assertions)


* Suman is designed to be used specifically for integration and system testing, using a BDD interface
* Suman is designed for powerful and full-featured testing of integrated and asynchronous networked systems
* the rules for the before/after/beforeEach/afterEach hooks are identical to the rules with Mocha
* skip/only also work like Mocha


### => We can say with some confidence that Suman is the most powerful test framework for serverside JavaScript on planet Earth,
 because it gives the developer total control and access to a very large set of features.


### Important aside - How is Suman better than AVA?

Suman borrows some excellent features from Mocha that AVA seems to ignore, including the ability
 to use nested describe statements for more control and preventing the sharing of scope. AVA basically
 conned Tape and added concurrency. Suman conned Mocha, added concurrency and dependency injection and 
 less confusing contexts for hooks. Suman has more powerful facilities for asynchronous testing due to Mocha/Chai-style hooks
 and nested describes. Dependency injection ability also makes Suman extremely convenient to use, compared to AVA.


# usage examples

simple example:

```js

const assert = require('assert');   // standard core Node assert module FTW
const suman = require('suman');

const Test = suman.init(module);

Test.describe('FirstExample', function(){     //  our test suite


      this.beforeEach('runs before every it()', t => {
           t.data.foo = 'bar';
      });


     this.it('uno', t => {     // a test case
        assert(t.data,'This will not happen because t.data is predefined by Suman for each test');  
     });

     this.it('dos', t => {       // a test case 
        assert(false,'not good');  
     });
     
     
     this.it('tres', t => {       // a test case 
         return new Promise(function(resolve,reject){                 // obligatory Promise example
                 resolve(null);  //test passes no matter what LOL
           });
       });
     
     
     this.describe('all tests herein will run in parallel', {parallel:true}, function(){
     
          [1,2,3].forEach(item => {
               this.it('item is a number', () => {
                    assert.equal(typeof item,'number');
               });
          });
          
          
          ['a','b','c'].forEach(item => {
                    
               this.it('now we use asynchrony', (t,done) => {
                    setTimeout(function(){
                        done(new Error('Test failed'));
                    }, 2000);
                });
                 
           });
     
     });

});


```

an example with more features:


```js

const assert = require('assert');
const suman = require('suman');

const Test = suman.init(module,'suman.conf.js');  //we now utilize a suman config file which is useful for configuring reporting etc


Test.describe('SecondExample', ['delay', 'db', 'val'], function(delay, db, val){    // normally we only need to inject a couple of values per test

     var results = [];
     
     db.makeDatabaseCall().then(function(values){  // db connection is already made because it was created and injected
         (values || []).filter(function(val){
             return val && val.foo;
          }).forEach(function(val){
               results.push(val);
           });
          
      }).then(function(){
           delay(); // calling this allows us to invoke the next describe callback, this allows us to effectively block so that we can register a dynamic number of test cases (if we want to)
      });
      
     
      this.beforeEach(t => {
            t.data.the = 'clash';  
      });
     
     
      this.beforeEach(async function(t) {     //obligatory ES7 example 
            var ret = await val.somePromiseMaker();  
            return await ret.doSomeThingAsync();
      });
      
     
      this.describe('this does not run until after db call completes and delay is called', function(){
      
          results.forEach(result => {
          
            this.it('tests db result', t => {
                     assert(t.data.the);
             });
             
            this.it('tests db result', (t,done) => {
                                  
                 setTimeout(function(){
                       done(new Error('Passing an error to done will fail the test as it should');
                    },2000);
                        
                 });
             });
     
      });

});



```


# Test Framework Comparison


## Table of Goodness

|       | Supports ES6/ES7  features | Supports test isolation using  multiple Node.js processes | Concurrency within suites | Dependency Injection |
|-------|----------------------------|-----------------------------------------------------------|---------------------------|----------------------|
| Mocha | No                         | No                                                        | No                        | No                   |
| Chai  | No                         | No                                                        | No                        | No                   |
| Tape  | No                         | No                                                        | No                        | No                   |
| AVA   | Yes                        | Yes                                                       | Yes                       | No                   |
| Suman | Yes                        | Yes                                                       | Yes                       | Yes                  |


## Matrix of Madness

|       | Forces you to use their assertion library          | Confusing bind(this) contexts                                         | Developer debugging / console.log output mixed with test output                                           | t.plan() and t.end() madness with useless feature of tests as streams           | lack of concurrency  |
|-------|----------------------------------------------------|-----------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------|
| Mocha | No                                                 | Yes                                                                   | Yes                                                                                                       | No                                                                              | Yes                  |
| Chai  | No                                                 | Yes                                                                   | Yes                                                                                                       | No                                                                              | Yes                  |
| Tape  | Yes                                                | No                                                                    | Yes                                                                                                       | Yes                                                                             | Yes                  |
| Ava   | Yes                                                | No                                                                    | ?                                                                                                         | Yes                                                                             | No                   |
| Suman | Nope, Suman prefers the Node.js core assert module | Nope, Suman greatly simplifies the context puzzle that Mocha provided | Nope, Suman runner uses silent option with child_process so your output doesn't mix with the test results | Nope, tests are just plain objects and you don't need to explicitly call .end() | Nope                 |


### More Suman Examples

* see:  /examples directory
* see:  https://medium.com/@the1mills/introducing-suman-a-node-js-testing-library-20fdae524cd


### FAQ

* Q: Why does Suman strictly enforce parameter/argument names?

   A: Suman does this for three main reasons:

   1. Consistency - someone looks at the tests you wrote and they immediate recognize the variables because the names are given
   2. Suman can analyze your code for mistakes if it knows the variable names you use
   3. Dependency injection - the order of your dependencies doesn't matter as long as you stick to the naming convention

* Q: Why dependency injection in Node.js? Isn't it a waste of time?
  A: Normally it is. Dependency injection is very useful in the browser and is used by both Angular and RequireJS. In Node.js we usually have all our dependencies or we can easily load
     our dependencies synchronously on demand with the require function. However, with test suites, it was until now impossible to load dependencies and values *asynchronously* before registering test cases.
     DI allows you truly awesome ability to create and procure values asynchronously before any tests are run, and injecting the values in any test suite you wish.


###Extra info

Ava is also an up and coming testing library for Node.js. 
If you are familiar with Mocha and like both its power and simplicity, you may prefer Suman over Ava.



** dependency arrays of strings exist so that during minification we can still know where to inject dependencies, that's why Angular and RequireJS have deps arrays of strings - they don't get
corrupted by minification/uglification. But in testing frameworks, it is very unlikely we need to minify, so we can go without the dep array 99% of the time,
and just use metaprogramming with the callback argument list to locate the dependencies