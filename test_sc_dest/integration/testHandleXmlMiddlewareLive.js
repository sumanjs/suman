
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

Test.describe('@TestHandleXml*', function(assert){

      var config = this.config = require('univ-config')(module, this.title, 'config/test-config');

      var server;
      var payload = ''; // stringified XML
      var xmlPath = path.resolve('test', 'test_data', 'xml_payloads', 'IVR_OnDemandErrorCode.xml');

	this.before(() => {

        var constants = config.get('sc_constants');
        var serverURL = config.get('test_env').smartconnect_server_config.url;
        var serverPort = config.get('test_env').smartconnect_server_config.port;
        server = serverURL.concat(':').concat(serverPort);

      });

      	this.beforeEach((t,done) => {
        fs.readFile(xmlPath, 'utf8', function(err, content) {
          if (err) throw err;
          payload = content;
          done();
        });
      });

      	this.it('should accept request Content-type "text/xml or application/xml"', (t,done) => {
        request(server)
          .post('/event')
          .set('Content-Type', 'application/xml')
          .send(payload)
          .expect(201, done);
      });



      	this.it('should transform XML payload into JSON object', (t,done) => {
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


	this.describe('JSONified XML IVR payload', function(){
        	this.it('should have certain properties in the right casing', (t,done) => {

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



	this.describe('JSONified XML ITG payload', function(){

	this.before(done => {

            var xmlITGPath = path.resolve('test', 'test_data', 'xml_payloads', 'itg_data.xml');
            fs.readFile(xmlITGPath, 'utf8', function(err, content) {
              if (err) throw err;
              payload = content;
              done();
            });

          });

          	this.it('should have the right keys in JSON', (t,done) => {

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
