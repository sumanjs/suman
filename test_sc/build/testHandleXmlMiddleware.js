
/**
 * @author: Ocampo Ronnel C. on 12/4/2015
 *
 * Test - Converting XML payload into a JSON.
 *
 * $ mocha test+/testHandleXmlMiddleware.js
 */


var fs = require('fs');
var path = require('path');
var http = require('http');
var supertest = require('supertest');
var assert = require('assert');

describe('@Test - handleXml()*', function() {

  var self = this;
  var server;
  var payload = ''; // stringified XML
  var xmlPath = path.resolve('test', 'test_data', 'xml_payloads', 'IVR_OnDemandErrorCode.xml');

  before(function(done) {
    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    server = createServer().on('listening', function() {
      done(null);
    });
  });

  beforeEach(function(done) {
    fs.readFile(xmlPath, 'utf8', function(err, content) {
      assert(err == null);
      payload = content;
      done();
    });
  });

  it('should accept request Content-type "text/xml or application/xml"', function(done) {
    supertest(server)
      .post('/event')
      .set('Content-Type', 'application/xml')
      .send(payload)
      .expect(200, done);
  });


  it('should transform XML payload into JSON object', function(done) {
    supertest(server)
      .post('/event')
      .set('Content-type', 'application/xml')
      .send(payload)
      .expect(200)
      .end(function(err, res) {
        assert(err == null,'Error is not null');
        var jsonifiedXml = JSON.parse(res.text);
        assert(typeof jsonifiedXml === 'object','jsonifiedXml not an object');
        done();
      });

  });

  describe('JSONified XML', function() {

    it('should have proper key casing', function(done) {

      supertest(server)
        .post('/event')
        .set('Content-type', 'application/xml')
        .send(payload)
        .expect(200)
        .end(function(err, res) {
          assert(err == null);
          var payload = JSON.parse(res.text);
          payload = payload.events[0].data;
          assert(payload.hasOwnProperty('ppv'),'Bad value for ppv');
          assert(payload.hasOwnProperty('mac'),'Bad value for mac');
          assert(payload.hasOwnProperty('appName'),'Bad value for appName');
          assert(payload.hasOwnProperty('divisionId'),'Bad value for divisionId');
          assert(payload.hasOwnProperty('callTime'),'Bad value for callTime');
          assert(payload.hasOwnProperty('callDate'),'Bad value for callDate');
          assert(payload.hasOwnProperty('ivrLOB'),'Bad value for ivrLOB');

          done();
        });
    });
  });
});


function createServer(opts) {

  //Note: this is a good pattern, definitely

  var handleXml = require(path.resolve('lib', 'handleXml'));

  var server = http.createServer(function(req, res) {
    handleXml(req, res, function(err) {
      res.statusCode = err ? (err.status || 500) : 200;
      res.end(err ? err.message : JSON.stringify(req.body));
    });
  });

  server.listen(5999);  //TODO: which port should this be listening on? a unused port, surely

  return server;
}
