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

    var output = config.output;

    if (output && output.web) {
        doBrowserThing();
    }
    else {
        callback();
    }


    function doBrowserThing() {
        var outputDir = output.web.outputDir;

        var files = [];

        var appRootPathTemp = path.resolve(String(appRootPath));

        var folderPath = outputDir + '/' + timestamp;
        var dir = path.resolve(appRootPath + '/' + folderPath);

        if (fs.statSync(dir).isFile()) {
            files.push(reconcilePath(appRootPathTemp, dir));
        }
        else {
            fs.readdirSync(dir).forEach(function (file) {
                files.push(reconcilePath(appRootPathTemp, path.resolve(dir + '/' + file)));
            });
        }

        /*    var SUMAN_ENV = null;
         SUMAN_ENV = process.env.SUMAN_ENV;
         if (SUMAN_ENV) {
         cb(null);
         }
         else {
         cp.exec('setx SUMAN_ENV ' + JSON.stringify({"date": Date.now()}) + ' /m', function (err) {
         cb(err);
         });
         }*/

        var SUMAN_ENV = null;

        async.parallel([function (cb) {

            cb = _.once(cb);

            var location = null;
            if (os.platform() === 'win32') {
                location = path.resolve(process.env.APPDATA + '/suman_data');
            }
            else {

            }

            fs.readFile(location, 'utf-8', (err, data) => {  //  var file = fs.readFileSync(path.resolve(__dirname + '/../server/views/template.ejs'), 'ascii');

                if (err) {
                    console.error(err.stack);
                }

                data = JSON.parse(data || '{}');
                if (data.date && ((Date.now() - data.date) < 3300000 )) {
                    SUMAN_ENV = data;
                    cb(null);
                }
                else {
                    data = JSON.stringify({date: Date.now()});
                    var str = fs.createWriteStream(location).on('error', function (err) {
                        cb(err);
                    }).on('finish', function () {
                        cb(null);
                    });

                    str.write(data);
                    str.end();
                }

            });


        }, function (cb) {
            async.waterfall([
                function (cb) {
                    var file = path.resolve(__dirname + '/../server/views/template.ejs');
                    fs.readFile(file, 'utf-8', (err, data) => {  //  var file = fs.readFileSync(path.resolve(__dirname + '/../server/views/template.ejs'), 'ascii');
                        err ? cb(err) : cb(null, data);
                    });
                },
                function (file, cb) {
                    var rendered = ejs.render(file, {data: JSON.stringify(files)});
                    var file = path.resolve(appRootPath + '/' + folderPath + '/temp.html');
                    fs.writeFile(file, rendered, (err) => {
                        cb(err);
                    });
                }

            ], function complete(err) {
                cb(err);
            });

        }], function complete(err) {

            if (err) {
                console.error(err.stack);
                callback(err);
            }
            else {
                if (SUMAN_ENV) {
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