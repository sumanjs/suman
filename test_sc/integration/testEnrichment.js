/**
 *
 *
 * Created by pbarve001c on 8/24/15.
 *
 *
 *  note: see Mocha website for information on dynamic tests
 *
 */

var request = require('request');
var path = require('path');
var fs = require('fs');
var should = require('should');

describe('@Test_Enrichment*', function () {

    var config = this.config = require('univ-config')(module, this.title, 'config/test-config');
    var constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    var serverEndpoint = serverURL + ':' + serverPort + '/event';

    fs.readdirSync(__dirname + '/../test_data/enriched_payloads').filter(function (file) {

        return (path.extname(file) === '.json');

    }).map(function (file) {

        return path.resolve(__dirname + '/../test_data/enriched_payloads/' + file);

    }).forEach(function (file) {

        it('[test] ' + path.basename(file), function (done) {

            var jsonDataForEnrichment = require(file);

            request({

                url: serverEndpoint,
                json: true,
                body: jsonDataForEnrichment,
                method: 'POST'

            }, function (error, response, body) {
                if (error)
                    done(error);
                else {
                    response.statusCode.should.be.equal(201);
                    done();
                }
            });

        });

    });
});
