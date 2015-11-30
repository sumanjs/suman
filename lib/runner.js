/**
 * Created by amills001c on 11/24/15.
 */


var fs = require('fs');
var cp = require('child_process');
var path = require('path');


function makeExit(messages) {

    var err = false;

    messages.forEach(function (msg) {
        if (msg.errors.length > 0) {
            err = true;
        }
        console.log(msg);

    });

    if (err) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }

}


function findTestsAndRunThem(dir, grep) {

    var listening = true;
    var grepFile;
    var grepSuite;

    if (process.argv.indexOf("--grep-file") !== -1) { //does our flag exist?
        grepFile = process.argv[process.argv.indexOf("--grep-file") + 1]; //grab the next item
        if (String(grepFile).length > 0) {
            grepFile = new RegExp(grepFile);
        }
        else {
            console.log('bad grep-file command');
        }
    }


    var testSuitesToRun = [];

    dir = path.resolve(dir);

    if (fs.statSync(dir).isFile()) {

        if (!grepFile || (grepFile && String(file).search(grepFile) > -1)) {
            var n = cp.fork(dir, process.argv.slice(2), {
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                }
            });

            n.on('message', function (msg) {
                if (listening) {
                    listening = false;
                    makeExit([msg]);
                }
                else {
                    throw new Error('this shouldnt happen');
                }

            });
        }
        else {
            console.log('you wanted to run file with this name:', dir, 'but it didnt match the regex you passed in:', grepFile);
        }

    }
    else {

        var messages = [];
        var files = [];

        fs.readdirSync(dir).forEach(function (file) {

            var fileName = String(file);

            file = path.resolve(dir + '/' + file);

            if (fs.statSync(file).isFile() && path.extname(file) === '.js') {

                if (!grepFile || (grepFile && String(file).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                    files.push(file);
                }
                else {
                    console.log('skipping file with this name:', fileName, 'due to the regex you passed in for --grep-file:', grepFile);
                }
            }

        });

        files.forEach(function (file) {
            var n = cp.fork(file, process.argv.slice(2), {
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                }
            });

            n.on('message', function (msg) {
                if (listening) {
                    messages.push(msg);
                    if (messages.length >= files.length) {
                        listening = false;
                        makeExit(messages);
                    }
                }
                else {
                    throw new Error('this shouldnt happen');
                }

            });
        })

    }

}


module.exports = findTestsAndRunThem;