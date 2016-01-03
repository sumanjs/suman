/**
 * Created by denman on 12/30/2015.
 */


var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var _ = require('underscore');
var readline = require('readline');
var colors = require('colors/safe');


function Suman(obj) {
    this.outputPath = obj.outputPath;
    this.usingRunner = obj.usingRunner;
    this.config = obj.config;
    this.timestamp = obj.timestamp;
    this.ctx = {};
}

/*
 Suman.prototype.log = function (data, test) {

 var json = JSON.stringify({
 userOutput: true,
 testId: test.testId,
 desc: test.desc,
 data: data
 });

 //fs.appendFileSync(this.outputPath, json += ',');
 };

 Suman.prototype.logData = function (test) {

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

 };*/

Suman.prototype.log = function (userInput, test) {

    var self = this;

    var data = {
        type: 'USER_LOG',
        userOutput: true,
        testId: test.testId,
        data: userInput,
        outputPath: self.outputPath
    };

    if (process.send) {
        process.send(data);
    }
    else {

        if (this.outputPath) {
            var json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
        }
    }
};


Suman.prototype.logData = function (test) {

    test.error = test.error || null;

    var self = this;

    var data = {
        test: test,
        type: 'LOG_DATA',
        outputPath: self.outputPath
    };

/*    var obj = {};

    //console.log('test:', test);

    Object.keys(test).forEach(function (key) {

        var val = test[key];
        if (Array.isArray(val)) {
            if (val.length > 0) {
                obj[key] = val;
            }
        }
        else {
            obj[key] = val;
        }
    });*/

    if (process.send) {
        process.send(data);
    }
    else {

        if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }
    }

};

var successCount = 0;

Suman.prototype.logResult = function (test) {

    var self = this;

    var data = {
        test: test,
        type: 'LOG_RESULT',
        outputPath: self.outputPath
    };


    if (process.send) {
        process.send(data);
    }
    else {

        if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }

        if (data.test.error) {
            console.log('\ntest fail:', data.test.error);
        }
        else {
            successCount++;
            readline.clearLine(process.stdout, 0);
            process.stdout.write('\r' + colors.green('Pass count: ' + successCount));
        }

    }

};



function makeSuman($module, configPath) {

    var usingRunner = false;
    if (process.argv.indexOf('--runner') > -1) { //does our flag exist?
        usingRunner = true;
    }

    var config;
    var temp;
    try {
        temp = path.resolve(path.normalize(appRootPath + '/' + configPath));
        config = require(temp);
    }
    catch (err) {
        console.log('could not resolve path to config file:', temp);
        return;
    }

    var timestamp = null;
    var outputPath = null;

    if (config.output && config.output.web) {

        var outputDir = config.output.web.outputDir;

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

        outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');

        try {
            var unlink = fs.unlinkSync(outputPath);
        }
        catch (err) {
            //console.error(err);
        }
    }
    else {
        timestamp = Date.now();
    }


    return new Suman({
        outputPath: outputPath,
        config: config,
        timestamp: timestamp,
        usingRunner: usingRunner
    });

}

module.exports = makeSuman;