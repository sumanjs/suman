var app = require('../../app');
var assert = require('assert');
var config = require('univ-config')(module, '*SC*', 'config/server-config');
var fs = require('fs');
var http = require('http');
var log = require('baymax-logger');
var util = require('util');

var SmartConnectServer = require('../../lib/smartconnectServer');
var env = config.get('sc_env');
var port = env.smartconnect_server_config.port;

describe('event-router', function(){
    // setup app
    var scserver = null;
    before(function(done){
        log.info('SmartConnect server starting...');
        log.info('runtime NODE_ENV:', process.env.NODE_ENV);
        scserver = new SmartConnectServer({
            app: app
        });
        scserver.init();
        setTimeout(function(){
            done();
        },100);
    });
    after(function(done){
        scserver.restApi.close();
        done();
    });
    describe('#rateLimit', function(){
        var should = 'should return proper error when payload missing source ';
        should += 'or source.incident';
        it(should, function(done){
            var postData = fs.readFileSync('./test/unit/fixtures/invalid_post_missing_source_incident.json');
            var opts = {
                port: port,
                hostname: 'localhost',
                method: 'POST',
                path: '/event',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            var reply = '';
            var req = http.request(opts, function(res){
                res.on('data', function(chunk){
                    reply += chunk;
                });
                res.on('end', function(){
                    var msg = 'wrong status code, expected 500';
                    var repJSON = JSON.parse(reply);
                    assert(res.statusCode === 400, msg);
                    msg = 'unexpected reply data, success should be \'false\'';
                    assert(repJSON.success === false, msg);
                    var expected = 'Invalid payload, incident required to have source field';
                    var m = 'wrong error message, got \'%s\' expected \'%s\'';
                    msg = util.format(m, repJSON.data.error.message, expected);
                    assert(repJSON.data.error.message === expected, msg);
                    done();
                })
            });
            req.on('error', function(error){
                done(error);
            });
            req.write(postData);
            req.end();
            // submit invalid post
            // assert on reply
        });
    });
});
