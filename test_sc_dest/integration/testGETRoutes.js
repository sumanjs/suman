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

//core
var supertest = require('supertest');
var assert = require('assert');


Test.describe('@Test_GET_routes*', function (assert) {

    var self = null;

    this.before(() => {

        self = this;
        var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        var constants = config.get('sc_constants');
        var serverURL = config.get('test_env').smartconnect_server_config.url;
        var serverPort = config.get('test_env').smartconnect_server_config.port;
        self.serverName = serverURL + ':' + serverPort;
    });


    this.describe('@Test_all_GET_routes', function () {

        this.it('Should return 200 when /log_stdout is called.', (t, done) => {
            supertest(self.serverName)
                .get('/log_stdout')
                .expect(200)
                .end(function (err) {
                    assert(err == null);
                    done();
                });
        });

        this.it('Should return 200 when /log_stderr is called.', (t, done) => {
            supertest(self.serverName)
                .get('/log_stderr')
                .expect(200)
                .end(function (err, res) {
                    assert(err == null);
                    done();
                });
        });

        this.it('Should return 200 when /heartbeat is called.', (t, done) => {
            supertest(self.serverName)
                .get('/heartbeat')
                .expect(200)
                .end(function (err, res) {
                    assert(err == null);
                    done();
                });
        });

        this.it('Should return 200 when /redisData is called.', (t, done) => {
            supertest(self.serverName)
                .get('/redisData')
                .expect(200)
                .end(function (err, res) {
                    assert(err == null);
                    done();
                });
        });

        this.it('Should return 200 when /info is called.', (t, done) => {
            supertest(self.serverName)
                .get('/info')
                .expect(200)
                .end(function (err, res) {
                    assert(err == null);
                    done();
                });
        });

        this.it('Should return 200 when /event is called.', (t, done) => {
            supertest(self.serverName)
                .get('/event')
                .expect(200)
                .end(function (err, res) {
                    assert(err == null);
                    done();
                });
        });
    });
});
