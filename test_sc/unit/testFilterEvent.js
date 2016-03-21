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

describe('@TestFilterEventFn*', function () {

    var config = this.config = require('univ-config')(module, this.title, 'config/test-config');

    var server;
    var IVR_payload_account_number_000 = require('../test_data/enriched_payloads/Bill_0000_account_num.json');
    var IVR_payload_valid_account_number = require('../test_data/enriched_payloads/Bill.json');
    var TVNS_payload = require('../test_data/tvns_payloads/tvnsPayload.json');

    before(function() {
        var serverURL = config.get('test_env').smartconnect_server_config.url;
        var serverPort = config.get('test_env').smartconnect_server_config.port;
        server = serverURL.concat(':').concat(serverPort);
    });

    it('should receive 400 status code for IVR event with account num of 000000000', function (done) {
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


    it('should receive 201 status code for IVR events with a valid account number', function (done) {
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

    it('should only filter IVR events', function (done) {
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



