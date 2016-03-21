
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
 * Created by pbarve001c on 8/26/15.
 */

//core
var supertest = require('supertest');
var path = require('path');
var assert = require('assert');
var should = require('should');

Test.describe('@Test_Rules*', function(assert){

    var testCases = [
        '../test_data/other_payloads/ivr_no_enrich.json',
        '../test_data/other_payloads/ivr_enrich.json',
        '../test_data/other_payloads/stb_no_enrich.json',
        '../test_data/other_payloads/stb_enrich.json',
        '../test_data/other_payloads/other_no_enrich.json',
        '../test_data/other_payloads/other_enrich.json'
    ];


	this.before(() => {

        var config = this.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        this.constants = config.get('sc_constants');
        this.serverURL = config.get('test_env').smartconnect_server_config.url;
        this.serverPort = config.get('test_env').smartconnect_server_config.port;
        this.$url = this.serverURL.concat(':').concat(this.serverPort);
        this.nlNameEmpty = require('../test_data/other_payloads/nlNameEmpty.json');
        this.responseFromCS = '<div>RESPONSE FROM : Context Store</div><div>statusCode : 201<br>details : Created</div>';

    });

	this.describe('@Test_Enrichment_Rules', function(){

    testCases.forEach(function (json, index) {

            	this.it('[test] ' + path.basename(json), (t,done) => {

                var self = this;

                var jsonData = require(json);
                supertest(self.$url)
                    .post('/event')
                    .send(jsonData)
                    .end(function (err, res) {
                         assert(err == null);
                         res.statusCode.should.be.equal(201);
                         done();
                    });
            });
        });
    });

    	this.it('[test] Rule1 IF nlName = "" Then nlName = IVRBucket', (t,done) => {

        var self = this;

        this.nlNameEmpty.payload.events[0].data.nlName = "";

        supertest(self.$url)
            .post('/event')
            .send(self.nlNameEmpty)
            .end(function (err, res) {
                assert(err == null);
                res.statusCode.should.be.equal(201);
                done();
            });
    });

    	this.it('[test] Rule2 IF nlName = "" AND eventType = "" THEN populate nlName, eventType, nlDesc and description', (t,done) => {

        var self = this;

        this.nlNameEmpty.payload.events[0].data.IVRBucket = "Billing";
        this.nlNameEmpty.payload.events[0].data.nlName = "";
        this.nlNameEmpty.payload.events[0].type = "";

        supertest(self.$url)
            .post('/event')
            .send(self.nlNameEmpty)
            .end(function (err, res) {
               assert(err == null);
                res.statusCode.should.be.equal(201);
                done();
            });
    });

});
