/**
 * Created by denman on 12/30/2015.
 */

//////////////////////////////////////////////////////////////

var args = JSON.parse(JSON.stringify(process.argv));
var execArgs = JSON.parse(JSON.stringify(process.execArgv));

////////// debugging ///////////////////////////////////////////////

const isDebug = execArgs.indexOf('--debug') > 0;
if (isDebug) {
    console.log('=> we are debugging with the --debug flag');
}

const inDebugMode = typeof global.v8debug === 'object';
if (inDebugMode) {
    console.log('=> we are debugging with the debug execArg');
}

//////////////////////////////////////////////////////////////////


//#config
const constants = require('../config/suman-constants');

//#core
const fs = require('fs');
const path = require('path');
const domain = require('domain');

//#npm
const _ = require('lodash');
const readline = require('readline');
const colors = require('colors/safe');
const chalk = require('chalk');
const async = require('async');
const parseFunction = require('parse-function');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;

//#project
const sumanUtils = require('./utils');
const makeNetworkLog = require('./make-network-log');
const finalizeOutput = require('./finalize-output')();
const findSumanServer = require('./find-suman-server');
const ascii = require('./ascii');

///////////////////////////////////////////////////////////////////////////////////////

function Suman(obj) {
    this.fileName = obj.fileName;
    this.allFiles = obj.allFiles;
    this.server = obj.server;
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
    this.iocConfiguration = null;
    this.deps = null;
}


Suman.prototype.configure = function (obj) {
    this.iocConfiguration = obj;
};


Suman.prototype.acquire = function (cb) {

    var obj = {};

    this.deps.forEach(dep => {

        //TODO, we should validate the suman.ioc.js file independently of this check, later on

        //Check to make sure dep name is not undefined?

        if (_.includes(constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in this.iocConfiguration) {
            console.log('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved internal Suman dependency injection value.');
            throw new Error('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved internal Suman dependency injection value.');
        }

        else if (_.includes(constants.CORE_MODULE_LIST, dep && String(dep)) && String(dep) in this.iocConfiguration) {
            console.log('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved Node.js core module dependency injection value.');
            throw new Error('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved Node.js core module dependency injection value.');
        }
        else if (_.includes(constants.CORE_MODULE_LIST, dep && String(dep)) || _.includes(constants.SUMAN_HARD_LIST, String(dep))) {
            //skip any dependencies
            obj[dep] = null;
        }
        else {

            obj[dep] = this.iocConfiguration[dep]; //copy subset of iocConfig to test suite

            if (!obj[dep] && !_.includes(constants.CORE_MODULE_LIST, String(dep)) && !_.includes(constants.SUMAN_HARD_LIST, String(dep))) {

                var deps = Object.keys(this.iocConfiguration || {}).map(function (item) {
                    return ' "' + item + '" ';
                });


                throw new Error('The following desired dependency is not in your suman.ioc.js file: "' + dep + '"\n' +
                    ' => ...your available dependencies are: [' + deps + ']');
            }
        }

    });


    var temp = [];

    Object.keys(obj).forEach(function (key) {
        temp.push(obj[key]);
    });

    temp = temp.map(function (fn) {

        return new Promise(function (resolve, reject) {

            if (!fn) {
                process.nextTick(function () {
                    resolve(null);
                });
            }
            else if (fn.length > 0) {
                var args = parseFunction(fn).args;
                var str = fn.toString();
                var matches = str.match(new RegExp(args[0], 'g')) || [];
                if (matches.length < 2) { //there should be at least two instances of the 'cb' string in the function, one in the parameters array, the other in the fn body.
                    throw new Error('Callback in your function was not present --> ' + str);
                }
                fn.apply(global, [function (err, val) { //TODO what to use for ctx of this .apply call?
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(val);
                    }
                }]);
            }
            else {
                Promise.resolve(fn.apply(global, [])).then(function (val) {
                    resolve(val);
                }).catch(function (err) {
                    reject(err);
                });
            }

        });

    });

    Promise.all(temp).then(function (deps) {

        Object.keys(obj).forEach(function (key, index) {
            obj[key] = deps[index];
        });

        cb(null, obj);

    }).catch(function (err) {
        cb(err, []);
    });

};


