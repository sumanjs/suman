
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

/*
 * Load test with Enrichment, should be run as follows:
 *
 * NODE_ENV=test_local REQUESTS=10 CONCURRENT=2 mocha test/integration/testLoadEnrichment.js
 */

//core
var arete = require('arete');
var assert = require('assert');
var request = require('request');

Test.describe('@Test_Load_Enrichment*', function(assert){

	this.before(() => {

        // test env
        var config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
        this.constants = config.get('sc_constants');
        this.serverURL = config.get('test_env').smartconnect_server_config.url;
        this.serverPort = config.get('test_env').smartconnect_server_config.port;
        this.$url = this.serverURL.concat(':').concat(this.serverPort);

        this.accountNums = ["8497404620452729", "8499101410192154"];
        this.jsonDataForEnrichment = require('../test_data/other_payloads/test-enrich-load.json');
        this.jsonDataForEnrichment.payload.customer.accountnum = this.accountNums[1];
        this.jsonDataForEnrichment.payload.customer.data.accountnum = this.accountNums[1];
        this.numRequests = ( process.env.REQUESTS ) ? process.env.REQUESTS : 1;
        this.concurrency = ( process.env.CONCURRENT ) ? process.env.CONCURRENT : 1;

    });

    	this.it('Load Test', (t,done) => {

        var self = this;

        arete.loadTest({
            name: 'smartconnect-enrichmentloadtest',
            requests: self.numRequests,
            concurrentRequests: self.concurrency,
            targetFunction: function (cb) {
                request({
                        url: self.$url + '/event',
                        json: true,
                        body: self.jsonDataForEnrichment,
                        method: 'POST'
                    },
                    function (error, response, body) {
                        assert(response.statusCode == 201, "Error: Response Code");
                        cb(error, body);
                    });

            },
            printReport: true,
            printResponses: false,
            callback: function (err, report) {
                if (err) {
                    return done(err);
                }
                else {
                    assert(report.timeElapsed < 10000, "Unacceptable. Exceeded expected time of 10 seconds for " + self.numRequests + " Requests with " + self.concurrency + " Concurrent users to complete!");
                    done(null);
                }

            }
        });
    });
});


