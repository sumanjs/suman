/**
 * Created by amills001c on 12/14/15.
 */


var ee = require('./ee');
var cp = require('child_process');
var ejs = require('ejs');
var path = require('path');
var appRootPath = require('app-root-path');
var fs = require('fs');
var _ = require('underscore');
var url = require('url');
var os = require('os');
var async = require('async');
var request = require('request');

//TODO: http://stackoverflow.com/questions/19275776/node-js-how-to-get-the-os-platforms-user-data-folder


ee.on('suman-complete', function (obj) {
    console.log('suman-complete listener...');
});


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

    var server = config.server;

    if (server && server.outputDir) {
        doBrowserThing(server.outputDir);
    }
    else {
        callback();
    }


    function doBrowserThing(outputDir) {

        var files = [];

        var appRootPathTemp = path.resolve(String(appRootPath));

        var folderPath = outputDir + '/' + timestamp;
        var dir = path.resolve(process.env.HOME + '/' + folderPath);

        var x = path.resolve(process.env.HOME + '/' + outputDir);

        if (fs.statSync(dir).isFile()) {
            //files.push(reconcilePath(appRootPathTemp, dir));
            files.push(dir); //TODO: when would it ever be a file?
        }
        else {
            fs.readdirSync(dir).forEach(function (file) {
                files.push(path.normalize('/results/' + reconcilePath(x, path.resolve(dir + '/' + file))));
                //files.push(path.resolve(dir + '/' + file));
            });
        }


        var SUMAN_ENV = null;

        async.parallel([function (cb) {

            cb = _.once(cb);

            var location = null;
            if (os.platform() === 'win32') {
                location = path.resolve(process.env.APPDATA + '/suman_data');
            }
            else {
                location = path.resolve((process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : '/var/local') + '/suman_data');
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
                            url: 'http://localhost:6969/results/finalize',
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
                        var file = path.resolve(process.env.HOME + '/' + folderPath + '/temp.html');
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
                    process.stdout.write('\n\n(data on disk shows browser was opened already)\n\n');
                    callback(null);
                }
                else if (!usingLiveSumanServer) {
                    process.stdout.write('\n\n(suman server is not live)\n\n');
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
                    cp.exec('start chrome ' + '"' + url.resolve('http://localhost:6969/', folderPath) + '"', function (error, stdout, stderr) {
                        //ee.emit('suman-end');
                        callback(null);
                    });
                }
                else {
                    cp.exec('open -a Firefox ' + url.resolve('http://localhost:6969/', folderPath), function (error, stdout, stderr) {
                        //ee.emit('suman-end');
                        callback(null);
                    });
                }
            }
        }
    }

}


module.exports = {
    makeComplete: makeComplete
};