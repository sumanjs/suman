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


describe('@Test_TVNS*', function() {

  var self = null;

  before(function() {

    self = this;
    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    this.constants = config.get('sc_constants');
    this.serverURL = config.get('test_env').smartconnect_server_config.url;
    this.serverPort = config.get('test_env').smartconnect_server_config.port;
        this.tvnsPayload = require('../test_data/tvns_payloads/tvnsPayload.json');
    this.$url = this.serverURL.concat(':').concat(this.serverPort);

  });


  describe('For incident.source = STB, check rule TVNS', function() {

    this.timeout(20000);

    it('IF event.events[0].error_code = null THEN No TVNS data should be sent.', function(done) {
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

    it('IF event.events[0].error_code != <given error_code> THEN No TVNS data should be sent.', function(done) {
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

    it('IF event.events[0].error_code = SRM-999999, THEN Send TVNS data.', function(done) {
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

    it('IF event.events[0].error_code = SRM-9020, THEN Send TVNS data.', function(done) {
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

    it('IF event.events[0].error_code = SRM-36866, THEN Send TVNS data.', function(done) {
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

    it('IF event.events[0].error_code = SRM-128, THEN Send TVNS data.', function(done) {
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

    it('IF event.events[0].error_code = SRM-36896, THEN Send TVNS data.', function(done) {
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
