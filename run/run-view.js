/**
 * Created by amills001c on 12/10/15.
 */


var cp = require('child_process');
var ejs = require('ejs');
var path = require('path');
var appRootPath = require('app-root-path');
var fs = require('fs');

//we need config file to determine where results/output folder is

//timestamp identifier
var timestamp = Date.now();

var files = [];

var folderPath = null;

if (process.argv.indexOf('--fp') !== -1) { //does our flag exist?
     folderPath = process.argv[process.argv.indexOf('--fp') + 1]; //grab the next item
}
else{
    folderPath = '/results/' + timestamp;
}

var dir = path.resolve(path.resolve(appRootPath + '/' + folderPath));

if (fs.statSync(dir).isFile()) {
    files.push(dir);
}
else{
    fs.readdirSync(dir).forEach(function (file) {
        files.push(path.resolve(dir + '/' + file));
    });
}


var file = fs.readFileSync(path.resolve(appRootPath + '/views/template.ejs'), 'ascii');
var rendered = ejs.render(file, {data: JSON.stringify(files)});
//fs.mkdirSync(path.resolve(appRootPath + '/results/' + String(timestamp)));
fs.writeFileSync(path.resolve(appRootPath + '/results/' + String(timestamp) + '/temp.html'), rendered);


//--allow-file-access-from-files


//cp.exec('open -a Google\\ Chrome  results/temp.html', function (one, two, three) {
//
//
//    console.log(arguments);
//
//
//});

//cp.exec('open -a Firefox results/temp.html', function (one, two, three) {
//
//
//    console.log(arguments);
//
//
//});

cp.exec('open -a Firefox http://localhost:6969/results/' + String(timestamp), function (one, two, three) {


    console.log(arguments);


});


