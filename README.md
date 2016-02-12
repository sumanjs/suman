#Suman

## npm install --save-dev suman


Suman was designed to be a direct successor to Mocha. Mocha was an awesome library. If you like Mocha you will love Suman.
The reasons why Mocha needs a replacement are:

* in Mocha everything was run in series, which can take unnecessary amounts of times for async tests
* in Mocha suites were not run in separate processes (necessary for isolation and independence)
* Mocha could not move forward with ES6 features due to certain patterns used
* heavy usage of globals was bringing Mocha down

ES6 is not the greatest thing ever, and ES6 is optional with Suman, for those who like ES5.

## Suman features:

* bdd interface
* no globals whatsoever
* async tests can be run in parallel in any suite
* suites are run in separate Node.js processes
* a nifty web UI reporter, along with standard command line reports
* optional ability to store past test reports and view test results chronologically with browser
* hooks behave just like in Mocha
* syntax and structure is borrowed heavily from Mocha so that conversion is as easy as possible


### usage

* Suman is designed to be run for integration and system testing, using a BDD interface

* You can use arrow functions or regular functions everywhere

* the rules for the before/after/beforeEach/afterEach hooks are identical to the rules with Mocha

* skip/only also work like Mocha



### Examples

see:  https://medium.com/@the1mills/introducing-suman-a-node-js-testing-library-20fdae524cd


### FAQ

* Q: Why does Suman stricly enforce parameter/argument names?

* A: Suman does this for three main reasons:

   1) Consistency - someone looks at the tests you wrote and they immediate recognize the variables because the names are given
   2) Suman can analyze your code for mistakes if it knows the variable names you use
   3. Dependency injection - the order of your dependencies doesn't matter as long as you stick to the naming convention

* 


###Extra info

Ava is also an up and coming testing library for Node.js. 
If you are familiar with Mocha and like both its power and simplicity, you may prefer Suman over Ava.


The usage of 'this' in the Suman library is to prevent any mishaps, given the nested describes. An alternative would be of course to pass in a variable
to the describe callbacks, but we felt it was cleaner to just use 'this' for the describes.


### simple teaser example without much flair

```js

const assert = require('assert');
const suman = require('suman');

/////////////////////////////////////////////////////
var Test = suman.Test(module, 'suman.conf.js');
/////////////////////////////////////////////////////


Test.describe('@Test1', function () {

    var config = null;

    this.beforeEach(function () {
        if (config) {
            throw new Error('config should be null before each test!');
        }
    });

    this.afterEach(function () {
        config = null;
    });

    this.it('does not throw', function () {

        assert.doesNotThrow(function () {  //prob unnecessary, but for clarity

            config = require('../index')(module, '*', 'test/test-config');

        });

    });


    this.it('does throw part 1', function () {

        assert.throws(function () {

            config = require('../index')(module, 'some string without an asterisk', 'test/test-config');

        }, 'Oh shit');

    });

    this.it('does throw part 2', function () {

        assert.throws(function () {

            config = require('../index')(module, '***', 'test/test-config/bad-path');

        }, 'Oh shit');

    });


    this.it('does throw part 3', function () {

        assert.throws(function () {

            config = require('../index')(module, '***', 'test/test-config/bad-path');

        }, 'Oh shit');

    });


    this.it('verify config values', function () {

        config = require('../index')(module, '***', 'test/test-config');

        assert.equal(config.prop1, 1);
        assert.deepEqual(config.prop2, {foo: 'bar'}, 'prop2 has unexpected value');
        assert(typeof config.prop3.jungle === 'function', 'prop3 is not a function');

    });


});


```