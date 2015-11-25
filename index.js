/**
 * Created by amills001c on 11/24/15.
 */


//module.exports = require('./lib/ntf');

var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');


function makeSuman(module, configPath) {


    var config = require(path.resolve(appRootPath + '/' + configPath));
    var outputDir = config.outputDir;
    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + path.basename(module.filename, '.js') + '.txt')

    var wstream = fs.createWriteStream(outputPath);

    return {
        log: function (data) {
            wstream.write(data);
            wstream.write('\n');
        },
        describe: require('./lib/ntf')

    }


}

makeSuman.Runner = require('./lib/runner');

module.exports =  makeSuman;