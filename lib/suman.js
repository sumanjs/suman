/**
 * Created by denman on 12/30/2015.
 */

//////////////////////////////////////////////////////////////

var args = JSON.parse(JSON.stringify(process.argv));
var execArgs = JSON.parse(JSON.stringify(process.execArgv));

////////// debugging ///////////////////////////////////////////////

require('./debugging-helper/we-are-debugging');

//////////////////////////////////////////////////////////////////


//#config
const constants = require('../config/suman-constants');

//#core
const fs = require('fs');
const path = require('path');
const domain = require('domain');
const EE = require('events');

//#npm
// const tap = require('tap');
const _ = require('lodash');
const readline = require('readline');
const colors = require('colors/safe');
const chalk = require('chalk');
const AsciiTable = require('ascii-table');
const async = require('async');
const fnArgs = require('function-arguments');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;

//#project
const sumanUtils = require('./utils');
const makeNetworkLog = require('./make-network-log');
const finalizeOutput = require('./finalize-output')();
const findSumanServer = require('./find-suman-server');
const ascii = require('./ascii');
const dual = require('./dual/shared');

///////////////////////////////////////////////////////////////////////////////////////

function Suman(obj) {
    this.allDescribeBlocks = [];
    this.interface = obj.interface;
    this.fileName = obj.fileName;
    this.allFiles = obj.allFiles;
    this.server = obj.server;
    this.usingLiveSumanServer = obj.usingLiveSumanServer;
    this.networkLog = obj.networkLog;
    this.outputPath = obj.outputPath;
    this.setup = obj.setup;
    this.timestamp = obj.timestamp;
    this.describeOnlyIsTriggered = false;
    this.iocConfiguration = null;
    this.deps = null;
}


Suman.prototype.configure = function (obj) {
    this.iocConfiguration = obj;
};


