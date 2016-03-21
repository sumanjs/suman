/**
 * Created by pbarve001c on 8/26/15.
 */

//core
var supertest = require('supertest');
var path = require('path');
var assert = require('assert');
var should = require('should');

describe('@Test_Rules*', function () {

    var testCases = [
        '../test_data/other_payloads/ivr_no_enrich.json',
        '../test_data/other_payloads/ivr_enrich.json',
        '../test_data/other_payloads/stb_no_enrich.json',
        '../test_data/other_payloads/stb_enrich.json',
        '../test_data/other_payloads/other_no_enrich.json',
        '../test_data/other_payloads/other_enrich.json'
    ];


    before(function () {

        var config = this.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        this.constants = config.get('sc_constants');
        this.serverURL = config.get('test_env').smartconnect_server_config.url;
        this.serverPort = config.get('test_env').smartconnect_server_config.port;
        this.$url = this.serverURL.concat(':').concat(this.serverPort);
        this.nlNameEmpty = require('../test_data/other_payloads/nlNameEmpty.json');
        this.responseFromCS = '<div>RESPONSE FROM : Context Store</div><div>statusCode : 201<br>details : Created</div>';

    });

    describe('@Test_Enrichment_Rules', function () {

    testCases.forEach(function (json, index) {

            it('[test] ' + path.basename(json), function (done) {

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

    it('[test] Rule1 IF nlName = "" Then nlName = IVRBucket', function (done) {

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

    it('[test] Rule2 IF nlName = "" AND eventType = "" THEN populate nlName, eventType, nlDesc and description', function (done) {

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
