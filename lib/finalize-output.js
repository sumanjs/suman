/**
 * Created by denman on 12/14/15.
 */


//core
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const url = require('url');
const os = require('os');

//npm
const async = require('async');
const request = require('request');
const _ = require('underscore');
const ejs = require('ejs');

//project
const sumanUtils = require('./utils');
const runnerLog = require('./sync-logger');


//TODO: http://stackoverflow.com/questions/19275776/node-js-how-to-get-the-os-platforms-user-data-folder

module.exports = function makeFinalizeOutput(ee) {

    function reconcilePath(appRoot, fullPath) {

        var split1 = path.normalize(String(appRoot)).split(path.sep);
        var split2 = path.normalize(String(fullPath)).split(path.sep);

        var newArray = [];

        split2.forEach(function (token, index) {

            var otherToken = null;
            try {
                otherToken = split1[index];
                if (token !== otherToken) {
                    newArray.push(token);
                }
            }
            catch (err) {
                newArray.push(token);
            }

        });

        var sep = String(path.sep); //need to assign path.sep to temporary local variable so we don't overwrite value for path.sep below
        return sep += newArray.join(path.sep);
    }


    function makeComplete(obj, callback) {

        var errs = [];

        callback = _.once(callback);

        var config = obj.config;
        var timestamp = obj.timestamp;
        var usingLiveSumanServer = obj.usingLiveSumanServer;
        var allFiles = obj.allFiles;

        var server = obj.server;

        var host = null;
        var port = null;

        //TODO is server.outputDir is not defined... then we won't write results temp.html out?!?

        if (usingLiveSumanServer && server) {

            host = server.host;
            port = server.port;

            doBrowserThing(server.outputDir);

        }

        //else if (config.servers && config.servers[os.hostname()]) {
        //
        //    doBrowserThing(config.servers[os.hostname()].outputDir);
        //}

        else if (server) {

            host = server.host;
            port = server.port;

            doBrowserThing(server.outputDir);

        }
        else {
            console.error('\n\nSuman warning: no server defined..using default dir to store data.\n');

            doBrowserThing(path.resolve(sumanUtils.getHomeDir() + '/suman_results'));

        }


        function doBrowserThing(outputDir) {


            var resultsPath = '/results/' + timestamp;
            var folderPath = outputDir + '/' + timestamp;

            var files = allFiles.map(function (file) {
                return path.normalize('/results/' + timestamp + '/' + path.basename(file, '.js') + '.txt');
            });

            var SUMAN_ENV = null;

            async.parallel([function (cb) {

                cb = _.once(cb);

                var location = null;
                if (os.platform() === 'win32') {
                    location = path.resolve(process.env.APPDATA + '/suman_data');
                }
                else {
                    location = path.resolve((process.platform === 'darwin' ? sumanUtils.getHomeDir() + '/Library/Preferences' : '/var/local') + '/suman_data');
                }

                fs.readFile(location, 'utf-8', (err, data) => {  //  var file = fs.readFileSync(path.resolve(__dirname + '/../server/views/template.ejs'), 'ascii');

                    if (err && err.code !== 'ENOENT') {
                        console.error(err.stack);
                        cb(err);
                    }
                    else {
                        data = JSON.parse(data || '{}');

                        if ((data.date && ((Date.now() - data.date) < 3300000 )) && usingLiveSumanServer) {
                            SUMAN_ENV = data;
                            cb(null);
                        }
                        else {
                            data = usingLiveSumanServer ? JSON.stringify({date: Date.now()}) : JSON.stringify({notLive: true});

                            var strm = fs.createWriteStream(location).on('error', function (err) {
                                cb(err);
                            }).on('finish', function () {
                                cb(null);
                            });

                            strm.write(data);
                            strm.end();

                        }
                    }

                });


            }, function (cb) {

                async.waterfall([
                    function (cb) {
                        try {
                            var file = path.resolve(__dirname + '/../server/views/template.ejs');
                            fs.readFile(file, 'utf-8', function (err, data) {  //  var file = fs.readFileSync(path.resolve(__dirname + '/../server/views/template.ejs'), 'ascii');
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    cb(null, data);
                                }
                            });
                        }
                        catch (err) {
                            cb(err);
                        }
                    },
                    function (data, cb) {
                        var rendered = ejs.render(data, {data: JSON.stringify(files)});
                        if (usingLiveSumanServer) {
                            request.post({
                                url: 'http://' + host + ':' + port + '/results/finalize',
                                json: {
                                    timestamp: timestamp,
                                    rendered: rendered,
                                    config: config
                                }
                            }, function (err, resp, body) {
                                cb(err);
                            });
                        }
                        else {
                            var file = path.resolve(folderPath + '/temp.html');
                            fs.writeFile(file, rendered, function (err) {
                                cb(err);
                            });
                        }
                    }], function complete(err) {
                    cb(err);
                });

            }], function complete(err) {

                if (err) {
                    console.error(err.stack);
                    callback(err);
                }
                else {
                    if (SUMAN_ENV) {
                        runnerLog('\n\n\t(note: data on disk shows browser was opened already)\n\n');
                        callback(null);
                    }
                    else if (!usingLiveSumanServer) {
                        //TODO: also log path of where data was saved to
                        runnerLog('\n\n\n\t(note: local suman server is not live)\n');
                        callback(null);
                    }
                    else {
                        openBrowser(function (err) {
                            callback(err);
                        });
                    }
                }

            });

            function openBrowser(cb) {

                var autoOpen = true;

                if (process.argv.indexOf('--dao') !== -1) { //does our flag exist?
                    autoOpen = false;
                }
                else {
                    if (config.disableAutoOpen) {
                        autoOpen = false;
                    }
                }

                if (autoOpen) {
                    if (os.platform() === 'win32') {
                        cp.exec('start chrome ' + '"' + url.resolve('http://' + host + ':' + port, resultsPath) + '"', function (error, stdout, stderr) {
                            //ee.emit('suman-end');
                            callback(null);
                        });
                    }
                    else {
                        cp.exec('open -a Firefox ' + url.resolve('http://' + host + ':' + port, resultsPath), function (error, stdout, stderr) {
                            //ee.emit('suman-end');
                            callback(null);
                        });
                    }
                }
            }
        }

    }


    return {
        makeComplete: makeComplete
    };

};

