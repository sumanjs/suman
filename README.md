#Suman

## ```npm install --save-dev suman```


Suman is designed to be a direct successor to Mocha. Mocha was an awesome test library, but has several shortcomings that we experienced ourselves over time, and eventually we wanted a test runner
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


## Suman features:

* extremely powerful, while aiming to be straightforward, clean, concise, consistent and accurate
* designed with ES6 and ES7 in mind, including async/await and generators
* simple but powerful dependency injection (DI/IoC) of values and dependencies, 
       * --> controlled by the developer (used primarily for injecting values acquired asynchronously, such as DB values)
       * --> inspired by familiar tools such as Angular and RequireJS
       
* bdd interface
* no globals whatsoever
* async test cases and hooks can be run in parallel in any given suite
* suites are run in separate Node.js processes
* a nifty web UI reporter, along with standard command line reports
* ability to store past test reports (backdata) and view test results chronologically with browser to look at trends
* hooks behave just like in Mocha
* syntax and structure is borrowed directly from Mocha so that conversion is as easy as possible
* command line tools and better grep facilities than predecessors
* prefer standard core assert Node module (unopinionated assertions)


## usage

simple example:

```js

var assert = require('assert');   // standard core Node assert module FTW
var suman = require('suman');

var Test = suman.init(module);

Test.describe('FirstExample', function(){   // the test suite


     this.beforeEach('runs before every it()', t => {
           t.data.foo = 'bar';
      });


     this.it('uno', t => {     // a test case
   
        if(!t.data){
           throw new Error('This will not happen because t.data is predefined by Suman for each test');  
        }
  
     });

     this.it('dos', t => {       // a test case 
   
        assert(false,'not good');  
  
     });
     
     
       this.it('tres', t => {       // a test case 
        
             return new Promise(function(resolve,reject){    //obligatory promise example
       
                    resolve(t);  //test passes no matter what LOL
       
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

var assert = require('assert');
var suman = require('suman');

var Test = suman.init(module,'suman.conf.js');  //we now utilize a suman config file which is useful for configuring reporting etc


Test.describe('SecondExample', ['delay', 'db', 'val'], function(delay, db, val){    // you actually don't need the dependency array for DI, but it's in this example to make it clearer*

     var results = [];
     
     db.makeDatabaseCall().then(function(values){  // db connection is already made because it was created and injected
         (values || []).filter(function(val){
             return val && val.foo;
          }).forEach(function(val){
               results.push(val);
           });
           
           delay(); // calling this allows us to invoke the next describe callback, this allows us to effectively block so that we can register a dynamic number of test cases (if we want to)
     });
     
      this.beforeEach(t => {
            t.data.the = 'clash';  
      });
     
      this.beforeEach(async function(t) {     //obligatory ES7 example 
            return await val.somePromiseMaker();  
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


### Examples

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
     DI allows you truly awesome ability to create and procure values asynchronously before running any tests run, and injecting them in any test suite you wish.


###Extra info

Ava is also an up and coming testing library for Node.js. 
If you are familiar with Mocha and like both its power and simplicity, you may prefer Suman over Ava.


### simple teaser examples ?  --->  see /examples directory



*dependency arrays of strings exist so that during minification we can still know where to inject dependencies, that's why Angular and RequireJS have deps arrays of strings - they don't get
corrupted by minification/uglification. But in testing frameworks, it is very unlikely we need to minify, so we can go without the dep array 99% of the time,
and just use metaprogramming with the callback argument list to locate the dependencies