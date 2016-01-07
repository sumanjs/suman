/**
 * Created by amills001c on 11/24/15.
 */

var ee = require('./ee');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var _ = require('underscore');
var appRootPath = require('app-root-path');
var makeTemp = require('./finalize-output');
var ijson = require('idempotent-json');
var readline = require('readline');
var colors = require('colors/safe');

function make(config, timestamp) {

    var outputPath = null;

    process.on('exit', function (msg) {

        if (process.send) {
            process.send(msg);
        }

        console.log('\nsuman runner exiting...with msg:', msg);
        //process.exit(775);
    });


    process.on('error', function (msg) {

        console.log('error...with msg:', msg);
        process.exit(776);
    });


    process.on('uncaughtException', function (msg) {

        console.log('uncaughtException...with msg:', msg.stack);
        process.exit(777);

    });


    process.on('message', function (data) {
        console.log('runner received message:', data);
    });


    var successCount = 0;

    function logTestResult(data) {

        //console.log('in runner, testId:', data.test.testId);
        var json = JSON.stringify(data.test);

        if (data.outputPath) {
            fs.appendFileSync(data.outputPath, json += ',');
        }

        if (data.test.error) {
            console.log('\ntest fail:', data.test.error);
        }
        else {
            successCount++;

            if(config.output.standard){
                console.log(colors.green(' \u2714 Test passed: ' + data.test.desc));
            }
            else{

                readline.clearLine(process.stdout, 0);
                process.stdout.write('\r' + colors.green('Pass count: ' + successCount));

            }

        }
    }

    function logTestData(data){

        var json = JSON.stringify(data.test);

        if (data.outputPath) {
            fs.appendFileSync(data.outputPath, json += ',');
        }

    }


    function makeExit(messages) {

        var exitCode = 0;

        messages.forEach(function (msg) {

            if (msg.testErrors.length > 0) {
                exitCode = 1;
            }
            if (msg.errors.length > 0) {
                exitCode = 2;
            }

        });


        makeTemp.makeComplete({
            timestamp: timestamp,
            config: config
        }, function (errs) {
            if(errs.length > 0){
                console.log('errs:', errs);
            }
            process.exit(exitCode);
        });

    }


    return function findTestsAndRunThem(dir, configPath) {

        try {
            config = require(path.resolve(appRootPath + '/' + configPath));
            dir = path.resolve(dir);
        }
        catch (err) {
            throw err;
        }


        var grepFile;
        var grepSuite;

        if (process.argv.indexOf('--grep-file') > -1) { //does our flag exist?
            grepFile = process.argv[process.argv.indexOf('--grep-file') + 1]; //grab the next item
            if (grepFile && String(grepFile).length > 0) {
                grepFile = new RegExp(grepFile);
            }
            else {
                console.log('bad grep-file command');
            }
        }

        timestamp = String(Date.now());

        if (config.output && config.output.web) {
            try {
                var outputDir = config.output.web.outputDir;
                outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp);
                fs.mkdirSync(outputPath);
            }
            catch (err) {
                console.error(err);
                return;
            }
        }


        var doneCount = 0;
        var MAX_MEMORY = 3001;
        var listening = true;
        var messages = [];
        var files = [];
        var args = process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp);
        var ext = null;

        var stat;
        try {
            stat = fs.statSync(dir);
        }
        catch (err) {
            console.error(err);
            return;
        }

        if (stat.isFile()) {

            if (path.extname(stat) !== '.js') {
                console.log('you wanted to run file with this name:', dir, 'but it is not a .js file');
                return;
            }

            if (grepFile && !(String(file).search(grepFile) > -1)) {
                console.log('you wanted to run file with this name:', dir, 'but it didnt match the regex you passed in:', grepFile);
                return;
            }

            ext = _.extend({}, {
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                },
                detached: false
            });

            var file = path.resolve(dir);
            files.push(file);

        }

        else {

            fs.readdirSync(dir).forEach(function (file) {

                var fileName = String(file);

                file = path.resolve(dir + '/' + file);

                if (fs.statSync(file).isFile() && path.extname(file) === '.js') {

                    if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                        console.log('skipping file with this name:', fileName, 'due to the regex you passed in for --grep-file:', grepFile);
                    }
                    else {
                        files.push(file); //we have a match
                    }
                }

                else {
                    console.log('you wanted to run file with this name:', file, 'but it is not a .js file');
                }

            });

            var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));

            ext = _.extend({}, {
                execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                },
                detached: false
            });

        }

        var forkedCount = 0;

        files.forEach(function (file) {

            try{
                var n = cp.fork(file, args, ext);
                forkedCount++;
                n.on('message', function (msg) {
                    handleMessage(msg);
                });
            }
            catch(err){
                console.error(err.stack);
            }

        });

        console.log(forkedCount + ' processes running ' + forkedCount + ' tests');


        function handleMessage(msg) {

            if (listening) {

                //var data = ijson.parse(msg);

                switch (msg.type) {
                    case undefined:
                        throw new Error('wtf');
                        break;
                    case null:
                        throw new Error('huh?');
                        break;
                    case 'LOG_DATA':
                        logTestData(msg);
                        break;
                    case 'LOG_RESULT':
                        logTestResult(msg);
                        break;
                    case 'fatal':
                        console.log('fatal message:', msg);
                        break;
                    case 'exit':
                        doneCount++;
                        messages.push(msg);
                        if (doneCount >= files.length) {
                            listening = false;
                            makeExit(messages);
                        }
                        break;
                    default:
                        throw new Error('soab');
                }

            }
            else {
                console.log('this shouldnt happen');
                throw new Error('this shouldnt happen');
            }
        }


    }

}

var run = make();

if (process.argv.indexOf('--pth') > -1 && process.argv.indexOf('--cfg') > -1) {
    var pth = process.argv[process.argv.indexOf('--pth') + 1];
    var conf = process.argv[process.argv.indexOf('--cfg') + 1];
    run(pth, conf);
}

module.exports = run;


