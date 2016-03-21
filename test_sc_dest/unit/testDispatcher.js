
/*
<suman message>
This file has been converted from a Mocha test to a Suman test using the "$ suman --convert" command.
To get rid of this comment block, you can run can run "$ suman --rm-comments" on this file or its containing folder.
For the default conversion, we have stuck to ES5 require syntax; if you wish to use ES6 import syntax, you can
run the original command with with the --es6 flag, like so: $ suman --convert --es6

You may see that the core module assert is an argument to the top-level describe callback.
Suman allows you to reference any core module in the top-level describe callback, which saves you some ink
by avoiding the need to have several require/import statements for each core module at the top of your file.
On top of that, you can reference any dependency listed in your suman.ioc.js file, as you would a core module
in the top-level describe callback. This is a quite useful feature compared to simply loading core modules,
because you can load asynchronous dependencies via this method.
</suman message>
*/

const suman = require('suman');
const Test = suman.init(module);

/**
 * @author: jpalal001c on 03/08/2016
 * To run:
 * $ mocha test/unit/testDispatcher.js
 */

var assert = require('assert');
//require dispatcher:
var dispatcher = require('../../lib/dispatcher');

Test.describe('dispatcher', function(assert){
	this.before(() => {
        var http = require('http');
        this.mockServer1 = http.createServer(function(request, response) {
            response.end('Mock Server 1 hit');
        }).listen(5050);

        this.mockServer2 = http.createServer(function(request, response) {
            response.end('Mock Server 2 hit');
        }).listen(5051);

    });
	this.after(done => {
            this.mockServer1.close();
            this.mockServer2.close();
            done();
    });
	this.describe('#sendRequests', function(){

            	this.it('sendRequests should get a statusCode from request result', (t,done) => {

                var csOpts = require('./fixtures/csReqOptions.json');
                csOpts.url = 'http://localhost:5050';
                var meldOpts = require('./fixtures/meldReqOptions.json');
                meldOpts.url = 'http://localhost:5051';
                var services = ['Context Store','MELD'];

                dispatcher.sendRequests([csOpts, meldOpts], services, function(err, results) {
                    if(err) {
                        assert.strictEqual(err, err, 'An error has occured in passing options');
                    } else {
                        assert.notEqual(results[0].statusCode, null);
                    }
                    done();
                });

    });



    });
});
