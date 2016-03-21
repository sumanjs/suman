
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

var app = require('../../app');
var assert = require('assert');
var config = require('univ-config')(module, '*SC*', 'config/server-config');
var fs = require('fs');
var http = require('http');
var log = require('baymax-logger');
var util = require('util');

var SmartConnectServer = require('../../lib/smartconnectServer');
var env = config.get('sc_env');
var port = env.smartconnect_server_config.port;

Test.describe('event-router', function(assert){
    // setup app
    var scserver = null;
	this.before(done => {
        log.info('SmartConnect server starting...');
        log.info('runtime NODE_ENV:', process.env.NODE_ENV);
        scserver = new SmartConnectServer({
            app: app
        });
        scserver.init();
        setTimeout(function(){
            done();
        },100);
    });
	this.after(done => {
        scserver.restApi.close();
        done();
    });
	this.describe('#rateLimit', function(){
        var should = 'should return proper error when payload missing source ';
        should += 'or source.incident';
        	this.it(should, (t,done) => {
            var postData = fs.readFileSync('./test/unit/fixtures/invalid_post_missing_source_incident.json');
            var opts = {
                port: port,
                hostname: 'localhost',
                method: 'POST',
                path: '/event',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            var reply = '';
            var req = http.request(opts, function(res){
                res.on('data', function(chunk){
                    reply += chunk;
                });
                res.on('end', function(){
                    var msg = 'wrong status code, expected 500';
                    var repJSON = JSON.parse(reply);
                    assert(res.statusCode === 400, msg);
                    msg = 'unexpected reply data, success should be \'false\'';
                    assert(repJSON.success === false, msg);
                    var expected = 'Invalid payload, incident required to have source field';
                    var m = 'wrong error message, got \'%s\' expected \'%s\'';
                    msg = util.format(m, repJSON.data.error.message, expected);
                    assert(repJSON.data.error.message === expected, msg);
                    done();
                })
            });
            req.on('error', function(error){
                done(error);
            });
            req.write(postData);
            req.end();
            // submit invalid post
            // assert on reply
        });
    });
});
