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
 * @author: Ocampo Ronnel C. on 12/4/2015
 *
 * Test - Converting XML payload into a JSON.
 *
 * $ mocha test+/testHandleXmlMiddleware.js
 */


var fs = require('fs');
var path = require('path');
var http = require('http');
var supertest = require('supertest');
var assert = require('assert');

Test.describe('@Test - handleXml()*', function (assert) {

    var self = this;
    var server;
    var payload = ''; // stringified XML
    var xmlPath = path.resolve('test', 'test_data', 'xml_payloads', 'IVR_OnDemandErrorCode.xml');

    this.before(done => {
        var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        server = createServer().on('listening', function () {
            done(null);
        });
    });

    this.beforeEach((t, done) => {
        fs.readFile(xmlPath, 'utf8', function (err, content) {
            assert(err == null);
            payload = content;
            done();
        });
    });

    this.it('should accept request Content-type "text/xml or application/xml"', (t, done) => {
        supertest(server)
            .post('/event')
            .set('Content-Type', 'application/xml')
            .send(payload)
            .expect(200, done);
    });


    this.it('should transform XML payload into JSON object', (t, done) => {
        supertest(server)
            .post('/event')
            .set('Content-type', 'application/xml')
            .send(payload)
            .expect(200)
            .end(function (err, res) {
                assert(err == null, 'Error is not null');
                var jsonifiedXml = JSON.parse(res.text);
                assert(typeof jsonifiedXml === 'object', 'jsonifiedXml not an object');
                done();
            });

    });

    this.describe('JSONified XML', function () {

        this.it('should have proper key casing', (t, done) => {

            supertest(server)
                .post('/event')
                .set('Content-type', 'application/xml')
                .send(payload)
                .expect(200)
                .end(function (err, res) {
                    assert(err == null);
                    var payload = JSON.parse(res.text);
                    payload = payload.events[0].data;
                    assert(payload.hasOwnProperty('ppv'), 'Bad value for ppv');
                    assert(payload.hasOwnProperty('mac'), 'Bad value for mac');
                    assert(payload.hasOwnProperty('appName'), 'Bad value for appName');
                    assert(payload.hasOwnProperty('divisionId'), 'Bad value for divisionId');
                    assert(payload.hasOwnProperty('callTime'), 'Bad value for callTime');
                    assert(payload.hasOwnProperty('callDate'), 'Bad value for callDate');
                    assert(payload.hasOwnProperty('ivrLOB'), 'Bad value for ivrLOB');

                    done();
                });
        });
    });
});


function createServer(opts) {

    //Note: this is a good pattern, definitely

    var handleXml = require(path.resolve('lib', 'handleXml'));

    var server = http.createServer(function (req, res) {
        handleXml(req, res, function (err) {
            res.statusCode = err ? (err.status || 500) : 200;
            res.end(err ? err.message : JSON.stringify(req.body));
        });
    });

    server.listen(5999);  //TODO: which port should this be listening on? a unused port, surely

    return server;
}
