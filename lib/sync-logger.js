'use strict';

//core
const fs = require('fs');


//var stream = fs.createReadStream('/dev/null').pipe(process.stdout);
//////////////////////////////////////////////////////////////////////////


var messages = [];
var okToWrite = true;


module.exports = {


    log: function runnerLog(data) {
        process.stdout.write(String(data));
    },

    logArray: function logArray(arr) {
        arr.forEach(function (data) {
            process.stdout.write('\n\t' + String(data));
        });
    }


};