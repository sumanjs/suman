
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
 *

 TVNS Rule -
 IF events.statusDesc = status_desc from tvns.csv AND
 events.error_code = SRM-999999/SRM-36866/SRM-128/SRM-36896/SRM-9020 AND
 events.data.division = 'West'
 THEN sendToTVNS

 *
 *
 */


//core
var request = require('supertest');
var http = require('http');
var assert = require('assert');


Test.describe('@Test_TVNS*', function(assert){

  var self = null;

	this.before(() => {

    self = this;
    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    this.constants = config.get('sc_constants');
    this.serverURL = config.get('test_env').smartconnect_server_config.url;
    this.serverPort = config.get('test_env').smartconnect_server_config.port;
        this.tvnsPayload = require('../test_data/tvns_payloads/tvnsPayload.json');
    this.$url = this.serverURL.concat(':').concat(this.serverPort);

  });


	this.describe('For incident.source = STB, check rule TVNS', function(){

    this.timeout(20000);

    	this.it('IF event.events[0].error_code = null THEN No TVNS data should be sent.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = null;
      request(self.$url)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    	this.it('IF event.events[0].error_code != <given error_code> THEN No TVNS data should be sent.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = "SRM-0000";

      request(self.$url)
        .post('/event')
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    	this.it('IF event.events[0].error_code = SRM-999999, THEN Send TVNS data.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = "SRM-999999";

      request(self.$url)
        .post('/event')
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);

          if (!res.body.TVNS.details.hasOwnProperty('transactionId'))
            assert.fail(res.body.TVNS.details.transactionId, 'undefined', 'Transaction ID not found for TVNS alert');
          done(null);

        });
    });

    	this.it('IF event.events[0].error_code = SRM-9020, THEN Send TVNS data.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = "srm-9020";

      request(self.$url)
        .post('/event')
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          if (!res.body.TVNS.details.hasOwnProperty('transactionId'))
            assert.fail(res.body.TVNS.details.transactionId, 'undefined', 'Transaction ID not found for TVNS alert');
          done(null);

        });
    });

    	this.it('IF event.events[0].error_code = SRM-36866, THEN Send TVNS data.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = "Srm-36866";

      request(self.$url)
        .post('/event')
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);

          if (!res.body.TVNS.details.hasOwnProperty('transactionId'))
            assert.fail(res.body.TVNS.details.transactionId, 'undefined', 'Transaction ID not found for TVNS alert');
          done();

        });
    });

    	this.it('IF event.events[0].error_code = SRM-128, THEN Send TVNS data.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = "SRM-128";

      request(self.$url)
        .post('/event')
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          if (!res.body.TVNS.details.hasOwnProperty('transactionId'))
            assert.fail(res.body.TVNS.details.transactionId, 'undefined', 'Transaction ID not found for TVNS alert');
          done();

        });
    });

    	this.it('IF event.events[0].error_code = SRM-36896, THEN Send TVNS data.', (t,done) => {
      self.tvnsPayload.payload.events[0].error_code = "SRM-36896";

      request(self.$url)
        .post('/event')
        .send(self.tvnsPayload)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          if (!res.body.TVNS.details.hasOwnProperty('transactionId'))
            assert.fail(res.body.TVNS.details.transactionId, 'undefined', 'Transaction ID not found for TVNS alert');
          done();

        });
    });
  });
});
