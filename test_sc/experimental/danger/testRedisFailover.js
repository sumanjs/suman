/**
 * Created by amills001c on 7/1/15.
 */


//logging
var log = require('baymax-logger');

//core
var sentinel = require('redis-sentinel');

describe('@Test_Redis_Failover*', function () {


    var config = require('univ-config')(module,'*77', 'config/test-config');
    var redisConfig = config.get('test_env').redis_server_config;
    var REDIS_SENTINEL_MASTER_NAME = redisConfig.sentinel_master_name;
    var endpoints = redisConfig.sentinel_endpoints;
    var sentinelClient = sentinel.createClient(endpoints, {role: 'sentinel'});


    it('redis-failover=tests Redis failover capability', function (done) {

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