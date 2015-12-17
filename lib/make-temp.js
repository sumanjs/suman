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


ee.on('suman-complete', function(obj){
    console.log('suman-complete listener...');
});


function truncatePath(appRoot,fullPath){

    var split1 = String(appRoot).split('/');
    var split2 = String(fullPath).split('/');

    var newArray = [];

    split2.forEach(function(token,index){

        var otherToken = null;
        try{
            otherToken = split1[index];
            if(token !== otherToken){
                newArray.push(token);
            }
        }
        catch(err){
            newArray.push(token);
        }

    });

    return newArray.join('/');
}

function makeComplete(obj,cb){

    cb = _.once(cb);

    var config = obj.config;
    var timestamp = obj.timestamp;

    console.log('obj!!!:',obj);

    var files = [];

    var folderPath = config.outputDir + '/' + timestamp;
    var dir = path.resolve(path.resolve(appRootPath + '/' + folderPath));

    if (fs.statSync(dir).isFile()) {
        files.push(truncatePath(appRootPath,dir));
    }
    else{
        fs.readdirSync(dir).forEach(function (file) {
            files.push(truncatePath(appRootPath,path.resolve(dir + '/' + file)));
        });
    }

    var file = fs.readFileSync(path.resolve(appRootPath + '/views/template.ejs'), 'ascii');
    var rendered = ejs.render(file, {data: JSON.stringify(files)});
    fs.writeFileSync(path.resolve(appRootPath + '/' + folderPath + '/temp.html'), rendered);

    var autoOpen = true;

    if (process.argv.indexOf('--dao') !== -1) { //does our flag exist?
        autoOpen = false;
    }
    else{
        if(config.disableAutoOpen){
            autoOpen = false;
        }
    }

    if(autoOpen){
        if(os.platform() === 'win32'){
            cp.exec('start chrome ' + '"' + url.resolve('http://localhost:6969/',folderPath) + '"', function (error, stdout, stderr) {
                console.log(arguments);
                //ee.emit('suman-end');
                cb(null);
            });
        }
        else{
            cp.exec('open -a Firefox ' + url.resolve('http://localhost:6969/',folderPath), function (error, stdout, stderr) {
                console.log(arguments);
                //ee.emit('suman-end');
                cb(null);
            });
        }
    }
    else{
        //ee.emit('suman-end');
        cb(null);
    }
}


module.exports = {
    makeComplete: makeComplete
};