/*
 * Created by avonne201 on 11/24/14.
 */

//core
var http = require('http');
var supertest = require('supertest');
var assert = require('assert');
var _ = require('underscore');

describe('@Test_Smart_Connect*', function() {

  var self = null;

  before(function() {

    self = this;

    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    var constants = config.get('sc_constants');

    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.serverName = serverURL + ':' + serverPort;

    // Payloads
    self.stbNoEnrich = require('../test_data/other_payloads/stb_no_enrich.json');
    self.ivrNoEnrich = require('../test_data/other_payloads/ivr_no_enrich.json');
    self.otherNoEnrich = require('../test_data/other_payloads/other_no_enrich.json');
    self.stbEnrich = require('../test_data/other_payloads/stb_enrich.json');
    self.ivrEnrich = require('../test_data/other_payloads/ivr_enrich.json');
    self.STBTestJson = require('../test_data/other_payloads/testSTB_bogus.json');
    self.IVRTestJson = require('../test_data/other_payloads/testIVR_bogus.json');
    self.nullAccNo = require('../test_data/other_payloads/nullAccountNum.json');

    self.nullAccNumMsg = {
      'Context Store': {
        statusCode: 201,
        details: 'null options object - possibly due to empty AccountNum.'
      }
    };
  });


  describe('Should accept all incoming messages...', function() {

    it('Should return 400 when message is not JSON or XML', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send('test')
        .expect(400)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should accept request with source STB and the request body received should not be enriched.', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.stbNoEnrich)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });

    it('Should accept request with source IVR and the request body received should not be enriched.', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.ivrNoEnrich)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should accept request that is not source IVR or STB and the request body received should not be enriched.', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.otherNoEnrich)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should enrich data for source STB.', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.stbEnrich)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should enrich data for source IVR.', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.ivrEnrich)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should not forward empty payload to contextstore', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send({})
        .expect(400)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should not enrich data for source STB when no_enrich is set to true.', function(done) {

      // Set the no_enrich to true.
      self.config.set('no_enrich', true);

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.stbEnrich)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should return 201 when given erroneous STB json.', function(done) {
      var reqServer = supertest(self.serverName);
      var getPath = reqServer.post('/event');
      var send = getPath.send(self.STBTestJson);
      var expect = send.expect(201);
      send.end(function(err, res) {
        assert(err == null);
        done();
      });
    });

    it('Should return 201 when given erroneous IVR json.', function(done) {
      supertest(self.serverName)
        .post('/event')
        .send(self.IVRTestJson)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should return 400 when request has null account number.', function(done) {

      supertest(self.serverName)
        .post('/event')
        .set('sc_test_env', process.env.NODE_ENV)
        .send(self.nullAccNo)
        .expect(400)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });
  });
});
