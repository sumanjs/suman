/**
 * Created by denman on 1/1/2016.
 */

var suman = require('./lib');

suman.Server({
    configPath: './suman.conf.js'
}).on('message', function (msg) {
    console.log('msg from suman server', msg);
});