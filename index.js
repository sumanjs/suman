/**
 * Created by amills001c on 11/24/15.
 */


/* advantages of Suman
 *
 * better than mocha, cleaner than vows
 * no globals - no global NPM module - no global variables
 * test suites each run in separate process for speed and correctness
 * each test suite can have parallel components, allowing the developer to run tests serially, in parallel or in combination, as the developer sees fit
 * code inside any test will not run for any test not intended to run when using grep features
 * organize your tests depending on NODE_ENV or command line flags using config files, instead of putting tests in different top-level folders in your project
 *  asynchronous reporting capablities - write test results to DB
 *
 * */


//note: https://www.npmjs.com/package/gulp-mocha


//var Promise = require('bluebird');
var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');


function makeSuman($module, configPath) {


    var config = require(path.resolve(appRootPath + '/' + configPath));
    var outputDir = config.outputDir;
    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + path.basename($module.filename, '.js') + '.txt');

    //var wstream = fs.createWriteStream(outputPath);

    try {
        var unlink = fs.unlinkSync(outputPath);
    }
    catch (err) {

    }

    var log = function (data, test) {
        var json = JSON.stringify({
            userOutput: true,
            testId: test.testId,
            desc: test.desc,
            data: data
        });

        fs.appendFileSync(outputPath, json += ',');
    };

    var logErrors = function (test) {

        test.error = test.error || null;

        var json = JSON.stringify(test);
        fs.appendFileSync(outputPath, json += ',');
    };


    return {

        suite: require('./lib/ntf').main(log, logErrors),
        given: given

    }


}

makeSuman.Runner = require('./lib/runner');


var given = function (cb1) {

    var prom = cb1();

    return {
        when: function (cb2) {

            prom = prom.then(cb2);

            return {
                then: function (cb3) {

                    console.log(cb3);

                    //try {
                    //    //var promise = cb1();
                    //    //var promise = cb2();
                    //    //var promise = cb3();
                    //
                    prom.then(cb3);
                    //}
                    //catch (err) {
                    //    console.error(err);
                    //}

                    return this;
                }
            }

        }
    }
};


module.exports = makeSuman;

