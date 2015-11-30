/**
 * Created by amills001c on 11/24/15.
 */


/* advantages of Suman
*
* test suites each run in separate process for speed and correctness
* each test suite can have parallel components, allowing the developer to run tests serially, in parallel or in combination, as the developer sees fit
* code inside any test will not run for any test not intended to run
* organize your tests depending on NODE_ENV or command line flags using config files, instead of putting tests in different top-level folders in your project
*
* */



var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');


function makeSuman($module, configPath) {


    var config = require(path.resolve(appRootPath + '/' + configPath));
    var outputDir = config.outputDir;
    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + path.basename($module.filename, '.js') + '.txt')

    var wstream = fs.createWriteStream(outputPath);

    var log = function (data, test) {
        var json = JSON.stringify({
            testId: test.testId,
            children: test.children,
            testsParallel: test.testsParallel,
            desc: test.desc,
            data: data
        });
        //wstream.write(json);
        //wstream.write(';');
    }

    var logErrors = function (err, test) {
        var json = JSON.stringify({
            testId: test.testId,
            desc: test.desc,
            tests: test.tests,
            testsParallel: test.testsParallel,
            loopTests: test.loopTests,
            children: test.children,
            error: err,
        });
        wstream.write(json);
        wstream.write(',');
    }


    return {

        suite: require('./lib/ntf').main(log, logErrors)

    }


}

makeSuman.Runner = require('./lib/runner');

module.exports = makeSuman;