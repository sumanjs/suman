
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
 * Created by amills001c on 10/15/15.
 */


//logging
var log = require('baymax-logger');

//core
var request = require('request');
var assert = require('assert');


Test.describe('@TestHeartbeat*', function(assert){

  var self = null;

	this.before(() => {

    self = this;

    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    self.constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.url = serverURL.concat(':').concat(serverPort).concat('/heartbeat');

    log.info('url requested is:', self.url);

  });


  	this.it('[test] heartbeat route', (t,done) => {

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
