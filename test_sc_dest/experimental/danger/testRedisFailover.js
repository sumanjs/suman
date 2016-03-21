
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
 * Created by amills001c on 7/1/15.
 */


//logging
var log = require('baymax-logger');

//core
var sentinel = require('redis-sentinel');

Test.describe('@Test_Redis_Failover*', function(assert){


    var config = require('univ-config')(module,'*77', 'config/test-config');
    var redisConfig = config.get('test_env').redis_server_config;
    var REDIS_SENTINEL_MASTER_NAME = redisConfig.sentinel_master_name;
    var endpoints = redisConfig.sentinel_endpoints;
    var sentinelClient = sentinel.createClient(endpoints, {role: 'sentinel'});


    	this.it('redis-failover=tests Redis failover capability', (t,done) => {

        sentinelClient.send_command('SENTINEL', ['failover', REDIS_SENTINEL_MASTER_NAME], function (err, resp) {

            if (err) {
                done(err);
            }
            else {
                log.info(resp);
                done(null);
            }

        });

    });

});
