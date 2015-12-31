/**
 * Created by denman on 12/30/2015.
 */


var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var _ = require('underscore');

function Suman(obj) {
    this.outputPath = obj.outputPath;
    this.usingRunner = obj.usingRunner;
    this.config = obj.config;
    this.timestamp = obj.timestamp;
}

Suman.prototype.log = function (data, test) {

    var json = JSON.stringify({
        userOutput: true,
        testId: test.testId,
        desc: test.desc,
        data: data
    });

    //fs.appendFileSync(this.outputPath, json += ',');
};

Suman.prototype.logErrors = function (test) {

    test.error = test.error || null;

    //var obj = {};
    //
    ////console.log('test:', test);
    //
    //Object.keys(test).forEach(function (key) {
    //
    //    var val = test[key];
    //    if (Array.isArray(val)) {
    //        if (val.length > 0) {
    //            obj[key] = val;
    //        }
    //    }
    //    else {
    //        obj[key] = val;
    //    }
    //});

    var json = JSON.stringify(test);
    fs.appendFileSync(this.outputPath, json += ',');

};


function makeSuman($module, configPath) {

    var usingRunner = false;
    if (process.argv.indexOf('--runner') > -1) { //does our flag exist?
        usingRunner = true;
    }

    var config;
    var temp;
    try{
        temp = path.resolve(path.normalize(appRootPath + '/' + configPath));
        config = require(temp);
    }
    catch(err){
        console.log('could not resolve path to config file:', temp);
    }

    var outputDir = config.outputDir;

    var timestamp = null;
    if (usingRunner) {
        timestamp = process.argv[process.argv.indexOf('--ts') + 1];
        if (!timestamp) {
            throw new Error('no timestamp provided by Suman test runner');
        }
    }
    else {
        try {
            timestamp = Date.now();
            fs.mkdirSync(path.resolve(appRootPath + '/' + outputDir + '/' + String(timestamp)));
        }
        catch (err) {
            throw err;
        }
    }

    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');

    try {
        var unlink = fs.unlinkSync(outputPath);
    }
    catch (err) {

    }

    return new Suman({
        outputPath: outputPath,
        config: config,
        timestamp: timestamp,
        usingRunner: usingRunner
    });

}

module.exports = makeSuman;