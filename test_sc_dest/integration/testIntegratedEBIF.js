
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
 * Created by amills001c on 8/17/15.
 *
 *
 * run as: "env INCIDENT_ID=19b21954-f9b6-4b4b-91c6-eef3b9d1c72e NODE_ENV=dev_local mocha test --no-timeouts --grep 'Integrated'"
 *
 *  you can pull an incident_id by running scripts/getIncidentIds.js
 */


//logging
var log = require('baymax-logger');

//core
var assert = require('assert');
var http = require('http');
var request = require('request');
var async = require('async');
var debug = require('debug')('mocha');
var _ = require('underscore');


Test.describe('@Test_Integrated_EBIF*', function(assert){

    var self = null;

	this.before(done => {

        self = this;

        var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        //this.incidentId = process.env.INCIDENT_ID; //you need to load incident_id from the command line, see instructions above
        this.constants = this.config.get('sc_constants');
        this.serverURL = this.config.get('test_env').smartconnect_server_config.url;
        this.serverPort = this.config.get('test_env').smartconnect_server_config.port;
        this.csDataHelper = require('../../lib/csDataHelper');
        this.cspHelper = require('../../lib/cspHelper');

        var url = 'http://sckbrpt-wc-a3p.sys.comcast.net:9200/_all/_search?pretty';

        var jsonData = require('../../cs_query_terms/query_source:sc.json');

        jsonData.query.filtered.query.bool.should[0].query_string.query = "source:STB";
        jsonData.query.filtered.filter.bool.must[0].range['@timestamp'].from = Date.now() - 1000000;
        jsonData.query.filtered.filter.bool.must[0].range['@timestamp'].to = Date.now() - 100;

        log.debug('Data being fed to query:', JSON.stringify(jsonData));

        request({
            method: 'POST',
            uri: url,
            headers: {'content-type': 'application/json'},
            json: jsonData

        }, function (err, response, body) {

            if (err) {
                console.error(err);
            }
            else {

                var incidents = [];

                var hits = body.hits.hits;

                _.each(hits, function (hit, index) {
                    incidents.push({
                        incidentId: hit._source.incident.correlation_id,
                        accountNum: hit._source.customer.accountnum
                    });
                });

                log.debug('Length of incidents array before unique filter: ' + incidents.length);


                incidents = _.uniq(incidents, function (item, key, a) {
                    return item.accountNum;
                });

                log.debug('Length of incidents array after unique filter: ' + incidents.length);
                log.debug('Incidents array:', JSON.stringify(incidents));


                if (incidents.length < 1) {
                    done(new Error('not enough incidents for a proper test'));
                }
                else {
                    self.incidentId = _.sample(incidents).incidentId;
                    done(null);
                }
            }
        });

    });


    	this.it('[test] integrated', (t,done) => {

        if (!this.incidentId) {
            return done(new Error('null incidentId, most likely no incidentid was passed at command line.'));
        }

        var phoneNumber = null;

        var jsonData = {
            "incident_id": this.incidentId,
            "step": "doesn't matter right now",
            "action": "doesn't matter right now"
        };

        async.series([
                startTroubleShooting.bind(this),
                payByPhone.bind(this),
                callbackConfirmed.bind(this)
            ],
            function complete(err, results) {

                done(err, results);

            });


        function startTroubleShooting(cb) {

            request({
                method: 'POST',
                uri: this.serverURL.concat(':').concat(this.serverPort).concat('/ebif/troubleshoot/start_troubleshooting'),
                headers: {
                    'Content-type': 'application/json',
                    'sc_test_env': process.env.NODE_ENV
                },
                json: jsonData

            }, function (err, response, body) {

                if (err) {
                    cb(err);
                }
                else {
                    assert.strictEqual(body.error, undefined);
                    cb(null);
                }
            });
        }

        function payByPhone(cb) {


            request({
                method: 'POST',
                uri: this.serverURL.concat(':').concat(this.serverPort).concat('/ebif/troubleshoot/pay_by_phone'),
                json: jsonData,
                headers: {
                    'Content-Type': 'application/json',
                    'sc_test_env': process.env.NODE_ENV
                }

            }, function (err, response, body) {

                if (err) {
                    cb(err);
                }
                else {

                    try {
                        phoneNumber = body.template.list[0].label;
                        if (!phoneNumber) {
                            phoneNumber = body.template.list[1].label;
                        }
                    }
                    catch (err) {
                        //do nothing
                    }

                    assert.equal(body.error, undefined);
                    cb(null);
                }
            });
        }


        function callbackConfirmed(cb) {

            if (!phoneNumber) {
                log.info(colors.bgMagenta('warning: no callback phone number available for this customer, so callbackConfirmed route was not tested.'));
                return cb(null);
            }

            request({
                method: 'POST',
                uri: this.serverURL.concat(':').concat(this.serverPort).concat('/ebif/troubleshoot/callback_confirmed?callback_number=' + phoneNumber),
                json: jsonData,
                headers: {
                    'Content-Type': 'application/json',
                    'sc_test_env': process.env.NODE_ENV
                }

            }, function (err, response, body) {

                if (err) {
                    done(err);
                }
                else {
                    assert.equal(body.error, undefined);
                    done(null);
                }

            });
        }
    });
});
