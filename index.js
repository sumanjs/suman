/**
 * Created by amills001c on 11/24/15.
 */


//module.exports = require('./lib/ntf');

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
        wstream.write(';');
    }

    return {
        //log: function (data) {
        //    wstream.write(data);
        //    wstream.write('\n');
        //},
        suite: require('./lib/ntf').main(log, logErrors)

    }


}

makeSuman.Runner = require('./lib/runner');

module.exports = makeSuman;