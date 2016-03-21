
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
 * Created by avonne201 on 11/24/14.
 */

//core
var http = require('http');
var supertest = require('supertest');
var assert = require('assert');
var _ = require('underscore');

Test.describe('@Test_Smart_Connect*', function(assert){

  var self = null;

	this.before(() => {

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


	this.describe('Should accept all incoming messages...', function(){

    	this.it('Should return 400 when message is not JSON or XML', (t,done) => {

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

    	this.it('Should accept request with source STB and the request body received should not be enriched.', (t,done) => {

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

    	this.it('Should accept request with source IVR and the request body received should not be enriched.', (t,done) => {

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

    	this.it('Should accept request that is not source IVR or STB and the request body received should not be enriched.', (t,done) => {

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

    	this.it('Should enrich data for source STB.', (t,done) => {

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

    	this.it('Should enrich data for source IVR.', (t,done) => {

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

    	this.it('Should not forward empty payload to contextstore', (t,done) => {

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

    	this.it('Should not enrich data for source STB when no_enrich is set to true.', (t,done) => {

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

    	this.it('Should return 201 when given erroneous STB json.', (t,done) => {
      var reqServer = supertest(self.serverName);
      var getPath = reqServer.post('/event');
      var send = getPath.send(self.STBTestJson);
      var expect = send.expect(201);
      send.end(function(err, res) {
        assert(err == null);
        done();
      });
    });

    	this.it('Should return 201 when given erroneous IVR json.', (t,done) => {
      supertest(self.serverName)
        .post('/event')
        .send(self.IVRTestJson)
        .expect(201)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    	this.it('Should return 400 when request has null account number.', (t,done) => {

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
