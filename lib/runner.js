/**
 * Created by amills001c on 11/24/15.
 */

var ee = require('./ee');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var _ = require('underscore');
var appRootPath = require('app-root-path');
var makeTemp = require('./make-temp');
var ijson = require('idempotent-json');

var timestamp = null;
var config = null;


process.on('exit', function (msg) {

    if (process.send) {
        process.send(msg);
    }

    console.log('exiting...with msg:', msg);
    process.exit(775);
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


function logTestResult(data) {

    //console.log('in runner, testId:', data.test.testId);
    var json = JSON.stringify(data.test);
    fs.appendFileSync(data.outputPath, json += ',');

    console.log('test result:',data.test.error);

}


function makeExit(messages) {

    var err = false;

    messages.forEach(function (msg) {
        if (msg.errors.length > 0) {
            err = true;
        }
        console.log('makeExit message:',msg);
    });


    makeTemp.makeComplete({
        timestamp: timestamp,
        config: config
    }, function (err) {
        process.exit(0);
    });

    /*   ee.emit('suman-complete', {
     timestamp: timestamp,
     config: config
     });


     ee.on('suman-end', function(){

     if (err) {
     console.log('runner exiting with code 1');
     process.exit(1);
     }
     else {
     console.log('runner exiting with code 0');
     process.exit(0);
     }
     });*/
}


function findTestsAndRunThem(dir, configPath) {

    try {
        config = require(path.resolve(appRootPath + '/' + configPath));
        dir = path.resolve(dir);
    }
    catch (err) {
        throw err;
    }

    var outputDir = config.outputDir;

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
    fs.mkdirSync(path.resolve(appRootPath + '/' + outputDir + '/' + timestamp));


    /*

     if (fs.statSync(dir).isFile()) {

     var listening = true;

     if (grepFile && !(String(file).search(grepFile) > -1)) {
     console.log('you wanted to run file with this name:', dir, 'but it didnt match the regex you passed in:', grepFile);
     }
     else {
     //var n = cp.fork(dir, process.argv.slice(2), {
     //    env: {
     //        'NODE_ENV': process.env.NODE_ENV
     //    }
     //});

     //var n = cp.fork(dir, process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp), Object.create(process.env));

     var n = cp.fork(dir, process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp), {
     env: {
     'NODE_ENV': process.env.NODE_ENV
     },
     detached: false
     });

     n.on('message', function (msg) {
     if (listening) {
     listening = false;
     makeExit([msg]);
     }
     else {
     console.log('this shouldnt happen');
     throw new Error('this shouldnt happen');
     }

     });
     }
     }

     else {

     var listening = true;
     var messages = [];
     var files = [];

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

     });

     var length = files.length;
     var MAX_MEMORY = 3001;

     var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (length + 1)));

     files.forEach(function (file) {

     //var n = cp.fork(file, process.argv.slice(2), {
     //    env: {
     //        'NODE_ENV': process.env.NODE_ENV
     //    }
     //});

     var args = process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp);

     //var args = ['--harmony', '--max_old_space_size='.concat(MEMORY_PER_PROCESS), ' --max_new_space_size='.concat(MEMORY_PER_PROCESS), ' --runner'];

     //var n = cp.fork(file, args, Object.create(process.env));

     //var n = cp.fork(file, args, _.extend({}, {
     //    execArgv: ['--harmony', '--max_old_space_size='.concat(MEMORY_PER_PROCESS), ' --max_new_space_size='.concat(MEMORY_PER_PROCESS)]
     //}, process.env));

     var ext = _.extend({}, {
     execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],
     env: {
     'NODE_ENV': process.env.NODE_ENV
     },
     detached: false
     });


     var n = cp.fork(file, args, ext);

     n.on('message', function (msg) {
     if (listening) {
     messages.push(msg);
     if (messages.length >= files.length) {
     listening = false;
     makeExit(messages);
     }
     }
     else {
     console.log('this shouldnt happen');
     throw new Error('this shouldnt happen');
     }

     });
     });

     }*/


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


    files.forEach(function (file) {

        var n = cp.fork(file, args, ext);
        n.on('message', function (msg) {
            handleMessage(msg);
        });
    });


    function handleMessage(data) {

        if (listening) {

            //var data = ijson.parse(msg);

            switch (data.type) {
                case undefined:
                    throw new Error('wtf');
                    break;
                case null:
                    throw new Error('huh?');
                    break;
                case 'log':
                    logTestResult(data);
                    break;
                //case 'done':
                //    doneCount++;
                //    if (doneCount >= files.length) {
                //        listening = false;
                //        makeExit(messages);
                //    }
                //    break;
                case 'fatal':
                    console.log('fatal message:', data);
                    break;
                case 'exit':
                    doneCount++;
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

if (process.argv.indexOf('--pth') > -1 && process.argv.indexOf('--cfg') > -1) {
    var pth = process.argv[process.argv.indexOf('--pth') + 1];
    var conf = process.argv[process.argv.indexOf('--cfg') + 1];
    findTestsAndRunThem(pth, conf);
}
else {
    module.exports = findTestsAndRunThem;
}

