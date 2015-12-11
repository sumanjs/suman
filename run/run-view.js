/**
 * Created by amills001c on 12/10/15.
 */


var cp = require('child_process');
var ejs = require('ejs');
var path = require('path');
var appRootPath = require('app-root-path');
var fs = require('fs');
var args = process.argv.splice(2);


var files = [];

if (args.indexOf('--fp') !== -1) { //does our flag exist?
    var folderPath = args[args.indexOf('--fp') + 1]; //grab the next item

    var dir = path.resolve(path.resolve(appRootPath + '/' + folderPath));

    if (fs.statSync(dir).isFile()) {
        files.push(dir);
    }
    else{

        fs.readdirSync(dir).forEach(function (file) {
            files.push(path.resolve(dir + '/' + file));
        });
    }
}
else{
    throw new Error('need to pass --fp option')
}

var timestamp = Date.now();

var file = fs.readFileSync(path.resolve(appRootPath + '/view/template.ejs'), 'ascii');
var rendered = ejs.render(file, {data: JSON.stringify(files)});
fs.writeFileSync(path.resolve(appRootPath + '/view/results/' + String(timestamp) + '.html'), rendered);



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


