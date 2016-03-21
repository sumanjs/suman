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
 */


//logging
var log = require('baymax-logger');

//core
var assert = require('assert');
var http = require('http');
var request = require('request');
var _ = require('underscore');

Test.describe('@Test_EBIF_Routes*', function (assert) {

    this.before(() => {

        var config = this.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        this.constants = config.get('sc_constants');
        this.serverURL = config.get('test_env').smartconnect_server_config.url;
        this.serverPort = config.get('test_env').smartconnect_server_config.port;
        this.csDataHelper = require('../../lib/csDataHelper');
        this.cspHelper = require('../../lib/cspHelper');

    });


    this.describe('test all individual EBIF routes here', function () {


        this.before(done => {

            var self = this; //we can reference self/this in all the tests below, this seems to be the Mocha way

            self.incidents = [];

            var url = 'http://sckbrpt-wc-a1p.sys.comcast.net:9200/_all/_search?pretty';

            var jsonData = require('../../cs_query_terms/query_source:sc.json');

            jsonData.query.filtered.query.bool.should[0].query_string.query = "source:STB";
            jsonData.query.filtered.filter.bool.must[0].range['@timestamp'].from = Date.now() - 10000000;
            jsonData.query.filtered.filter.bool.must[0].range['@timestamp'].to = Date.now() - 1000;

            log.debug({data: jsonData}, 'Data being fed to query'); //bunyan idiom => this becomes {msg: 'Data being fed to query', data: {jsonData here} }

            request({
                method: 'POST',
                uri: url,
                headers: {'content-type': 'application/json'},
                json: jsonData

            }, function (err, response, body) {

                if (err) {
                    done(err);
                }
                else {

                    var hits = body.hits.hits;

                    _.each(hits, function (hit, index) {
                        self.incidents.push({
                            incidentId: hit._source.incident.correlation_id,
                            accountNum: hit._source.customer.accountnum
                        });
                    });

                    self.incidents = _.uniq(self.incidents, function (item, key, a) {
                        return item.accountNum;
                    });

                    var phoneNums = ['650-554-2384', '650-155-9111', '413-912-3344'];

                    self.incidents.forEach(function (incident, index) {
                        incident.phoneNumber = _.sample(phoneNums);
                    });

                    var err = null;
                    if (self.incidents.length < 3) {
                        err = new Error('not enough incidents for a proper test');
                    }

                    done(err);
                }
            });
        });


        this.after(() => {

            log.debug('after hook has just been run.');

        });

        this.it('[test] start_troubleshooting', (t, done) => {


            var url = this.serverURL.concat(':').concat(this.serverPort).concat('/ebif/troubleshoot/start_troubleshooting');
            var rand = Math.floor(Math.random() * this.incidents.length);

            var jsonData = {
                "incident_id": this.incidents[rand].incidentId, //pull a random incident_id from the array
                "step": "doesn't matter right now",
                "action": "doesn't matter right now"
            };

            request({
                method: 'POST',
                uri: url,
                headers: {
                    'content-type': 'application/json',
                    'sc_test_env': process.env.NODE_ENV
                },
                json: jsonData

            }, function (err, response, body) {

                if (err) {
                    done(err);
                }
                else {
                    assert.strictEqual(body.error, undefined);
                    done();
                }
            });
        });


        this.it('[test] pay_by_phone', (t, done) => {

            var url = this.serverURL.concat(':').concat(this.serverPort).concat('/ebif/troubleshoot/pay_by_phone');
            var rand = Math.floor(Math.random() * this.incidents.length);


            var jsonData = {
                "incident_id": this.incidents[rand].incidentId,
                "step": "payByPhone",
                "action": "paymentChoice"
            };


            request({
                method: 'POST',
                uri: url,
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

        });


        this.it('[test] callback_confirmed', (t, done) => {

            var rand = Math.floor(Math.random() * this.incidents.length);
            var incident = this.incidents[rand];

            var url = this.serverURL.concat(':').concat(this.serverPort).concat('/ebif/troubleshoot/callback_confirmed?callback_number=' + incident.phoneNumber);

            var jsonData = {
                "incident_id": incident.incidentId,
                "step": "doesn't matter right now",
                "action": "doesn't matter right now"
            };

            log.debug('data randomly selected for ', this.test.title, ':', jsonData);

            request({
                method: 'POST',
                uri: url,
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
        });
    });
});
