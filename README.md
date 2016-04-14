[![Coverage Status](https://coveralls.io/repos/github/ORESoftware/suman/badge.svg?branch=master)](https://coveralls.io/github/ORESoftware/suman?branch=master)


![alt text](https://raw.githubusercontent.com/ORESoftware/suman/master/images/suman.png "Suman Primary Logo")

> ---
>
>     Suman library documentation: [oresoftware.github.io/suman](http://oresoftware.github.io/suman "Suman Docs")
>
> ---

<br>
<br>
# &#9658; Quick reference

<br>
<i> => For command line tools:</i>
## ```npm install -g suman```

<i> => For test suites in your project:</i>
### You should run  ```$ suman --init```  in your <i>project root</i> after installing suman as a global module

=> to convert a Mocha test or whole directory of Mocha tests to Suman tests use <br>
```$ suman --convert <src-file/src-dir> <dest-file/dest-dir>```

=> to simply install Suman as dev-dependency in any project you can use ```$ npm install -D suman```, <br>
however ```$ suman --init``` is the preferred way to initialized suman in a given project. 


<br>
# &#9658; About
<br>

---

(disclaimers: Suman is in beta, despite the current version number; Suman supports Node versions >= 4.0)

---

<i> Suman is a test runner for Node.js and is focused on asynchronous testing of backend services. Suman is designed to be a direct successor to Mocha, Tape and Jasmine, 
and to compete with the new Node.js test runner AVA. Suman was designed so that there would be a super simple migration path from Mocha to Suman, but also provide
massive improvements over Mocha, specifically for backend testing. Mocha is most familiar to us and perhaps to you - Mocha was a great test library, but has many bugs and shortcomings 
that we experienced ourselves over time, and eventually we wanted a test runner that we could use that was more robust and more streamlined than Mocha,
that was also enterprise-grade. Suman is designed for powerful and full-featured testing of integrated and asynchronous networked systems,
and is not currently intended to be used for front-end testing. (Your backend testing framework and front-end testing framework should probably be different if you
want them both to be powerful and full-featured). This library gives you features for backend testing that are not available in other testing frameworks since this
library is not constained by the requirement that it must run in the browser.</i>

---

### The reasons why Mocha and its peers need a replacement are:

* In Mocha, Tape and Jasmine suites were not run in separate processes (necessary for isolation, speed and independence of test results)
* Using Mocha, Tape and Jasmine everything was not only run in a single process but all test cases and hooks were also run in series, which takes unnecessary amounts of time for tests utilizing async I/O
* Mocha and Jasmine could not move forward with ES6/ES7 features due to certain software patterns used (globals and complex context binding)
* Furthermore, Mocha and Jasmine could not have certain useful serverside features, because they were also constained by running in the browser.
* Mocha lacked real ability to do true dynamic testing (meaning, registering a dynamic number of it() test cases) => e.g., make a network call, get X values, create a test case for each.
* Mocha had confusing and obfuscated context values (values for 'this'), which we have greatly simplified, allowing for the usage of arrow functions, etc 
* Most Node.js test frameworks don't 'feel' robust enough to test mission critical systems => Suman was written to provide a highly robust test framework
to the Node.js community.
* Mocha, Jasmine and Tape lack some other nice features that are implemented by Suman. For example, Tape's ability to pre-load modules using the command line 
before running tests is nowhere near as powerful or easy to use as the dependency injection ability of this library.
* Using Mocha, Tape, Jasmine you could not easily pass data to tests, to reuse the same test code for different scenarios; Suman allows you to pass dynamic data
to tests using dependency injection.
* And lastly, a BIG ONE: clean reporting - at the command line, using Mocha and Jasmine, logging/debugging output by the developer would obfuscate the test results, nullifying any advantage of reporting tools. Suman has a simple
trick up its sleeve to allow for 100% clean reporting for any test or group of tests. 


## Suman Philosophy 

* "Just works"
* Stick to Node core modules
* Use stream APIs when possible
* Provide a full-featured, non-dumbed-down API that's easy to get started with, and
intuitive to use over the long-run.
* Listen to what the community wants.
* Leverage Javascript's strengths.
* Don't be lazy.
* As Suman is a command line application, we can utilize a more functional programming style
* Details matter*


# ▶ Suman features:

* => tdd/bdd interfaces
* => easy migration from Mocha (automated, see below)
* => extremely powerful, while aiming to be straightforward, clean, concise, consistent and accurate
* => designed with ES6 and ES7 in mind, including Promises, async/await and generators


* <b> Very simple but powerful dependency injection (DI/IoC)</b>
    *  most useful for injecting values acquired asynchronously, such as successful network connections and database values
    *  inspired by familiar tools such as Angular and RequireJS
    *  load any core/"built-in" Node.js module by name 
    *  DI is used throughout the library, and relieves the burden on the developer to remember order of parameters
    *  Inject network values, test dependencies and library dependencies
       
  
* <b> Full-blown concurrency</b>
    *  your tests will run much, much faster
    *  suites are run in separate Node.js processes for speed and isolation
    *  test cases in any given suite can be run concurrently, using asynchronous I/O
    *  capability to control maximum number of processes running at a time
    *  capability to add constaints to prevent any given pair of tests from running at the same time
       
       
* <b> Improved reporting </b>
    *  using the Suman test runner, you can prevent any logging output from mixing with test reports
    *  Suman includes a standard web reporter that you can use to share test results with your team, using the Suman server
    *  Suman server provides ability to store past test results (backdata) and view test results chronologically with browser to look at trends
       
    
* <b> Test runner tuning </b>
    *  Add contraints to prevent any given pair of tests from running at the same time
    *  Cap the total number of processes running at the same time
    *  Suman 'once' feature gives developer the option to run checks to see if all necessary network components are live before running any given test
    
* <b> Easy migration from Mocha </b>
    *  Suman includes a command line option to convert whole directories or individual Mocha tests to Suman tests
    *  before/after/beforeEach/afterEach hooks behave just like in Mocha
    *  solid command line tools and better grep facilities than predecessors
    *  skip/only also work like Mocha

* <b> Freedom: Suman is not highly opinionated, but gives you powerful features</b>
    *  Suman prefers standard core assert Node module (Suman has unopinionated assertions), but you can use any assertion lib that throws errors
    *  Callbacks, promises, async/await, generators and event-emitters/streams are supported in any test case or hook.


## Suman design

* no globals whatsoever, which were avoided due to the problems they caused for Jasmine and Mocha.
* Suman uses domains to isolate errors in asynchronous tests and hooks, and currently this is the only solution to this problem at the moment. 
Domains are facing deprecation, and Suman will replace domains with whichever suitable replacement is chosen by the Node.js core technical committee.

## *Details matter

* we designed Suman with details in mind
* friendly error messages
* when debugging, timeouts will automatically be set to 'infinity'


## We can say with some confidence that Suman is the most powerful test framework for serverside JavaScript on planet Earth
 => as it gives the developer total control and access to a very large set of features, with the explicit goal of being bug-free first, full-featured second.


## Simple usage examples

#### simple example using ES6:  

```js

const suman = require('suman');
const Test = suman.init(module);

Test.describe('FirstExample', function(assert, path, http){     //  this is our test suite, and we inject some core modules by name


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
const Test = suman.init(module);  


Test.describe('SecondExample', function(db, someval, delay, assert){    // normally we only need to inject a couple of values per test

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



# &#9658; Test Framework Comparison


## Table of Goodness


|         | Node-able                                                                 | Supports ES6/ES7  features            | Supports test isolation using  multiple Node.js processes | Concurrency within suites | Dependency Injection |
|---------|---------------------------------------------------------------------------|---------------------------------------|-----------------------------------------------------------|---------------------------|----------------------|
| Mocha   | No                                                                        | No                                    | No                                                        | No                        | No                   |
| Jasmine | No                                                                        | No                                    | No                                                        | No                        | No                   |
| Tape    | Yes                                                                       | No                                    | No                                                        | No                        | No                   |
| AVA     | No                                                                        | Yes                                   | Yes                                                       | Yes                       | No                   |
| Suman   | Yep, you can run any given test suite with the plain old node executable  | Yep, Suman will support all features  | Yep                                                       | Yep                       | Yep                  |


## Matrix of Madness

|         | Implicit globals | Forces you to use their assertion library madness  | Confusing bind(this) contexts madness                                 | Developer debugging / console.log output mixed with test output madness                                   | t.plan() and t.end() madness                                                    | no concurrency madness |
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
 co-opted Tape and added concurrency. Suman co-opted Mocha, added concurrency, better reporting, dependency injection and 
 less confusing contexts for hooks. Suman has more powerful facilities for asynchronous testing than AVA due to Mocha/Jasmine-style hooks
 and nested describes. Dependency injection ability also makes Suman extremely convenient to use, compared to AVA.
 
### Extra info

If you are familiar with Mocha and like both its power and simplicity, you may prefer Suman over Ava,
and Suman provides the simplest migration path from Mocha. As was stated AVA draws more from Tape and Suman draws more from Mocha. 
Suman was designed to make the transition from Mocha to be seamless.


** dependency arrays of strings exist so that during minification we can still know where to inject dependencies, that's why Angular and RequireJS have deps arrays of strings - they don't get
corrupted by minification/uglification. But in testing frameworks, it is very unlikely we need to minify, so we can go without the dep array 99% of the time,
and just use metaprogramming with the callback argument list to locate the dependencies


Note that because Suman should be installed as a devDependency, it won't show up as being used in the standard
NPM badge:
<br>
<br>
[![NPM](https://nodei.co/npm/suman.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/suman/)
<br>
<br>



