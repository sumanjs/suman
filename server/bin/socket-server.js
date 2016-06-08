/*

 README: the Suman server allows socketio client connections - when a watch message is sent to the server,
 we will begin watching the files requested to be watched - upon a file change (the developer saves changes to a test file)
 we most likely will transpile/run that file, by sending a message to the Poolio process pool with the filepath
 of the test file that changed. When the file changes, we first truncate the test-stdout.log file, then all other writing
 operations to that file are append operations.

 */


//core
const fs = require('fs');

//npm
const socketio = require('socket.io');
const chokidar = require('chokidar');
const _ = require('lodash');
const cp = require('child_process');
const path = require('path');
const Pool = require('poolio');

//project
const constants = require('../../config/suman-constants');
const runTranspile = require('../../lib/transpile/run-transpile');

//////////////////////////////////////////////////


const watcherOutputLogPath = path.resolve(global.sumanHelperDirRoot + '/logs/watcher-output.log');

function getStream() {
    return fs.createWriteStream(watcherOutputLogPath, {
        flags: 'a',
        flag: 'a'
    });
}

//note: if stdout and stderr share the same writable stream maybe their output will be in the right order?
const pool = new Pool({
    size: 3,
    addWorkerOnExit: true,
    silent: true,
    filePath: 'lib/poolio-worker.js',
    stdout: getStream,
    stderr: getStream,
    env: _.extend(process.env, {
        SUMAN_WATCH: 'yes'
    })
});

///////////////////////////////////////////////////

const opts = {
    ignored: ['**/*.txt', '**/*.log'],
    ignoreInitial: true
    // ignored: /(\.txt|\.log)$/
};

var sumanExec;

try {
    sumanExec = require.resolve('suman');
    const temp = String(sumanExec).split(path.sep);
    temp.pop();
    temp.pop();
    temp.push('index.js');
    sumanExec = 'node ' + path.resolve(temp.join(path.sep));
}
catch (err) {
    console.log('\n\n\t => Warning Suman main executable file could not be located, attempting "$ suman"...');
    sumanExec = 'suman ';
}

function initiateTranspileAction(p, opts, executeTest) {

    const transpileThese = _.flatten([p]).filter(function (p) {
        return pathHash[p].transpile;
    });

    if (transpileThese.length < 1) {
        return;
    }

    fs.writeFileSync(watcherOutputLogPath,
        '\n\n => test will first be transpiled.', {
            flags: 'a',
            flag: 'a'
        });

    runTranspile(transpileThese, (opts || {}), function (err, results) {
        if (err) {
            console.log('transpile error:', err);

            fs.writeFileSync(watcherOutputLogPath,
                '\n\n => test transpilation error => \n' + err.stack, {
                    flags: 'a',
                    flag: 'a'
                });
        }
        else {
            console.log('transpile results:', results);

            fs.writeFileSync(watcherOutputLogPath,
                '\n => test transpiled successfully.', {
                    flags: 'a',
                    flag: 'a'
                });

            //TODO: check that changed file is a .js file etc
            if (executeTest) {
                runTestWithSuman(results);
            }
        }
    });
}

function runTestWithSuman(tests) {

    const cmd = sumanExec + ' ' + tests.join(' ');

    console.log('\n\n => Test will now be run with command:\n', cmd);

    fs.writeFileSync(watcherOutputLogPath,
        '\n => test will now execute.\n\n', {
            flags: 'a',
            flag: 'a'
        });

    const promises = tests.map(function (t) {
        return pool.any({testPath: t});
    });

    Promise.all(promises).then(function (val) {
        console.log('Pool response:', val);
    }, function (e) {
        console.error(e.stack || e);
    });

    // cp.exec(cmd, function (err, stdout, stderr) {
    // 	if (true || err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
    // 		console.error(err.stack || err || stdout || stderr);
    // 	}
    // });

}

const pathHash = {};
var watcher;

