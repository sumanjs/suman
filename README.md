# Suman

<br>
[![NPM](https://nodei.co/npm/suman.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/suman/)
<br>

For test suites in your project:
## ```npm install -D suman```

For command line tools:
## ```npm install -g suman```

<br>

(disclaimer: Suman is in beta, despite the current version number)

Suman is a test runner for Node.js and is focused on asynchronous testing of backend services. Suman is designed to be a direct successor to Mocha, Tape and Jasmine, 
and to compete with the new Node.js test runner AVA. Suman was designed so that there would be a super simple migration path from Mocha to Suman.
Mocha is most familiar to us and perhaps to you -  Mocha was an awesome test library, but has many bugs and several shortcomings 
that we experienced ourselves over time, and eventually we wanted a test runner that we could use that was more robust and more streamlined than Mocha. 
Suman is designed to be used specifically for integration and system testing of backend facilities, using a BDD interface
If you like Mocha and BDD test interfaces you will love Suman. Suman is designed for powerful and full-featured testing of integrated and asynchronous networked systems,
and is not currently intended to be used for front-end testing. (Your backend testing framework and front-end testing framework should probably be different if you
want them to be powerful and full-featured).

### The reasons why Mocha and its peers need a replacement are:

* in Mocha, Tape and Jasmine everything was run in series, which can take unnecessary amounts of time for async tests
* in Mocha, Tape and Jasmine suites were not run in separate processes (necessary for isolation, speed and independence of test results)
* Mocha could not move forward with ES6/ES7 features due to certain software patterns used (globals and complex context binding)
* heavy usage of globals was bringing Mocha and Jasmine down
* Mocha lacked real ability to do true dynamic testing (meaning, registering a dynamic number of it() test cases) ---> e.g., make a network call, get X values, create a test case for each.
* Mocha had confusing and obfuscated context values (values for 'this'), which we have greatly simplified, allowing for the usage of arrow functions 
* Compared to Suman, most testing frameworks don't feel robust enough to test mission critical systems.
For example, Tape's ability to pre-load modules using the command line before running tests is nowhere near as powerful or easy to use
as the dependency injection ability of this library.
* and lastly a BIG ONE: clean reporting - at the command line, using Mocha, logging/debugging output by the developer would obfuscate the test results, nullifying any advantage of reporting tools. Suman has a simple
trick up its sleeve to allow for 100% clean reporting for any test or group of tests. 


## Suman features:

<br>
* bdd interface
* extremely powerful, while aiming to be straightforward, clean, concise, consistent and accurate
* designed with ES6 and ES7 in mind, including async/await and generators
<br>

* <b>Very simple but powerful dependency injection (DI/IoC) of values and dependencies</b>
    *  used primarily for injecting values acquired asynchronously, such as DB connections and values
    *  can be used to ensure that other network components are live before running tests, and the test runner will report if they are not live
    *  inspired by familiar tools such as Angular and RequireJS
    *  load any core ("built-in") Node.js module by name :)
    *  completely optional, it's the developer's choice whether to incorporate DI or not
       
  
* <b>Full-blown concurrency</b>
    *  your tests will run much, much faster
    *  suites are run in separate Node.js processes for speed and isolation
    *  test cases in any given suite can be run concurrently, using asynchronous I/O
       
       
* <b>Improved reporting</b>
    *  web reporter so that you can share test results with your team
    *  using the Suman runner, you can prevent any developer logging output from mixing with test reports
    *  ability to store past test reports (backdata) and view test results chronologically with browser to look at trends
       
       
* <b>Easy migration from Mocha</b>
    *  hooks behave just like in Mocha
    *  syntax and structure is borrowed directly from Mocha so that conversion is as easy as possible
    *  solid command line tools and better grep facilities than predecessors
    *  the rules for the before/after/beforeEach/afterEach hooks are identical to the rules with Mocha
    *  skip/only also work like Mocha


* <b>Freedom: Suman is not highly opinionated, but gives you powerful features</b>
    *  Suman prefers standard core assert Node module (unopinionated assertions), but you can use any assertion lib that throws errors


## Suman design

* no globals whatsoever


## We can say with some confidence that Suman is the most powerful test framework for serverside JavaScript on planet Earth
 => because it gives the developer total control and access to a very large set of features, with the explicit goal of being bug-free first, full-featured second.


## usage examples

simple example:

```js

const suman = require('suman');
const Test = suman.init(module);

Test.describe('FirstExample', function(assert){     //  this is our test suite, and we inject the core 'assert' module


     this.beforeEach('runs before every it()', t => {
         t.data.foo = 'bar';
     });


     this.it('uno', t => {     // a test case
     
        assert(t.data,'This will pass because t.data is predefined by Suman for each test');  
     
     }).it('dos', t => {       // a test case, (you can chain test cases and hooks if you want to) 
     
        assert(false,'not good');  
     
     }).it('tres', t => {       // a test case 
         return new Promise(function(resolve,reject){               
                 resolve(null);  
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

### an example with more features:


```js

const suman = require('suman');
const Test = suman.init(module,'suman.conf.js');  //we now utilize our own suman config file which is useful for configuring reporting etc


Test.describe('SecondExample', ['db', 'some-val'], function(db, someval, delay, assert){    // normally we only need to inject a couple of values per test

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
     
     
      this.beforeEach(async function(t) {                 //obligatory ES7 example 
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

```js

const suman = require('suman');
const Test = suman.init(module,'suman.conf.js');  //we now utilize a suman config file which is useful for configuring reporting etc


Test.describe('ThirdExample', function(assert, delay, db, val){    // note: as stated above, unless we need to minify our tests for some reason, we don't need a dep array, just the callback



});

```


# Test Framework Comparison


## Table of Goodness


|         | Node-able                                                                 | Supports ES6/ES7  features            | Supports test isolation using  multiple Node.js processes | Concurrency within suites | Dependency Injection |
|---------|---------------------------------------------------------------------------|---------------------------------------|-----------------------------------------------------------|---------------------------|----------------------|
| Mocha   | No                                                                        | No                                    | No                                                        | No                        | No                   |
| Jasmine | No                                                                        | No                                    | No                                                        | No                        | No                   |
| Tape    | Yes                                                                       | No                                    | No                                                        | No                        | No                   |
| AVA     | No                                                                        | Yes                                   | Yes                                                       | Yes                       | No                   |
| Suman   | Yep, you can run any given test suite with the plain old node executable  | Yep, Suman will support all features  | Yep                                                       | Yep                       | Yep                  |


## Matrix of Madness

|         | Implicit globals | Forces you to use their assertion library madness  | Confusing bind(this) contexts madness                                 | Developer debugging / console.log output mixed with test output madness                                   | t.plan() and t.end() madness with useless feature of tests as streams          | no concurrency madness |
|---------|------------------|----------------------------------------------------|-----------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|------------------------|
| Mocha   | Yes              | No                                                 | Yes                                                                   | Yes                                                                                                       | No                                                                              | Yes                    |
| Jasmine | Yes              | No                                                 | Yes                                                                   | Yes                                                                                                       | No                                                                              | Yes                    |
| Tape    | No               | Yes                                                | No                                                                    | Yes                                                                                                       | Yes                                                                             | Yes                    |
| AVA     | No               | Yes                                                | No                                                                    | ?                                                                                                         | Yes                                                                             | No                     |
| Suman   | Nope             | Nope, Suman prefers the Node.js core assert module | Nope, Suman greatly simplifies the context puzzle that Mocha provided | Nope, Suman runner uses silent option with child_process so your output doesn't mix with the test results | Nope, tests are just plain objects and you don't need to explicitly call .end() | Nope                   |


### More Suman Examples

* see:  /examples directory
* see:  https://medium.com/@the1mills/introducing-suman-a-node-js-testing-library-20fdae524cd

### SLA

The Service Level Agreement is that Suman will constantly be up-to-date with the newest features available via the node executable.
We will focus on what's in Node and not what's available in Babel or other transpilers. That being said, we will also work to ensure Babel features are also supported,
but we will primarily focus on making Suman completely bug-free when it comes to the latest version of Node, not the latest abilities of Babel or the like.
By the time any ES6/ES7/ES8 feature is available in Node, it will be supported by Suman. We want to emphasize the utility of just running things
with the plain old Node executable, as opposed to adding the complexity of transpilation.

### FAQ

* Q: Why does Suman strictly enforce parameter/argument names?

   * A: Suman does this for three main reasons:

     1. Consistency - someone looks at the tests you wrote and they immediate recognize the variables because the names are given
     2. Suman can better analyze your code for mistakes if it knows the variable names you use
     3. Dependency injection - the order of your dependencies doesn't matter as long as you stick to the naming convention, which is pretty nice

* Q: Why dependency injection in Node.js? Isn't it a waste of time?
  
  *  A: Normally it is. Dependency injection is very useful in the browser and is used by both Angular and RequireJS. In Node.js we usually have all our dependencies or we can easily load
     our dependencies synchronously on demand with the require function. However, with test suites, it was until now impossible to load dependencies and values *asynchronously* before registering test cases.
     DI allows you truly awesome ability to create and procure values asynchronously before any tests are run, and injecting the values in any test suite you wish.
     
* Q: Can I use arrow functions? 

  * A: Yes you can use arrow functions anywhere *except* for the describe callbacks


### Important aside - How is Suman better than AVA?

 Suman borrows some excellent features from Mocha that AVA seems to ignore, including the ability
 to use nested describe statements for more control and preventing the sharing of scope within tests. AVA basically
 conned Tape and added concurrency. Suman conned Mocha, added concurrency, better reporting, dependency injection and 
 less confusing contexts for hooks. Suman has more powerful facilities for asynchronous testing than AVA due to Mocha/Jasmine-style hooks
 and nested describes. Dependency injection ability also makes Suman extremely convenient to use, compared to AVA.
 
### Extra info

If you are familiar with Mocha and like both its power and simplicity, you may prefer Suman over Ava,
and Suman provides the simplest migration path from Mocha. As was stated AVA draws more from Tape and Suman draws more from Mocha. 
Suman was designed to make the transition from Mocha to be seamless.


** dependency arrays of strings exist so that during minification we can still know where to inject dependencies, that's why Angular and RequireJS have deps arrays of strings - they don't get
corrupted by minification/uglification. But in testing frameworks, it is very unlikely we need to minify, so we can go without the dep array 99% of the time,
and just use metaprogramming with the callback argument list to locate the dependencies