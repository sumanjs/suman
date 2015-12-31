/**
 * Created by denman on 12/30/2015.
 */


var suman = require('./lib');

suman.Server({
    configPath: './suman.conf.js'
}).on('message', function (msg) {
    console.log('msg from suman server', msg);
});