module.exports = function (server) {

    const io = socketio(server);

    io.sockets.on('connection', function (socket) {

        console.log('\n', 'Client connected.', '\n');

        socket.emit('message', 'listening');

        socket.on('disconnect', function () {
            console.log('\nClient disconnected.\n');
        });

        //TODO: need to add hash, that shows whether files need to be transpiled or not

        socket.on('watch', function ($msg) {

            const msg = JSON.parse($msg);

            const paths = msg.paths;
            const transpile = msg.transpile || false;

            console.log(' => Suman server event => socketio watch event has been received by server:\n', msg);

            if (watcher) {
                console.log('\n\n => Watched paths before:', watcher.getWatched());
                watcher.add(paths);
                console.log('\n\n => Watched paths after:', watcher.getWatched());
            }
            else {
                console.log(' => chokidar watcher initialized.');
                watcher = chokidar.watch(paths, opts);

                var log = console.log.bind(console);

                watcher.on('add', p => {
                    log(`File ${p} has been added`);
                    initiateTranspileAction(p);
                });

                watcher.on('change', p => {

                    log(`File ${p} has been changed`);

                    p = String(p).replace('___jb_tmp___', '').replace('___jb_old___', ''); //for Webstorm support

                    console.log(pathHash[String(p)]);

                    if (!pathHash[p]) {
                        console.log(' => Suman server warning => the following file path was not already stored in the pathHash:', p);
                    }

                    fs.writeFileSync(watcherOutputLogPath,  //'w' flag truncates the file, the only time the file is truncated
                        '\n\n => Suman watcher => test file changed:\n' + p, {
                            flags: 'w',
                            flag: 'w'
                        });

                    if (pathHash[p] && pathHash[p].transpile) {
                        console.log('transpiling!');
                        initiateTranspileAction(p, null, true);
                    }
                    else {
                        console.log('running!!');
                        runTestWithSuman([p]);
                    }
                });

                watcher.on('unlink', p => {
                    log(`File ${p} has been removed`);
                    initiateTranspileAction([], {all: true});
                });

                watcher.on('addDir', p => {
                    log(`Directory ${p} has been added.`);
                    initiateTranspileAction(p);
                });

                watcher.on('unlinkDir', p => {
                    log(`Directory ${p} has been removed`);
                    initiateTranspileAction([], {all: true});
                });

                watcher.on('error', error => {
                    log(`chokidar watcher error: ${error}`)
                });

                watcher.on('ready', () => {
                    log('Initial scan complete. Ready for changes');
                    const watched = watcher.getWatched();
                    console.log('Watched paths:', watched);

                    (function (w) {
                        Object.keys(w).forEach(function (key) {
                            const array = w[key];
                            array.forEach(function (p) {
                                const temp = path.resolve(key + '/' + p);
                                console.log(' => The following file path is being saved as { transpile:', transpile, '} =>', temp);
                                pathHash[temp] = {
                                    transpile: transpile
                                }
                            });

                        });
                    })(watched);

                });

                watcher.on('raw', (event, p, details) => {
                    if (['.log', '.txt'].indexOf(path.extname(p)) < 0) {
                        log('\n\nRaw event info:', event, p, details, '\n\n');
                    }

                });
            }

        });

        socket.on('TEST_DATA', function (data) {

            try {
                var json = JSON.stringify(data.test);

                if (data.outputPath) {

                    //TODO: this functionality needs to mirror writing to disk in suman test runner etc

                    console.log('TEST_DATA received - data.outputPath:', data.outputPath);

                    process.nextTick(function () {
                        socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
                    });

                    // fs.appendFile(data.outputPath, json += ',', function (err) {
                    //     if (err) {
                    //         console.error(err.stack);
                    //         socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
                    //     }
                    //     else {
                    //         //req.sumanData.success = {msg: 'appended data to ' + data.outputPath};
                    //         socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
                    //     }
                    // });
                }
                else {
                    console.error(new Error('no output p for test data: ' + JSON.stringify(data)).stack);
                }
            }
            catch (err) {
                console.error(err.stack);
                socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
            }

        });

    });

};