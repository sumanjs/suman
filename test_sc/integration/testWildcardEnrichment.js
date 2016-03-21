
/*
 * Created by nayali002c on 02/23/16.
 */

//core
var http = require('http');
var request = require('supertest');
var assert = require('assert');
var _ = require('underscore');

describe('@Test_Wildcard_Enrichment*', function () {

  var self = null;

  before(function () {

    self = this;

    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');

    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.serverEndpoint = serverURL + ':' + serverPort;

    self.ivrEnrich = require('../test_data/other_payloads/ivr_wildcard_enrich.json');

  });


  describe('Should populate proper values...', function () {

    it('Should accept request with source IVR and the request body received' +
        ' should be enriched.', function (done) {

      request(self.serverEndpoint)
          .post('/event')
          .set('sc_test_env', process.env.NODE_ENV)
          .send(self.ivrEnrich)
          .expect(201)
          .end(function (err, res) {
            if (err) {  done(err);  }
            else {  done(); }
          });
    });

  });
});