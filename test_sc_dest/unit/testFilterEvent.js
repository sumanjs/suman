
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
 * Test - Filter IVR events with account number 0000000000
 * 
 * Cut off process of an IVR event with 0000000000 acccount number
 *
 * $ mocha test/unit/testFilterEvent.js
 */

var fs = require('fs');
var path = require('path');
var should = require('should');
var request = require('supertest');

Test.describe('@TestFilterEventFn*', function(assert){

    var config = this.config = require('univ-config')(module, this.title, 'config/test-config');

    var server;
    var IVR_payload_account_number_000 = require('../test_data/enriched_payloads/Bill_0000_account_num.json');
    var IVR_payload_valid_account_number = require('../test_data/enriched_payloads/Bill.json');
    var TVNS_payload = require('../test_data/tvns_payloads/tvnsPayload.json');

	this.before(() => {
        var serverURL = config.get('test_env').smartconnect_server_config.url;
        var serverPort = config.get('test_env').smartconnect_server_config.port;
        server = serverURL.concat(':').concat(serverPort);
    });

    	this.it('should receive 400 status code for IVR event with account num of 000000000', (t,done) => {
        request(server)
            .post('/event')
            .set('Content-Type', 'application/json')
            .send(IVR_payload_account_number_000)
            .expect(400)
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
    });


    	this.it('should receive 201 status code for IVR events with a valid account number', (t,done) => {
        request(server)
            .post('/event')
            .set('Content-type', 'application/json')
            .send(IVR_payload_valid_account_number)
            // .expect(201, done);
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
    });

    	this.it('should only filter IVR events', (t,done) => {
        request(server)
            .post('/event')
            .set('Content-type', 'application/json')
            .send(TVNS_payload)
            // .expect(201, done);
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
    });

});