Suman.prototype.makeExit = function (messages) { //TODO this should just be in the on('exit) handler!!

    var self = this;

    async.series([

            function (cb) {
                if (self.usingRunner) {
                    cb(null);
                }
                else {
                    domain.create().on('error', function (err) {
                        console.error(err.stack);
                    }).run(function () {
                        finalizeOutput.makeComplete({
                            usingLiveSumanServer: self.usingLiveSumanServer,
                            timestamp: self.timestamp,
                            config: self.config,
                            server: self.server,
                            allFiles: self.allFiles
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
            process.exit();  //TODO does this produce the proper exit code?
        });

};


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
        //process.send(data);
    }
    else {

        var json;
        if (this.usingLiveSumanServer) {
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {

            console.error(new Error('Suman cannot log your test result data:\n').stack);
            //try {
            //    var pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results')
            //    json = JSON.stringify(data);
            //    fs.appendFileSync(pth, json += ',');
            //}
            //catch (err) {
            //    console.error('Suman cannot log your test result data:\n' + err.stack);
            //}

        }
    }
};


Suman.prototype.logFatalSuite = function logFatalSuite(test) {


    const data = {
          'FATAL': {
              testId: test.testId
          }

    };



    if (process.send) {
        //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted? or can we avoid this if only this process writes to the file?
        //process.send(data);
    }
    else {

        if (this.usingLiveSumanServer) {
            //TODO: we may want to log locally first just to make sure we have the data somewhere
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.writeFileSync(this.outputPath, '');
        }
        else {
            console.error(new Error('Suman cannot log your test result data:\n').stack);
            //try {
            //    var pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results');
            //    json = JSON.stringify(data);
            //    fs.appendFileSync(pth, json += ',');
            //}
            //catch (err) {
            //    console.error('Suman cannot log your test result data:\n' + err.stack);
            //}

        }
    }
};


Suman.prototype.logData = function logData(test) {

    test.error = test.error || null;

    const result = {
        testId: test.testId,
        desc: test.desc,
        children: test.getChildren(),
        tests: _.flattenDeep([test.getTests(), test.getParallelTests()])
    };

    var data = {
        test: result,
        type: 'LOG_DATA',
        outputPath: this.outputPath
    };

    if (process.send) {
        //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted? or can we avoid this if only this process writes to the file?
        //process.send(data);
    }
    else {

        if (this.usingLiveSumanServer) {
            //TODO: we may want to log locally first just to make sure we have the data somewhere
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {
            console.error(new Error('Suman cannot log your test result data:\n').stack);
            //try {
            //    var pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results');
            //    json = JSON.stringify(data);
            //    fs.appendFileSync(pth, json += ',');
            //}
            //catch (err) {
            //    console.error('Suman cannot log your test result data:\n' + err.stack);
            //}

        }
    }
};


var successCount = 0;


Suman.prototype.logResult = function (test) {  //TODO: refactor to logTestResult

    var self = this;

    var config = this.config;

    var data = {
        test: test,
        type: 'LOG_RESULT',
        outputPath: self.outputPath
    };


    if (process.send) {
        var str = JSON.stringify(data);
        str = str.replace(/(\r\n|\n|\r)/gm, ""); ///This javascript code removes all 3 types of line breaks
        process.send(JSON.parse(str));
    }
    else {

        if (this.usingLiveSumanServer) {
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            // var json = JSON.stringify(data.test);
            // fs.appendFileSync(this.outputPath, json += ',');
        }
        else {
            //try {
            //    var pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results/' + this.timestamp);
            //    json = JSON.stringify(data);
            //    fs.appendFileSync(pth, json += ',');
            //}
            //catch (err) {
            //    console.error('Suman cannot log your test result data:\n' + err.stack);
            //}
            console.error(new Error('Suman cannot log your test result data:\n').stack);
        }

        if (data.test.errorDisplay) {
            process.stdout.write('\n\n\t' + colors.black.bold.bgYellow(' \u2718 test fail ') + '  "' + data.test.desc + '"\n' + chalk.yellow(data.test.errorDisplay) + '\n');
        }
        else {

            successCount++;

            if (config.output.standard) {
                process.stdout.write('\t' + chalk.green(' \u2714 ') + 'Test passed: ' + data.test.desc + '\n');
            }
            else {

                readline.clearLine(process.stdout, 0);
                process.stdout.write('\r' + chalk.green('Pass count: ' + successCount));

            }
        }
    }
};


function makeSuman($module, shouldCreateResultsDir, config, cb) {


    var cwd = process.cwd();

    var usingRunner = false;
    var liveSumanServer = false;

    if (process.argv.indexOf('--runner') > -1) { //does our flag exist?
        usingRunner = true;
    }

    if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
        liveSumanServer = true;
    }

    if (usingRunner && typeof process.send !== 'function') {
        throw new Error('=> Suman fatal error => Inconsistent state => process.send is defined but usingRunner is false.');
    }

    if (typeof process.send === 'function' && !usingRunner) {
        var err = new Error('=> Suman fatal error => Inconsistent state => process.send is defined but usingRunner is false.');
        process.send({type: 'FATAL', msg: err.stack});
        throw err;
    }

    var setup = {
        usingLiveSumanServer: false,
        messagesCount: -1
    };


    var timestamp = Date.now();
    var outputPath = null;
    var networkLog = null;


    //TODO: need to properly toggle the value for 'shouldCreateResultsDir'
    sumanUtils.makeResultsDir(shouldCreateResultsDir && !usingRunner, config, function (err) {

        if (err) {
            console.error(err.stack);
        }

        const server = findSumanServer(config, null);

        if (server && server.outputDir) {

            var outputDir = server.outputDir;

            if (usingRunner) {
                timestamp = process.argv[process.argv.indexOf('--ts') + 1];
                if (!timestamp) {
                    throw new Error('no timestamp provided by Suman test runner');
                }
            }
            else {
                try {
                    networkLog = makeNetworkLog(config, timestamp, setup);
                }
                catch (err) {
                    throw err;
                }
            }

            //TODO: output path name needs to be incremented somehow by test per file, if there is more than 1 test per file
            outputPath = path.normalize(outputDir + '/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');

            try {
                fs.unlinkSync(outputPath); //TODO can we remove this unlink call? I guess it's just in case the same timestamp exists..
            }
            catch (err) {
                //console.error(err.stack);
            }
        }
        else {
            outputPath = path.normalize(sumanUtils.getHomeDir() + '/suman_results/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');
        }

        var allFiles = [$module.filename];

        //TODO: if using runner, the runner should determine if the server is live

        var suman = new Suman({
            fileName: path.resolve($module.filename),
            outputPath: outputPath,
            setup: setup,
            config: config,
            timestamp: timestamp,
            usingRunner: usingRunner,
            usingLiveSumanServer: setup.usingLiveSumanServer || liveSumanServer,
            networkLog: networkLog,
            server: server,
            allFiles: allFiles
        });


        if (networkLog) {
            networkLog.createNewTestRun(config, server, function (err, usingLiveSumanServer, outputPath) {

                if (err) {
                    console.error(err.stack);
                }

                if (usingLiveSumanServer) {
                    suman.usingLiveSumanServer = usingLiveSumanServer;
                }
                else if (outputPath) {
                    suman.outputPath = path.resolve(outputPath + '/' + path.basename($module.filename, '.js') + '.txt');
                }

                cb(null, suman);

            });
        }
        else {
            var dir = sumanUtils.getHomeDir();
            var $outputPath = path.resolve(dir + '/suman_results/' + timestamp);
            fs.mkdir($outputPath, function (err) {
                cb(err, suman);
            });
        }
    });
}


module.exports = makeSuman;