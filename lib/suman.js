/**
 * Created by denman on 12/30/2015.
 */

//extra
var inDebugMode = typeof global.v8debug === 'object';
if (!process.send && inDebugMode) {
    console.log('Are we debugging?', inDebugMode);
}

var fs = require('fs');
var appRootPath = require('app-root-path');

var stream;
if (!process.send) {
    stream = fs.createWriteStream(appRootPath + '/tmp/log.txt');
}

/*global.console = {};
 console.log = function () {

 var args = Array.prototype.slice.call(arguments);

 if (process.send) {
 process.send({msg: args, type: 'CONSOLE_LOG'});
 }
 else {

 args.forEach(function (arg) {
 stream.write(' ' + arg);
 });
 stream.write('\n');
 }

 }*/


//#core
var path = require('path');
var _ = require('underscore');
var readline = require('readline');
//var colors = require('colors/safe');
const chalk = require('chalk');
var async = require('async');
var ee = require('./ee');
var domain = require('domain');

//#local
var once = require('./suman-once');
var makeNetworkLog = require('./make-network-log');
var makeTemp = require('./finalize-output');


function Suman(obj) {
    this.fileName = obj.fileName;
    this.usingLiveSumanServer = obj.usingLiveSumanServer;
    this.networkLog = obj.networkLog;
    this.outputPath = obj.outputPath;
    this.setup = obj.setup;
    this.usingRunner = obj.usingRunner;
    this.config = obj.config;
    this.timestamp = obj.timestamp;
    this.ctx = {};
    this.weAreDebugging = inDebugMode;
    this.describeOnlyIsTriggered = false;
}


Suman.prototype.makeExit = function (messages) {


    /* var exitCode = 0;

     messages.forEach(function (msg) {

     if (msg.testErrors.length > 0) {
     exitCode = 1;
     }
     if (msg.errors.length > 0) {
     exitCode = 2;
     }

     });*/


    /*      //TODO why does this log before tests results?
     console.log('MAX_MEMORY:', m);
     //console.error(message);
     makeTemp.makeComplete({
     timestamp: suman.timestamp,
     config: suman.config
     }, function (errs) {
     if (errs.length > 0) {
     console.log('errs:', errs);
     }
     process.exit(exitCode);
     });
     */

    var self = this;

    async.series([
            function (cb) {
                cb = _.once(cb);
                ee.on('SOCKET_DONE', function () {
                    cb(null);
                });
                if (self.setup.messagesCount < 1) {
                    cb(null);
                }
                setTimeout(function () {
                    cb(new Error('timed out'));
                }, 10000);
            },
            function (cb) {
                if (self.usingRunner) {
                    cb(null);
                }
                else {
                    domain.create().on('error', function (err) {
                        console.error(err.stack);
                    }).run(function () {
                        makeTemp.makeComplete({
                            usingLiveSumanServer: self.usingLiveSumanServer,
                            timestamp: self.timestamp,
                            config: self.config
                        }, function (err) {
                            if (err)
                                process.stdout.write(err.stack);
                            cb(null);
                        });
                    });

                }

            }
        ],
        function complete(err, results) {
            console.log('');
            process.exit();
            console.log('');
        });

};


Suman.prototype.once = once;

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

        if (this.usingLiveSumanServer) {
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            var json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {
            console.error(new Error('cannot log data').stack);
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


    if (process.send) {
        process.send(data);
    }
    else {

        if (this.usingLiveSumanServer) {
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {
            console.error(String(new Error('cannot log data').stack).split('\n')[0]);
        }
    }

};


var successCount = 0;


Suman.prototype.logResult = function (test) {

    var self = this;

    var config = this.config;

    var data = {
        test: test,
        type: 'LOG_RESULT',
        outputPath: self.outputPath
    };


    if (process.send) {
        process.send(data);
    }
    else {

        if (this.usingLiveSumanServer) {
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {
            process.stdout.write(String(new Error('cannot log data').stack).split('\n')[0]);
        }

        if (data.test.error) {
            process.stdout.write('\n\n ' + chalk.red.italic(' \u2718 test fail ') + '  "' + data.test.desc + '"  ' + chalk.yellow('  ' + data.test.error + '\n'));
        }
        else {

            successCount++;

            if (config.output.standard) {
                process.stdout.write(chalk.green(' \u2714 ') + 'Test passed: ' + data.test.desc + '\n');
            }
            else {

                readline.clearLine(process.stdout, 0);
                process.stdout.write('\r' + chalk.green('Pass count: ' + successCount));

            }

        }

    }

};


function makeSuman($module, configPath, cb) {

    var usingRunner = false;
    var liveSumanServer = false;

    if (process.argv.indexOf('--runner') > -1) { //does our flag exist?
        usingRunner = true;
    }
    else {
        process.stdout.write('\n\n');
    }

    if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
        liveSumanServer = true;
    }

    var setup = {
        usingLiveSumanServer: false,
        messagesCount: -1
    };

    var config;
    try {
        config = require(path.resolve(path.normalize(appRootPath + '/' + configPath)));
    }
    catch (err) {
        console.log('could not resolve path to config file:', temp);
        return;
    }

    var timestamp = null;
    var outputPath = null;
    var networkLog = null;

    if (config.server && config.server.outputDir) {

        var outputDir = config.server.outputDir;

        if (usingRunner) {
            timestamp = process.argv[process.argv.indexOf('--ts') + 1];
            if (!timestamp) {
                throw new Error('no timestamp provided by Suman test runner');
            }
        }
        else {
            try {
                timestamp = Date.now();
                networkLog = makeNetworkLog(config, timestamp, setup);
                //fs.mkdirSync(path.resolve(appRootPath + '/' + outputDir + '/' + String(timestamp)));
            }
            catch (err) {
                throw err;
            }
        }

        //TODO: output path name needs to be incremented somehow by test per file, if there is more than 1 test per file
        outputPath = path.resolve(process.env.HOME + '/' + outputDir + '/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');

        try {
            var unlink = fs.unlinkSync(outputPath);
        }
        catch (err) {
            //console.error(err.stack);
        }
    }
    else {
        timestamp = Date.now();
    }

    var suman = new Suman({
        fileName: path.resolve($module.filename),
        outputPath: outputPath,
        setup: setup,
        config: config,
        timestamp: timestamp,
        usingRunner: usingRunner,
        usingLiveSumanServer: setup.usingLiveSumanServer || liveSumanServer,
        networkLog: networkLog
    });

    if (networkLog) {
        networkLog.createNewTestRun(null, function (err, usingLiveSumanServer) {
            suman.usingLiveSumanServer = usingLiveSumanServer;
            cb(err, suman);
        });
    }
    else {
        cb(null, suman);
    }

}

module.exports = makeSuman;