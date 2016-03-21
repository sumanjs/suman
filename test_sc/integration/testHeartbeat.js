/**
 * Created by amills001c on 10/15/15.
 */


//logging
var log = require('baymax-logger');

//core
var request = require('request');
var assert = require('assert');


describe('@TestHeartbeat*', function() {

  var self = null;

  before(function() {

    self = this;

    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    self.constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.url = serverURL.concat(':').concat(serverPort).concat('/heartbeat');

    log.info('url requested is:', self.url);

  });


  it('[test] heartbeat route', function(done) {

      request(this.url, function(error, response, body) {

          assert(error == null);
          assert(response.statusCode === 200);

          body = JSON.parse(body);
          log.debug(body);

          assert('individual_test_results' in body);
          var testCases = body['individual_test_results'];

          for (var i = 0; i < testCases.length; i++) {
            assert(testCases[i].result === 'success', 'fail message received for test' + testCases[i].test_name);

        }

        log.info('---------- good news ---------- overall heartbeat test is successful');
        done();

      });
  });
});
