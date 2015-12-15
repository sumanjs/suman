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


ee.on('suman-complete', function(obj){


    console.log('suman-complete listener...');

});


function makeComplete(obj,cb){

    var config = obj.config;
    var timestamp = obj.timestamp;

    console.log('obj!!!:',obj);

    var files = [];

    var folderPath = config.outputDir + '/' + timestamp;
    var dir = path.resolve(path.resolve(appRootPath + '/' + folderPath));

    if (fs.statSync(dir).isFile()) {
        files.push(dir);
    }
    else{
        fs.readdirSync(dir).forEach(function (file) {
            files.push(path.resolve(dir + '/' + file));
        });
    }

    var file = fs.readFileSync(path.resolve(appRootPath + '/view/template.ejs'), 'ascii');
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
        cp.exec('open -a Firefox ' + url.resolve('http://localhost:6969/',folderPath), function (one, two, three) {
            console.log(arguments);
            //ee.emit('suman-end');
            cb(null);
        });
    }
    else{
        //ee.emit('suman-end');
        cb(null);
    }
}


module.exports = {
    makeComplete: makeComplete
};