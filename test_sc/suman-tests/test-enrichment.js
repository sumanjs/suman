/**
 * Created by amills001c on 3/15/16.
 */


var suman = require('/Users/amills001c/WebstormProjects/oresoftware/suman');
var Test = suman.init(module);

Test.describe('@Test_Enrichment*', {parallel: true}, function (request, db, path, fs, should) {

    var config = this.config = require('univ-config')(module, this.desc, 'config/test-config');
    var constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    var serverEndpoint = serverURL + ':' + serverPort + '/event';

    var self = this;

    fs.readdirSync(__dirname + '/../test_data/enriched_payloads').filter(function (file) {

        return (path.extname(file) === '.json');

    }).map(function (file) {

        return path.resolve(__dirname + '/../test_data/enriched_payloads/' + file);

    }).forEach(function (file) {

        self.it('[test] ' + path.basename(file), function (done) {

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