Suman.prototype.acquire = function (data, cb) {

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


    const temp = Object.keys(obj).map(function (key) {

        const fn = obj[key];
        const $data = data[key] || null;


        return new Promise(function (resolve, reject) {

            if (!fn) {
                process.nextTick(resolve);
            }
            else if (typeof fn !== 'function') {
                process.nextTick(function () {
                    const err = new Error('Value in IOC object was not a function for corresponding key => ' + key + 'value => "' + JSON.stringify(fn) + '"');
                    console.error(err.stack);
                    reject(err);
                });
            }
            else if (fn.length > 1) {
                var args = fnArgs(fn);
                var str = fn.toString();
                var matches = str.match(new RegExp(args[1], 'g')) || [];
                if (matches.length < 2) { //there should be at least two instances of the 'cb' string in the function, one in the parameters array, the other in the fn body.
                    throw new Error('Callback in your function was not present => ' + str);
                }
                fn.apply(global, [$data, function (err, val) { //TODO what to use for ctx of this .apply call?
                    process.nextTick(function () {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(val);
                        }
                    });
                }]);
            }
            else {
                Promise.resolve(fn.apply(global, [$data])).then(function (val) {
                    resolve(val);
                }, function (err) {
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

    }, function (err) {
        cb(err, []);
    });

};


Suman.prototype.makeExit = function (exitCode) { //TODO this should just be in the on('exit) handler!!

    const self = this;

    async.series([

            function (cb) {
                if (global.usingRunner) {
                    process.nextTick(cb);
                }
                else {
                    const d = domain.create();

                    d.once('error', function (err) {
                        console.error(err.stack);
                    });

                    d.run(function () {
                        process.nextTick(function () {
                            finalizeOutput.makeComplete({
                                usingLiveSumanServer: self.usingLiveSumanServer,
                                timestamp: self.timestamp,
                                config: self.config,
                                server: self.server,
                                allFiles: self.allFiles
                            }, function (err) {
                                if (err) {
                                    process.stdout.write(err.stack);
                                }
                                cb(null);
                            });
                        });
                    });
                }
            }
        ],
        function complete(err, results) {
            process.exit(exitCode);  //TODO does this produce the proper exit code?
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
            json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
            // this.networkLog.sendTestData(data);
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


    if (global.usingRunner) {
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

Suman.prototype.logFinished = function ($exitCode) {

    //note: if $exitCode is defined, it should be > 0

    const desc = this.allDescribeBlocks[0] ? this.allDescribeBlocks[0].desc : 'unknown suite';
    const suiteName = desc.length > 30 ? desc.substring(0, 28) + '...' : desc;
    const delta = this.dateSuiteFinished - this.dateSuiteStarted;

    const skippedSuiteNames = [];
    var totalNumberOfSuites = '-';
    var skipped = '-';
    var skippedTests = '-';
    var stubbedTests = '-';
    var testsPassed = '-';
    var testsFailed = '-';
    var totalTests = '-';

    if (!$exitCode) {

        totalNumberOfSuites = this.allDescribeBlocks.length;

        skipped = this.allDescribeBlocks.filter(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                skippedSuiteNames.push(block.desc);
                return true;
            }
        }).length;


        skippedTests = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return block.getParallelTests().concat(block.getTests()).length;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return test.skipped || test.skippedDueToOnly;
                }).length;
            }

        }).reduce(function (prev, current) {
            return prev + current;
        });


        stubbedTests = this.allDescribeBlocks.map(function (block) {

            return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                return test.stubbed;
            }).length;

        }).reduce(function (prev, current) {
            return prev + current;
        });


        testsPassed = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return 0;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return !test.skipped && !test.skippedDueToOnly && test.error == null && test.complete === true;
                }).length;
            }

        }).reduce(function (prev, current) {
            return prev + current;
        });


        testsFailed = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return 0;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return !test.skipped && !test.skippedDueToOnly && test.error != null;
                }).length;
            }
        }).reduce(function (prev, current) {
            return prev + current;
        });


        totalTests = this.allDescribeBlocks.map(function (block) {

            return block.getParallelTests().concat(block.getTests()).length;

        }).reduce(function (prev, current) {
            return prev + current;
        });

        var exitCode = 999; //in case of future fall through

        if (testsFailed > 0) {
            exitCode = constants.EXIT_CODES.TEST_CASE_FAIL;
        }
        else {
            exitCode = constants.EXIT_CODES.SUCCESSFUL_RUN;
        }

    }


    if (global.usingRunner) {

        const data = {
            'SUITES => ': '',
            'Root Suite Name': suiteName,
            '*total ': totalNumberOfSuites,
            '*skipped ': skipped,
            'TEST CASES =>': '',
            '+total': totalTests || 0,
            '+skipped': skippedTests || 0,
            '+stubbed': stubbedTests || 0,
            '+passed': testsPassed || 0,
            '+failed': testsFailed || 0,
            'OVERALL =>': '',
            'millis': delta,
            'exit-code': $exitCode || exitCode
        };

        process.send({
            type: constants.runner_message_type.TABLE_DATA,
            data: data
        });

    }
    else {

        //TODO: add pass rate as percentage

        const table = new AsciiTable('Suman Test Results');
        table.setHeading('Metric', '    Value   ', '    Notes   ');
        table.addRow('Suite name', suiteName, '');
        table.addRow('Total num of suites', totalNumberOfSuites, '');  //TODO: this is hardcoded, fix
        table.addRow('Suites skipped', skipped, skippedSuiteNames.length > 0 ? JSON.stringify(skippedSuiteNames) : '');
        table.addRow('Tests skipped', skippedTests);
        table.addRow('Tests stubbed', stubbedTests);
        table.addRow('Tests passed', testsPassed);
        table.addRow('Tests failed', testsFailed);
        table.addRow('Tests total', totalTests);
        table.addRow('Total time millis (delta)', delta);
        table.addRow('Total time minutes (delta)', Number(delta / (1000 * 60)).toFixed(4));
        // table.setJustify();

        //TODO: if root suite is skipped, it is noteworthy

        table.setAlign(0, AsciiTable.LEFT);
        table.setAlign(1, AsciiTable.RIGHT);
        table.setAlign(2, AsciiTable.RIGHT);


        console.log('\n\n');
        var str = table.toString();
        str = '\t' + str;
        console.log(str.replace(/\n/g, '\n\t'));
        console.log('\n');
    }

    return exitCode;

};


