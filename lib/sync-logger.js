/**
 * Created by amills001c on 1/28/16.
 */


var fs = require('fs');

var stream = fs.createReadStream('/dev/null').pipe(process.stdout);

var messages = [];
var okToWrite = true;

process.stdout.on('finish', function () {

    okToWrite = true;
    if (messages.length > 0) {
        runnerLog(messages.pop());
    }

});

module.exports = function runnerLog(data) {

    if (true) {
        okToWrite = false;
        process.stdout.write(String(data));
        //process.stdout.end();
    }
    else {
        messages.push(data);
    }

};