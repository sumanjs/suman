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

function makeComplete(obj, cb) {

    var errs = [];

    try {

        cb = _.once(cb);

        var config = obj.config;
        var timestamp = obj.timestamp;

        var output = config.output;

        if (output && output.web) {

            try {

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

                var file = fs.readFileSync(path.resolve(__dirname + '/../views/template.ejs'), 'ascii');
                var rendered = ejs.render(file, {data: JSON.stringify(files)});

                try {
                    fs.writeFileSync(path.resolve(appRootPath + '/' + folderPath + '/temp.html'), rendered);
                }
                catch (err) {
                    errs.push(err);
                    return;
                }

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
                            cb(null);
                        });
                    }
                    else {
                        cp.exec('open -a Firefox ' + url.resolve('http://localhost:6969/', folderPath), function (error, stdout, stderr) {
                            //ee.emit('suman-end');
                            cb(null);
                        });
                    }
                }
                else {
                    //ee.emit('suman-end');
                    cb(null);
                }
            }
            catch (err) {
                errs.push(err);
                return;
            }
        }

    }
    catch(err){
        console.error(err);
        errs.push(err);
    }
    finally{
        cb(errs);
    }


}


module.exports = {
    makeComplete: makeComplete
};