Suman.prototype.logData = function logData(test) {

    test.error = test.error || null;

    const result = {
        testId: test.testId,
        desc: test.desc,
        opts: test.opts,
        children: test.getChildren(),
        tests: _.flattenDeep([test.getTests(), test.getParallelTests()])
    };

    if (typeof process.send === 'function') {

        var data = {
            test: result,
            type: 'LOG_DATA',
            outputPath: this.outputPath
        };

        //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted?
        //TODO: or can we avoid this if only this process writes to the file?
        //TODO: note, only one process writes to this file since it is a 1:1 process per file
        // process.send(data);
        var json = JSON.stringify(data.test);
        fs.appendFileSync(this.outputPath, json += ','); //formely fs.appendFileSync
    }
    else {

        if (this.usingLiveSumanServer) {
            //TODO: we may want to log locally first just to make sure we have the data somewhere
            // this.networkLog.sendTestData(data);
            var json = JSON.stringify(result);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else if (this.outputPath && global.viaSuman === true) {

            var json = JSON.stringify(result);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {

            //console.error(new Error('Suman cannot log your test result data:\n').stack);
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


Suman.prototype.logResult = function (test) {  //TODO: refactor to logTestResult

    //TODO: this function becomes just a way to log to command line, not to text DB

    const config = global.sumanConfig;

    if (global.usingRunner) {

        const _test = {
            cb: test.cb,
            error: test.error ? (test.error._message || test.error.stack || test.error) : null,
            errorDisplay: test.errorDisplay,
            mode: test.mode,
            plan: test.plan,
            skip: test.skip,
            stubbed: test.stubbed,
            testId: test.testId,
            only: test.only,
            timedOut: test.timedOut,
            desc: test.desc,
            complete: test.complete,
            dateStarted: test.dateStarted,
            dateComplete: test.dateComplete
        };

        var data = {
            test: _test,
            type: 'LOG_RESULT',
            outputPath: this.outputPath
        };

        var str = JSON.stringify(data);
        str = str.replace(/(\r\n|\n|\r)/gm, ""); ///This javascript code removes all 3 types of line breaks
        process.send(JSON.parse(str));
    }
    else {

        if (this.usingLiveSumanServer) {
            // this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            // var json = JSON.stringify(test);
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

        dual.broadcastOrWrite('test-case-end', test);

        if (test.errorDisplay) {
            dual.broadcastOrWrite('test-case-fail', test, '\n\n\t' +
                colors.blue.bold.bgYellow(' \u2718  => test fail ') + '  "' +
                test.desc + '"\n' + chalk.yellow(test.errorDisplay) + '\n\n');
        }
        else {

            if (test.skipped) {
                dual.broadcastOrWrite('test-case-skipped', test, '\t' +
                    chalk.yellow(' \u21AA ') + ' (skipped) \'' + test.desc + '\'\n');
            }
            else if (test.stubbed) {
                dual.broadcastOrWrite('test-case-stubbed', test, '\t' +
                    chalk.yellow(' \u2026 ') + ' (stubbed) \'' + test.desc + '\'\n');
            }
            else {

                dual.broadcastOrWrite('test-case-pass', test, '\t' +
                    chalk.green(' \u2714 ') + ' \'' + test.desc + '\'\n');

                //TODO: allow printing of just one line of results, until a failure
                //readline.clearLine(process.stdout, 0);
                //process.stdout.write('\r' + chalk.green('Pass count: ' + successCount));

            }

        }
    }
};


function makeSuman($module, _interface, shouldCreateResultsDir, config, cb) {

    const cwd = process.cwd();
    var liveSumanServer = false;


    if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
        liveSumanServer = true;
    }

    if (global.usingRunner && typeof process.send !== 'function') {
        console.error(new Error('=> Suman fatal error => Inconsistent state => process.send is defined but usingRunner is false.').stack);
        return process.exit(constants.EXIT_CODES.INVALID_RUNNER_CHILD_PROCESS_STATE);
        // we return just in case, you know, it is JS
    }

    /*

     note: this was removed because when debugging with node-inspector process.send is defined

     if (typeof process.send === 'function' && !usingRunner) {
     const err = new Error('=> Suman fatal error => Inconsistent state => process.send is defined but usingRunner is false.');
     process.send({
     type: constants.runner_message_type.FATAL,
     data: {
     msg: err.stack,
     error: err.stack
     }
     });
     return process.nextTick(function () {
     process.exit(constants.EXIT_CODES.UNKNOWN_RUNNER_CHILD_PROCESS_STATE);
     });
     }

     */

    var timestamp;
    var outputPath = null;
    var networkLog = null;

    if (global.usingRunner) {  //using runner, obviously, so runner provides timestamp value
        timestamp = process.argv[process.argv.indexOf('--ts') + 1];
        if (!timestamp) {
            console.error(new Error('no timestamp provided by Suman test runner').stack);
            process.exit(constants.EXIT_CODES.NO_TIMESTAMP_AVAILABLE_IN_TEST);
        }
    }
    else if (global.timestamp) {  //using suman executable, but not runner
        timestamp = global.timestamp;
    }
    else {  //test file executed with plain node executable
        timestamp = Date.now();
    }


    //TODO: need to properly toggle the value for 'shouldCreateResultsDir'
    sumanUtils.makeResultsDir(shouldCreateResultsDir && !global.usingRunner, function (err) {

        if (err) {
            console.error(err.stack);
            process.exit(constants.EXIT_CODES.ERROR_CREATING_RESULTS_DIR);
        }
        else {

            const server = findSumanServer(config, null);

            //TODO: output path name needs to be incremented somehow by test per file, if there is more than 1 test per file
            outputPath = path.normalize(sumanUtils.getHomeDir() + '/suman_results/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');

            try {
                fs.unlinkSync(outputPath); //TODO can we remove this unlink call? I guess it's just in case the same timestamp exists..
            }
            catch (err) {
                //console.error(err.stack);
            }

            //TODO: if using runner, the runner should determine if the server is live

            cb(null, new Suman({
                fileName: path.resolve($module.filename),
                outputPath: outputPath,
                config: config,
                timestamp: timestamp,
                usingLiveSumanServer: liveSumanServer,
                networkLog: networkLog,
                server: server,
                allFiles: [$module.filename],
                interface: _interface
            }));

        }

    });
}


module.exports = makeSuman;