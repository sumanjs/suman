/**
 *
 *
 * Created by pbarve001c on 8/24/15.
 * uses mockservers, only runs with NODE_ENV=test_local
 *
 *
 */

var request = require('request');
var assert = require('assert');
var http = require('http');

//TODO need to verify the json received by the mock servers are correct

describe('@Test_IVRtoMELD*', function () {

    var self = this;
    var config = require('univ-config')(module, this.title, 'config/test-config');
    var constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.serverName = serverURL + ':' + serverPort + '/event';

    before(function (done) {

        /* run mock CS */

        self.contextstoreApp = function (req, res) {
            res.writeHead(201, {"Content-Type": "text"});
            res.write("Mock CS server");
            res.end();
        };

        self.mockCSServer = http.createServer(self.contextstoreApp).listen(5000, function (err) {
            if (err) {
                done(err);
            }
            else {
                console.log('Mock CS running on port 5001.');
                done(null);
            }
        });

    });

    before(function (done) {

        /* run mock MELD */

        self.meldApp = function (req, res) {
            res.writeHead(200, {"Content-Type": "text"});
            res.write("Mock MELD server");
            res.end();
        };

        self.mockMELDServer = http.createServer(self.meldApp).listen(5002, function (err) {
            if (err) {
                done(err);
            }
            else {
                console.log('Mock MELD running on port 5002.');
                done(null);
            }
        });

    });


    it('IVR enriched to also send to MELD', function (done) {
        var meldJson = require('../test_data/other_payloads/ivr_enrich.json');
        //TODO use sendToMELD() from actual code 

        var opts = {
            headers: {
                'Content-Type': 'application/json'
            },
            url: self.serverName,
            json: true,
            body: meldJson,
            method: 'POST'
        };

        request(opts, function (error, response, body) {
            if (error) {
                done(error);
            }
            else {
                assert(response.statusCode == 201);
                assert(response.body.context_store.statusCode == 201);
                assert(response.body.MELD.statusCode == 200);
                done();
            }
        });

    });

    after(function (done) {
        //close down mockservers 
        self.mockMELDServer.close();
        self.mockCSServer.close();
        console.log("Stopped MELD/Contexstore mocks");
        done();
    });
});
