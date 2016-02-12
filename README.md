#Suman

## npm install --save-dev suman


Suman is designed to be a direct successor to Mocha. Mocha was an awesome library, but has several shortcomings that we experienced ourselves, and eventually wanted a test runner
that we could use ourselves that was better than Mocha. If you like Mocha and BDD interfaces you will love Suman.

The reasons why Mocha and its peers need a replacement are:

* in Mocha everything was run in series, which can take unnecessary amounts of time for async tests
* in Mocha suites were not run in separate processes (necessary for isolation and independence of test results)
* Mocha could not move forward with ES6 features due to certain patterns used
* heavy usage of globals was bringing Mocha down
* Mocha lacked real ability to do true dynamic testing (meaning, registering a dynamic number of it() test cases) ---> e.g., make a network call, get X values, create a test case for each.
* Mocha had confusing and obfuscated context values (values for 'this'), which we have greatly simplified, allow for usage of arrow functions (which we guarantee people will try to use in
the most unnecessary places, but we have to deal with it).
* and lastly a BIG ONE: clean reporting - at the command line, logging/debugging output by the developer would obfuscate the test results, nullifying any advantage of reporting tools. Suman has a simple
trick up its sleave to allow for 100% clean reporting for any test or group of tests. 


## Suman features:

* extremely powerful, while aiming to be straightforward, clean, concise, consistent and accurate
* designed with ES6 and ES7 in mind, including async/await and generators
* simple but powerful dependency injection (DI/IoC) of values and dependencies, 
       --> controlled by the developer (used primarily for injecting values acquired asynchronously, such as DB values)
       --> inspired by Angular and RequireJS
       
* bdd interface
* no globals whatsoever
* async test cases and hooks can be run in parallel in any given suite
* suites are run in separate Node.js processes
* a nifty web UI reporter, along with standard command line reports
* ability to store past test reports (backdata) and view test results chronologically with browser to look at trends
* hooks behave just like in Mocha
* syntax and structure is borrowed directly from Mocha so that conversion is as easy as possible
* command line tools and better grep facilities than predecessors


### usage

* Suman is designed to be used specifically for integration and system testing, using a BDD interface

* Suman is designed for powerful and full-featured testing of integrated and asynchronous networked systems

* the rules for the before/after/beforeEach/afterEach hooks are identical to the rules with Mocha

* skip/only also work like Mocha



### Examples

see:  /examples directory
see:  https://medium.com/@the1mills/introducing-suman-a-node-js-testing-library-20fdae524cd


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
