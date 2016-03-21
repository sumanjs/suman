
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
