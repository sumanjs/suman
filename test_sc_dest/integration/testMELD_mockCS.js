
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

Test.describe('@Test_IVRtoMELD*', function(assert){

    var self = this;
    var config = require('univ-config')(module, this.title, 'config/test-config');
    var constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.serverName = serverURL + ':' + serverPort + '/event';

	this.before(done => {

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

	this.before(done => {

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


    	this.it('IVR enriched to also send to MELD', (t,done) => {
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

	this.after(done => {
        //close down mockservers 
        self.mockMELDServer.close();
        self.mockCSServer.close();
        console.log("Stopped MELD/Contexstore mocks");
        done();
    });
});
