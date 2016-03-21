/**
 * @author: Ocampo Ronnel C. on 12/4/2015
 *
 * Test - Converting XML payload into a JSON.
 *
 * $ mocha test+/testHandleXmlMiddleware.js
 */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var request = require('supertest');

describe('@TestHandleXml*', function() {

      var config = this.config = require('univ-config')(module, this.title, 'config/test-config');

      var server;
      var payload = ''; // stringified XML
      var xmlPath = path.resolve('test', 'test_data', 'xml_payloads', 'IVR_OnDemandErrorCode.xml');

      before(function() {

        var constants = config.get('sc_constants');
        var serverURL = config.get('test_env').smartconnect_server_config.url;
        var serverPort = config.get('test_env').smartconnect_server_config.port;
        server = serverURL.concat(':').concat(serverPort);

      });

      beforeEach(function(done) {
        fs.readFile(xmlPath, 'utf8', function(err, content) {
          if (err) throw err;
          payload = content;
          done();
        });
      });

      it('should accept request Content-type "text/xml or application/xml"', function(done) {
        request(server)
          .post('/event')
          .set('Content-Type', 'application/xml')
          .send(payload)
          .expect(201, done);
      });



      it('should transform XML payload into JSON object', function(done) {
        request(server)
          .post('/event')
          .set('Content-type', 'application/xml')
          .send(payload)
          .expect(201)
          .end(function(err, res) {

            assert(err == null);
            var jsonifiedXml = JSON.parse(res.text);
            assert(typeof jsonifiedXml === 'object');

            done();
          });

      });


      describe('JSONified XML IVR payload', function() {
        it('should have certain properties in the right casing', function(done) {

          request(server)
            .post('/event')
            .set('Content-type', 'application/xml')
            .send(payload)
            .expect(201)
            .end(function(err, res) {

              assert(err == null);
              done();
            });

        });



        describe('JSONified XML ITG payload', function() {

          before(function(done) {

            var xmlITGPath = path.resolve('test', 'test_data', 'xml_payloads', 'itg_data.xml');
            fs.readFile(xmlITGPath, 'utf8', function(err, content) {
              if (err) throw err;
              payload = content;
              done();
            });

          });

          it('should have the right keys in JSON', function(done) {

            request(server)
              .post('/event')
              .set('Content-type', 'application/xml')
              .send(payload)
              .expect(201)
              .end(function(err, res) {
                assert(err == null);
                done();
              });

          });

        });

      });
});